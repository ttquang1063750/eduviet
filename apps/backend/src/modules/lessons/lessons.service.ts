import { PrismaClient } from '@prisma/client';
import { UserRole } from '@eduviet/shared-types';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { LessonsRepository, LessonFilters } from './lessons.repository.js';

const ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'CONTENT_CREATOR',
  'CONTENT_REVIEWER',
  'CONTENT_APPROVER',
];

function buildSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) +
    '-' +
    Date.now()
  );
}

export class LessonsService {
  private readonly repo: LessonsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new LessonsRepository(prisma);
  }

  /** Danh sách bài học, lọc status dựa theo quyền người dùng */
  async list(
    query: Omit<LessonFilters, 'statuses'> & { status?: string },
    userRoles?: UserRole[],
    userId?: string
  ) {
    let statuses: string[];
    let studentContext: LessonFilters['studentContext'] | undefined;

    const isPrivileged = userRoles?.some((r) => ADMIN_ROLES.includes(r));
    const isStudent = userRoles?.includes('STUDENT');

    if (isPrivileged) {
      statuses = query.status
        ? [query.status]
        : ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
    } else {
      statuses = ['PUBLISHED'];

      if (isStudent && userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId, deletedAt: null },
          select: {
            schoolId: true,
            enrollments: {
              select: { classId: true },
            },
          },
        });

        if (user) {
          studentContext = {
            userId,
            schoolId: user.schoolId,
            classIds: user.enrollments.map((e) => e.classId),
          };
        }
      }
    }

    const { page, perPage, subject, grade, difficulty, search } = query;
    const { lessons, total } = await this.repo.findMany({
      page,
      perPage,
      subject,
      grade,
      difficulty,
      statuses,
      search,
      studentContext,
    });

    return {
      data: lessons,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /** Chi tiết bài học theo slug */
  async getBySlug(slug: string, userRoles?: UserRole[]) {
    const lesson = await this.repo.findBySlug(slug);
    if (!lesson) throw AppError.notFound('Bài học');

    const isPrivileged = userRoles?.some((r) => ADMIN_ROLES.includes(r));
    if (lesson.status !== 'PUBLISHED' && !isPrivileged) {
      throw AppError.forbidden('Bạn không có quyền xem bài học này');
    }

    // Admin: trả đầy đủ kể cả correctAnswer
    if (isPrivileged) {
      return lesson;
    }

    // Student: ẩn correctAnswer và shuffle nếu randomizeQuestions=true
    type LessonWithQs = typeof lesson & {
      randomizeQuestions: boolean;
      lessonQuestions: Array<{ question: Record<string, unknown>; questionId: string; [k: string]: unknown }>;
    };
    const lessonExt = lesson as unknown as LessonWithQs;

    let lessonQuestions = lessonExt.lessonQuestions.map(({ question, ...lq }) => ({
      ...lq,
      question: (({ correctAnswer: _ca, ...q }: Record<string, unknown>) => q)(question),
    }));

    if (lessonExt.randomizeQuestions) {
      for (let i = lessonQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lessonQuestions[i], lessonQuestions[j]] = [lessonQuestions[j], lessonQuestions[i]];
      }
    }

    return { ...lesson, lessonQuestions } as unknown as typeof lesson;
  }

  /** Chi tiết bài học theo ID */
  async getById(id: string) {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw AppError.notFound('Bài học');
    return lesson;
  }

  /** Danh sách câu hỏi của bài học (admin only) */
  async getLessonQuestions(lessonId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ADMIN_ROLES.includes(r));
    if (!isAllowed) throw AppError.forbidden('Bạn không có quyền xem câu hỏi bài học');

    const lesson = await this.repo.findById(lessonId);
    if (!lesson) throw AppError.notFound('Bài học');

    return this.repo.findLessonQuestions(lessonId);
  }

  /** Gắn câu hỏi vào bài học */
  async addQuestionToLesson(lessonId: string, questionId: string, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ADMIN_ROLES.includes(r));
    if (!isAllowed) throw AppError.forbidden('Bạn không có quyền thêm câu hỏi vào bài học');

    const lesson = await this.repo.findById(lessonId);
    if (!lesson) throw AppError.notFound('Bài học');

    const question = await (this.prisma as unknown as Record<string, { findUnique: (a: unknown) => Promise<unknown> }>)['question']
      .findUnique({ where: { id: questionId, deletedAt: null } });
    if (!question) throw AppError.notFound('Câu hỏi');

    try {
      const link = await this.repo.addQuestionToLesson(lessonId, questionId);

      await writeAuditLog(this.prisma, {
        userId: actorId,
        action: 'LESSON_QUESTION_ADDED',
        resourceType: 'LESSON',
        resourceId: lessonId,
        details: { questionId },
      });

      return link;
    } catch (err: unknown) {
      // Unique constraint violation — câu hỏi đã tồn tại trong bài
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new AppError(409, 'CONFLICT', 'Câu hỏi đã được thêm vào bài học này');
      }
      throw err;
    }
  }

  /** Gỡ câu hỏi khỏi bài học */
  async removeQuestionFromLesson(lessonId: string, questionId: string, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ADMIN_ROLES.includes(r));
    if (!isAllowed) throw AppError.forbidden('Bạn không có quyền gỡ câu hỏi khỏi bài học');

    const lesson = await this.repo.findById(lessonId);
    if (!lesson) throw AppError.notFound('Bài học');

    await this.repo.removeQuestionFromLesson(lessonId, questionId);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_QUESTION_REMOVED',
      resourceType: 'LESSON',
      resourceId: lessonId,
      details: { questionId },
    });
  }

  /** Sắp xếp thứ tự câu hỏi */
  async reorderLessonQuestions(lessonId: string, orderedIds: string[], actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ADMIN_ROLES.includes(r));
    if (!isAllowed) throw AppError.forbidden('Bạn không có quyền sắp xếp câu hỏi');

    const lesson = await this.repo.findById(lessonId);
    if (!lesson) throw AppError.notFound('Bài học');

    await this.repo.reorderLessonQuestions(lessonId, orderedIds);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_QUESTIONS_REORDERED',
      resourceType: 'LESSON',
      resourceId: lessonId,
    });
  }

  /** Bật/tắt randomize câu hỏi */
  async setRandomize(lessonId: string, randomize: boolean, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ADMIN_ROLES.includes(r));
    if (!isAllowed) throw AppError.forbidden('Bạn không có quyền thay đổi cài đặt bài học');

    const lesson = await this.repo.findById(lessonId);
    if (!lesson) throw AppError.notFound('Bài học');

    const updated = await this.repo.setRandomize(lessonId, randomize);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_RANDOMIZE_TOGGLED',
      resourceType: 'LESSON',
      resourceId: lessonId,
      details: { randomize },
    });

    return updated;
  }

  /** Tạo bài học mới (DRAFT) */
  async create(
    data: {
      title: string;
      subjectId: string;
      grade: number;
      topic: string;
      difficulty: string;
      theory: string;
      estimatedMinutes: number;
    },
    creatorId: string
  ) {
    const slug = buildSlug(data.title);
    const lesson = await this.repo.create({ ...data, slug, creatorId, status: 'DRAFT' });

    await writeAuditLog(this.prisma, {
      userId: creatorId,
      action: 'LESSON_CREATED',
      resourceType: 'LESSON',
      resourceId: lesson.id,
    });

    return lesson;
  }

  /** Gửi bài lên REVIEW */
  async submitForReview(id: string, requesterId: string) {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw AppError.notFound('Bài học');
    if (lesson.status !== 'DRAFT' && lesson.status !== 'REJECTED') {
      throw AppError.conflict('Bài học không ở trạng thái có thể submit');
    }

    const updated = await this.repo.updateStatus(id, 'IN_REVIEW');

    await writeAuditLog(this.prisma, {
      userId: requesterId,
      action: 'LESSON_SUBMITTED_REVIEW',
      resourceType: 'LESSON',
      resourceId: id,
    });

    return updated;
  }

  /** Reviewer approve / reject */
  async review(
    id: string,
    reviewerId: string,
    action: 'approve' | 'reject',
    note?: string
  ) {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw AppError.notFound('Bài học');
    if (lesson.status !== 'IN_REVIEW') {
      throw AppError.conflict('Bài học không ở trạng thái chờ review');
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const updated = await this.repo.updateStatus(id, newStatus, {
      reviewerId,
      reviewNote: note,
    });

    await writeAuditLog(this.prisma, {
      userId: reviewerId,
      action: action === 'approve' ? 'LESSON_APPROVED' : 'LESSON_REJECTED',
      resourceType: 'LESSON',
      resourceId: id,
      details: note ? { note } : undefined,
    });

    return updated;
  }

  /** Approver publish */
  async publish(id: string, approverId: string) {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw AppError.notFound('Bài học');
    if (lesson.status !== 'APPROVED') {
      throw AppError.conflict('Bài học chưa được review approve');
    }

    const updated = await this.repo.updateStatus(id, 'PUBLISHED', {
      publishedAt: new Date(),
    });

    await writeAuditLog(this.prisma, {
      userId: approverId,
      action: 'LESSON_PUBLISHED',
      resourceType: 'LESSON',
      resourceId: id,
    });

    return updated;
  }

  /** Cập nhật thông tin bài học */
  async update(id: string, data: any, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ADMIN_ROLES.includes(r));
    if (!isAllowed) throw AppError.forbidden('Bạn không có quyền sửa bài học');

    const lesson = await this.repo.findById(id);
    if (!lesson) throw AppError.notFound('Bài học');

    // Nếu đổi title, build lại slug
    const updateData = { ...data };
    if (data.title && data.title !== lesson.title) {
      updateData.slug = buildSlug(data.title);
    }

    const updated = await this.repo.update(id, updateData);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_UPDATED',
      resourceType: 'LESSON',
      resourceId: id,
      details: data,
    });

    return updated;
  }

  /** Gán reviewer cho bài học */
  async assignReviewer(id: string, reviewerId: string, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_APPROVER'].includes(r));
    if (!isAllowed) throw AppError.forbidden('Bạn không có quyền gán reviewer');

    const lesson = await this.repo.findById(id);
    if (!lesson) throw AppError.notFound('Bài học');

    // Verify reviewer exists and has review role
    const reviewer = await this.prisma.user.findUnique({ where: { id: reviewerId, deletedAt: null } });
    if (!reviewer) throw AppError.notFound('Người duyệt');
    
    const reviewerRoles = (reviewer.roles as string[]) || [];
    if (!reviewerRoles.includes('CONTENT_REVIEWER') && !reviewerRoles.includes('SUPER_ADMIN')) {
      throw AppError.validation('Người dùng này không có quyền review nội dung');
    }

    const updated = await this.repo.updateStatus(id, lesson.status, { reviewerId });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_REVIEWER_ASSIGNED',
      resourceType: 'LESSON',
      resourceId: id,
      details: { reviewerId },
    });

    return updated;
  }
}
