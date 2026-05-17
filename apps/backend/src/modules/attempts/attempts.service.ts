import { Prisma, PrismaClient } from '@prisma/client';
import { AttemptsRepository } from './attempts.repository';
import { AppError } from '../../shared/errors/app-error';
import { AttemptMode, AttemptStatus, QuestionType } from '@eduviet/shared-types';

type LessonQuestion = Awaited<ReturnType<AttemptsRepository['getLessonQuestions']>>[number];
type Q = LessonQuestion['question'];

export class AttemptsService {
  private repository: AttemptsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new AttemptsRepository(prisma);
  }

  async startAttempt(studentId: string, lessonId: string, mode: AttemptMode) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw AppError.notFound('Bài học không tồn tại');

    if (mode === 'MOCK_EXAM') {
      if (!lesson.timeLimitSec) {
        throw AppError.badRequest('Bài học này không hỗ trợ chế độ thi thử (thiếu giới hạn thời gian)');
      }
      if (lesson.maxAttempts > 0) {
        const count = await this.repository.countByStudentAndLesson(studentId, lessonId);
        if (count >= lesson.maxAttempts) {
          throw AppError.forbidden(`Bạn đã hết lượt thi thử (tối đa ${lesson.maxAttempts} lần)`);
        }
      }
    }

    return this.repository.create({
      studentId,
      lessonId,
      mode,
      timeLimitSec: lesson.timeLimitSec ?? undefined,
    });
  }

  async submitAttempt(
    attemptId: string,
    studentId: string,
    submittedAnswers: { questionId: string; answer: unknown }[],
  ) {
    const attempt = await this.repository.findById(attemptId);
    if (!attempt) throw AppError.notFound('Lượt làm bài không tồn tại');
    if (attempt.studentId !== studentId) throw AppError.forbidden('Bạn không có quyền nộp bài này');
    if (attempt.status !== 'IN_PROGRESS') throw AppError.badRequest('Lượt làm bài này đã được nộp');

    const lessonQs = await this.repository.getLessonQuestions(attempt.lessonId);
    const qMap = new Map(lessonQs.map((lq) => [lq.questionId, lq.question]));

    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers: { questionId: string; answer: Prisma.InputJsonValue | null; isCorrect: boolean | null; score: number | null }[] =
      submittedAnswers.map((sa) => {
        const q = qMap.get(sa.questionId);
        if (!q) return { ...sa, answer: sa.answer as Prisma.InputJsonValue | null, isCorrect: false as boolean | null, score: 0 as number | null };

        maxScore += q.points;
        const result = autoGrade(q, sa.answer);
        if (result.score !== null) totalScore += result.score;
        return { ...sa, answer: sa.answer as Prisma.InputJsonValue | null, isCorrect: result.isCorrect, score: result.score };
      });

    await this.repository.upsertAnswers(attemptId, gradedAnswers);

    const hasSubjective = Array.from(qMap.values()).some((q) =>
      (['SHORT_ANSWER', 'ESSAY', 'DRAWING'] as QuestionType[]).includes(q.type as QuestionType),
    );
    const status: AttemptStatus = hasSubjective ? 'SUBMITTED' : 'GRADED';

    return this.repository.updateStatus(attemptId, { status, totalScore, maxScore, submittedAt: new Date() });
  }

  async getResult(attemptId: string, userId: string, roles: string[]) {
    const attempt = await this.repository.findById(attemptId);
    if (!attempt) throw AppError.notFound('Không tìm thấy lượt làm bài');

    const isOwner = attempt.studentId === userId;
    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER'].includes(r),
    );

    if (!isOwner && !isStaff) throw AppError.forbidden('Bạn không có quyền xem kết quả này');

    const hideCorrect = (attempt.mode === 'TEST' || attempt.mode === 'MOCK_EXAM') && isOwner && attempt.status !== 'GRADED';

    if (hideCorrect && attempt.answers) {
      return {
        ...attempt,
        answers: attempt.answers.map((ans) => ({
          ...ans,
          question: ans.question
            ? { ...ans.question, correctAnswer: undefined, explanation: null }
            : undefined,
        })),
      };
    }

    return attempt;
  }

  async getMyHistory(studentId: string, filters: { lessonId?: string; page?: number; perPage?: number }) {
    return this.repository.findByStudent(studentId, filters);
  }

  async getPendingGrading(roles: string[], page?: number, perPage?: number) {
    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER'].includes(r),
    );
    if (!isStaff) throw AppError.forbidden('Chỉ giáo viên và admin mới có thể xem danh sách chờ chấm');
    return this.repository.findPendingGrading({ page, perPage });
  }

  async gradeAnswer(answerId: string, teacherId: string, roles: string[], data: { score: number; feedback?: string }) {
    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER'].includes(r),
    );
    if (!isStaff) throw AppError.forbidden('Bạn không có quyền chấm điểm');

    const updated = await this.repository.gradeAnswer(answerId, { ...data, gradedById: teacherId });

    const attempt = await this.repository.findById(updated.attemptId);
    if (attempt?.status === 'SUBMITTED') {
      const allGraded = attempt.answers?.every((a) => a.isCorrect !== null);
      if (allGraded) {
        const totalScore = attempt.answers?.reduce((sum, a) => sum + (a.score ?? 0), 0) ?? 0;
        await this.repository.updateStatus(attempt.id, { status: 'GRADED', totalScore });
      }
    }

    return updated;
  }
}

// ─── Auto-grading ────────────────────────────────────────────────────────────

function autoGrade(q: Q, answer: unknown): { isCorrect: boolean | null; score: number | null } {
  switch (q.type as QuestionType) {
    case 'SINGLE_CHOICE': {
      const correct = answer === q.correctAnswer;
      return { isCorrect: correct, score: correct ? q.points : 0 };
    }
    case 'MULTIPLE_CHOICE': {
      const correctSet = new Set(q.correctAnswer as string[]);
      const submittedSet = new Set(answer as string[]);
      const isCorrect =
        correctSet.size === submittedSet.size && [...correctSet].every((c) => submittedSet.has(c));
      return { isCorrect, score: isCorrect ? q.points : 0 };
    }
    case 'FILL_IN_BLANK': {
      const isCorrect =
        String(answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      return { isCorrect, score: isCorrect ? q.points : 0 };
    }
    case 'SHORT_ANSWER':
    case 'ESSAY':
    case 'DRAWING':
      return { isCorrect: null, score: null };
    default:
      return { isCorrect: false, score: 0 };
  }
}
