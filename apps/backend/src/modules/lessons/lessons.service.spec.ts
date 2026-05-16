import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonsService } from './lessons.service';
import { AppError } from '../../shared/errors/app-error';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockLesson = {
  id: 'lesson-uuid-1',
  title: 'Phương trình bậc 2',
  slug: 'phuong-trinh-bac-2-1234567890',
  subjectId: 'subject-uuid-1',
  grade: 10,
  topic: 'Đại số',
  difficulty: 'MEDIUM' as const,
  theory: 'Lý thuyết phương trình bậc 2...',
  estimatedMinutes: 30,
  status: 'DRAFT' as const,
  creatorId: 'user-uuid-1',
  reviewerId: null,
  reviewNote: null,
  publishedAt: null,
  scheduledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  randomizeQuestions: false,
  lessonQuestions: [] as Array<{ questionId: string; question: Record<string, unknown>; orderIndex: number }>,
};

const mockPrisma = {
  lesson: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LessonsService', () => {
  let service: LessonsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LessonsService(mockPrisma as never);
  });

  // ── list() ──────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('chỉ trả về PUBLISHED cho user không có quyền', async () => {
      mockPrisma.lesson.findMany.mockResolvedValue([]);
      mockPrisma.lesson.count.mockResolvedValue(0);

      await service.list({ page: 1, perPage: 12 });

      const findManyCall = mockPrisma.lesson.findMany.mock.calls[0][0];
      expect(findManyCall.where.status.in).toEqual(['PUBLISHED']);
    });

    it('trả về tất cả status cho SUPER_ADMIN', async () => {
      mockPrisma.lesson.findMany.mockResolvedValue([]);
      mockPrisma.lesson.count.mockResolvedValue(0);

      await service.list({ page: 1, perPage: 12 }, ['SUPER_ADMIN']);

      const findManyCall = mockPrisma.lesson.findMany.mock.calls[0][0];
      expect(findManyCall.where.status.in).toContain('DRAFT');
      expect(findManyCall.where.status.in).toContain('PUBLISHED');
    });

    it('trả về meta pagination đúng', async () => {
      mockPrisma.lesson.findMany.mockResolvedValue([mockLesson]);
      mockPrisma.lesson.count.mockResolvedValue(25);

      const result = await service.list({ page: 2, perPage: 12 });

      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(2);
      expect(result.meta.perPage).toBe(12);
      expect(result.meta.totalPages).toBe(3); // ceil(25/12)
    });
  });

  // ── getBySlug() ─────────────────────────────────────────────────────────

  describe('getBySlug()', () => {
    it('throw NotFound khi bài học không tồn tại', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.getBySlug('non-existent')).rejects.toThrow(AppError);
      await expect(service.getBySlug('non-existent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    it('throw Forbidden khi bài học DRAFT và user không có quyền', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ ...mockLesson, status: 'DRAFT' });

      await expect(service.getBySlug('some-slug')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    });

    it('ẩn correctAnswer trong questions khi trả về cho student', async () => {
      const lessonWithQuestion = {
        ...mockLesson,
        status: 'PUBLISHED' as const,
        lessonQuestions: [
          {
            questionId: 'q-1',
            orderIndex: 0,
            question: { id: 'q-1', stem: 'Câu hỏi 1', correctAnswer: 'A', explanation: '...' },
          },
        ],
      };
      mockPrisma.lesson.findUnique.mockResolvedValue(lessonWithQuestion);

      const result = (await service.getBySlug('some-slug')) as unknown as {
        lessonQuestions: Array<{ question: Record<string, unknown> }>;
      };

      expect(result.lessonQuestions[0].question).not.toHaveProperty('correctAnswer');
    });
  });

  // ── create() ────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('tạo bài học với status DRAFT', async () => {
      mockPrisma.lesson.create.mockResolvedValue({ ...mockLesson, subject: { id: 'sub-1', name: 'Toán' } });

      const result = await service.create(
        { title: 'Phương trình bậc 2', subjectId: 'sub-1', grade: 10, topic: 'Đại số', difficulty: 'MEDIUM', theory: 'Lý thuyết...', estimatedMinutes: 30 },
        'creator-id'
      );

      const createCall = mockPrisma.lesson.create.mock.calls[0][0];
      expect(createCall.data.status).toBe('DRAFT');
      expect(createCall.data.creatorId).toBe('creator-id');
      expect(result).toBeDefined();
    });

    it('ghi audit log sau khi tạo', async () => {
      mockPrisma.lesson.create.mockResolvedValue({ ...mockLesson, subject: {} });

      await service.create(
        { title: 'Bài học test', subjectId: 'sub-1', grade: 10, topic: 'topic', difficulty: 'EASY', theory: 'theory...', estimatedMinutes: 15 },
        'creator-id'
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'LESSON_CREATED' }) })
      );
    });
  });

  // ── submitForReview() ────────────────────────────────────────────────────

  describe('submitForReview()', () => {
    it('throw NotFound khi bài học không tồn tại', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);
      await expect(service.submitForReview('bad-id', 'user-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throw Conflict khi bài học không phải DRAFT/REJECTED', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ ...mockLesson, status: 'IN_REVIEW' });
      await expect(service.submitForReview('lesson-uuid-1', 'user-1')).rejects.toMatchObject({ statusCode: 409 });
    });

    it('cập nhật status thành IN_REVIEW', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrisma.lesson.update.mockResolvedValue({ ...mockLesson, status: 'IN_REVIEW' });

      await service.submitForReview('lesson-uuid-1', 'user-1');

      expect(mockPrisma.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'IN_REVIEW' }) })
      );
    });
  });

  // ── review() ────────────────────────────────────────────────────────────

  describe('review()', () => {
    it('throw Conflict khi bài học không ở IN_REVIEW', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ ...mockLesson, status: 'DRAFT' });
      await expect(service.review('id', 'reviewer-1', 'approve')).rejects.toMatchObject({ statusCode: 409 });
    });

    it('approve → status APPROVED', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ ...mockLesson, status: 'IN_REVIEW' });
      mockPrisma.lesson.update.mockResolvedValue({ ...mockLesson, status: 'APPROVED' });

      await service.review('lesson-uuid-1', 'reviewer-1', 'approve');

      expect(mockPrisma.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED' }) })
      );
    });

    it('reject → status REJECTED', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ ...mockLesson, status: 'IN_REVIEW' });
      mockPrisma.lesson.update.mockResolvedValue({ ...mockLesson, status: 'REJECTED' });

      await service.review('lesson-uuid-1', 'reviewer-1', 'reject', 'Cần chỉnh sửa thêm');

      expect(mockPrisma.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) })
      );
    });
  });

  // ── publish() ────────────────────────────────────────────────────────────

  describe('publish()', () => {
    it('throw Conflict khi bài học chưa APPROVED', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ ...mockLesson, status: 'IN_REVIEW' });
      await expect(service.publish('id', 'approver-1')).rejects.toMatchObject({ statusCode: 409 });
    });

    it('set status PUBLISHED và publishedAt', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ ...mockLesson, status: 'APPROVED' });
      mockPrisma.lesson.update.mockResolvedValue({ ...mockLesson, status: 'PUBLISHED', publishedAt: new Date() });

      await service.publish('lesson-uuid-1', 'approver-1');

      const updateCall = mockPrisma.lesson.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('PUBLISHED');
      expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
    });
  });
});
