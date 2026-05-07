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
    userRole?: UserRole
  ) {
    let statuses: string[];

    const isPrivileged = userRole && ADMIN_ROLES.includes(userRole);
    if (isPrivileged) {
      statuses = query.status
        ? [query.status]
        : ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
    } else {
      statuses = ['PUBLISHED'];
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
  async getBySlug(slug: string, userRole?: UserRole) {
    const lesson = await this.repo.findBySlug(slug);
    if (!lesson) throw AppError.notFound('Bài học');

    const isPrivileged = userRole && ADMIN_ROLES.includes(userRole);
    if (lesson.status !== 'PUBLISHED' && !isPrivileged) {
      throw AppError.forbidden('Bạn không có quyền xem bài học này');
    }

    // Ẩn đáp án khi trả về cho học sinh
    return {
      ...lesson,
      exercises: lesson.exercises.map(({ correctAnswer: _ca, ...ex }) => ex),
    };
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
}
