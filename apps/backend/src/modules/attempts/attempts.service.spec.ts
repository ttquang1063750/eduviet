import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttemptsService } from './attempts.service';
import { AppError } from '../../shared/errors/app-error';

// ── Mock PrismaClient ────────────────────────────────────────────────────────

const mockPrisma = {
  lesson: { findUnique: vi.fn() },
  attempt: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  attemptAnswer: {
    upsert: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  lessonQuestion: { findMany: vi.fn() },
  $transaction: vi.fn((calls: Promise<unknown>[]) => Promise.all(calls)),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AttemptsService', () => {
  let service: AttemptsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AttemptsService(mockPrisma as never);
  });

  // ── startAttempt ─────────────────────────────────────────────────────────

  describe('startAttempt', () => {
    it('throw NotFound khi lesson không tồn tại', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);
      await expect(service.startAttempt('u1', 'l1', 'PRACTICE')).rejects.toBeInstanceOf(AppError);
    });

    it('throw BadRequest khi MOCK_EXAM và lesson không có timeLimitSec', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'l1', timeLimitSec: null, maxAttempts: 0 });
      await expect(service.startAttempt('u1', 'l1', 'MOCK_EXAM')).rejects.toMatchObject({
        message: expect.stringContaining('không hỗ trợ chế độ thi thử'),
      });
    });

    it('throw Forbidden khi MOCK_EXAM và đã hết lượt', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'l1', timeLimitSec: 3600, maxAttempts: 1 });
      mockPrisma.attempt.count.mockResolvedValue(1);
      await expect(service.startAttempt('u1', 'l1', 'MOCK_EXAM')).rejects.toMatchObject({
        message: expect.stringContaining('hết lượt thi thử'),
      });
    });

    it('tạo attempt thành công với PRACTICE mode', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({ id: 'l1', timeLimitSec: null, maxAttempts: 0 });
      mockPrisma.attempt.create.mockResolvedValue({ id: 'att1', mode: 'PRACTICE' });
      const result = await service.startAttempt('u1', 'l1', 'PRACTICE');
      expect(result).toMatchObject({ id: 'att1' });
    });
  });

  // ── submitAttempt ─────────────────────────────────────────────────────────

  describe('submitAttempt', () => {
    it('auto-grade SINGLE_CHOICE + MULTIPLE_CHOICE + FILL_IN_BLANK đúng sai chính xác', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({
        id: 'att1', studentId: 'u1', lessonId: 'l1', status: 'IN_PROGRESS',
      });
      mockPrisma.lessonQuestion.findMany.mockResolvedValue([
        { questionId: 'q1', question: { id: 'q1', type: 'SINGLE_CHOICE', correctAnswer: 'A', points: 10 } },
        { questionId: 'q2', question: { id: 'q2', type: 'MULTIPLE_CHOICE', correctAnswer: ['A', 'B'], points: 20 } },
        { questionId: 'q3', question: { id: 'q3', type: 'FILL_IN_BLANK', correctAnswer: 'hello', points: 10 } },
      ]);
      mockPrisma.attempt.update.mockResolvedValue({ id: 'att1', status: 'GRADED' });

      await service.submitAttempt('att1', 'u1', [
        { questionId: 'q1', answer: 'A' },         // ✅
        { questionId: 'q2', answer: ['A'] },        // ❌ thiếu 'B'
        { questionId: 'q3', answer: ' Hello ' },    // ✅ trim + case-insensitive
      ]);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'GRADED', totalScore: 20, maxScore: 40 }),
        }),
      );
    });

    it('status = SUBMITTED khi có subjective questions (ESSAY)', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({
        id: 'att1', studentId: 'u1', lessonId: 'l1', status: 'IN_PROGRESS',
      });
      mockPrisma.lessonQuestion.findMany.mockResolvedValue([
        { questionId: 'q1', question: { id: 'q1', type: 'ESSAY', points: 50 } },
      ]);
      mockPrisma.attempt.update.mockResolvedValue({ id: 'att1', status: 'SUBMITTED' });

      await service.submitAttempt('att1', 'u1', [{ questionId: 'q1', answer: 'My essay' }]);

      expect(mockPrisma.attempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUBMITTED' }),
        }),
      );
    });

    it('throw Forbidden khi studentId không khớp', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ id: 'att1', studentId: 'u2', status: 'IN_PROGRESS' });
      await expect(service.submitAttempt('att1', 'u1', [])).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throw BadRequest khi attempt đã SUBMITTED', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ id: 'att1', studentId: 'u1', status: 'SUBMITTED' });
      await expect(service.submitAttempt('att1', 'u1', [])).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── getResult ─────────────────────────────────────────────────────────────

  describe('getResult', () => {
    it('throw Forbidden nếu không phải owner và không phải staff', async () => {
      mockPrisma.attempt.findUnique.mockResolvedValue({ id: 'att1', studentId: 'u2' });
      await expect(service.getResult('att1', 'u1', ['STUDENT'])).rejects.toMatchObject({ statusCode: 403 });
    });

    it('ẩn correctAnswer khi TEST mode và student chưa được chấm xong', async () => {
      const answers = [
        { id: 'a1', questionId: 'q1', isCorrect: true, question: { id: 'q1', correctAnswer: 'A', explanation: 'x' } },
      ];
      mockPrisma.attempt.findUnique.mockResolvedValue({
        id: 'att1', studentId: 'u1', mode: 'TEST', status: 'SUBMITTED', answers,
      });
      const result = await service.getResult('att1', 'u1', ['STUDENT']);
      expect((result as { answers: { question: { correctAnswer: unknown } }[] }).answers[0].question.correctAnswer).toBeUndefined();
    });
  });
});
