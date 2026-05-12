import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionsService } from './questions.service.js';
import { AppError } from '../../shared/errors/app-error.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockQuestion = {
  id: 'q-uuid-1',
  subjectId: 'sub-uuid-1',
  type: 'SINGLE_CHOICE',
  content: 'Câu hỏi thử nghiệm?',
  options: [
    { id: 'a', text: 'Đáp án A' },
    { id: 'b', text: 'Đáp án B' },
    { id: 'c', text: 'Đáp án C' },
    { id: 'd', text: 'Đáp án D' },
  ],
  correctAnswer: 'a',
  explanation: 'Vì...',
  hints: [],
  points: 10,
  difficulty: 'MEDIUM',
  tags: ['Toán', 'Đại số'],
  creatorId: 'user-uuid-1',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSubject = {
  id: 'sub-uuid-1',
  name: 'Toán',
  nameEn: 'Math',
};

const mockRepo = {
  findMany: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
};

const mockPrisma = {
  subject: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ['SUPER_ADMIN'] as const;
const FORBIDDEN_ROLES = ['STUDENT'] as const;

// ── Tests ────────────────────────────────────────────────────────────────────

describe('QuestionsService', () => {
  let service: QuestionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new QuestionsService(mockPrisma as any);
    // Patch repo methods onto service (private field)
    (service as any).repo = mockRepo;
  });

  // ── list() ──────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('trả về danh sách câu hỏi với pagination khi có quyền', async () => {
      const total = 2;
      mockRepo.findMany.mockResolvedValue({ questions: [mockQuestion], total });

      const result = await service.list({}, [...ALLOWED_ROLES]);

      expect(mockRepo.findMany).toHaveBeenCalledOnce();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(total);
      expect(result.meta.page).toBe(1);
    });

    it('ném AppError.forbidden khi không có quyền', async () => {
      await expect(service.list({}, [...FORBIDDEN_ROLES]))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('ném AppError.forbidden khi userRoles là undefined', async () => {
      await expect(service.list({}))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('giới hạn perPage tối đa 100', async () => {
      mockRepo.findMany.mockResolvedValue({ questions: [], total: 0 });

      await service.list({ perPage: 999 }, [...ALLOWED_ROLES]);

      const callArg = mockRepo.findMany.mock.calls[0][0] as { perPage: number };
      expect(callArg.perPage).toBe(100);
    });
  });

  // ── getById() ────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('trả về câu hỏi khi có quyền và tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(mockQuestion);

      const result = await service.getById('q-uuid-1', [...ALLOWED_ROLES]);

      expect(result).toEqual(mockQuestion);
    });

    it('ném 403 khi không có quyền', async () => {
      await expect(service.getById('q-uuid-1', [...FORBIDDEN_ROLES]))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('ném 404 khi câu hỏi không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getById('not-found', [...ALLOWED_ROLES]))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createDto = {
      subjectId: 'sub-uuid-1',
      type: 'SINGLE_CHOICE',
      content: 'Câu hỏi mới',
      correctAnswer: 'a',
    };

    it('tạo câu hỏi thành công và ghi audit log', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);
      mockRepo.create.mockResolvedValue(mockQuestion);

      const result = await service.create(createDto, 'user-uuid-1', [...ALLOWED_ROLES]);

      expect(mockRepo.create).toHaveBeenCalledOnce();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
      expect(result).toEqual(mockQuestion);
    });

    it('ném 403 khi không có quyền', async () => {
      await expect(service.create(createDto, 'user-uuid-1', [...FORBIDDEN_ROLES]))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('ném 404 khi môn học không tồn tại', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-uuid-1', [...ALLOWED_ROLES]))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('cập nhật câu hỏi thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockQuestion);
      const updated = { ...mockQuestion, content: 'Câu hỏi đã sửa' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update('q-uuid-1', { content: 'Câu hỏi đã sửa' }, 'user-uuid-1', [...ALLOWED_ROLES]);

      expect(mockRepo.update).toHaveBeenCalledWith('q-uuid-1', expect.objectContaining({ content: 'Câu hỏi đã sửa' }));
      expect(result.content).toBe('Câu hỏi đã sửa');
    });

    it('ném 403 khi không có quyền', async () => {
      await expect(service.update('q-uuid-1', {}, 'user-uuid-1', [...FORBIDDEN_ROLES]))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('ném 404 khi câu hỏi không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('not-found', {}, 'user-uuid-1', [...ALLOWED_ROLES]))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── delete() ─────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('xóa mềm câu hỏi thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockQuestion);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await service.delete('q-uuid-1', 'user-uuid-1', [...ALLOWED_ROLES]);

      expect(mockRepo.softDelete).toHaveBeenCalledWith('q-uuid-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
    });

    it('ném 403 khi không có quyền', async () => {
      await expect(service.delete('q-uuid-1', 'user-uuid-1', [...FORBIDDEN_ROLES]))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('ném 404 khi câu hỏi không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('not-found', 'user-uuid-1', [...ALLOWED_ROLES]))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
