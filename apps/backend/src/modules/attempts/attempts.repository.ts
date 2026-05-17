import { Prisma, PrismaClient } from '@prisma/client';
import { AttemptMode, AttemptStatus } from '@eduviet/shared-types';

export class AttemptsRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    studentId: string;
    lessonId: string;
    mode: AttemptMode;
    timeLimitSec?: number;
  }) {
    return this.prisma.attempt.create({
      data: {
        studentId: data.studentId,
        lessonId: data.lessonId,
        mode: data.mode,
        timeLimitSec: data.timeLimitSec,
        status: 'IN_PROGRESS',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.attempt.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            subject: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  async findByStudent(studentId: string, filters: { lessonId?: string; page?: number; perPage?: number }) {
    const { lessonId, page = 1, perPage = 10 } = filters;
    const where: Prisma.AttemptWhereInput = { studentId };
    if (lessonId) where.lessonId = lessonId;

    const [data, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where,
        include: {
          lesson: {
            select: {
              title: true,
              slug: true,
              subject: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.attempt.count({ where }),
    ]);

    return { data, total };
  }

  async findPendingGrading(filters: { teacherId?: string; page?: number; perPage?: number }) {
    const { page = 1, perPage = 10 } = filters;
    // Find attempts that have answers with isCorrect === null (subjective questions)
    // and status is SUBMITTED
    const where: Prisma.AttemptWhereInput = {
      status: 'SUBMITTED',
      answers: {
        some: {
          isCorrect: null,
        },
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where,
        include: {
          student: {
            select: { fullName: true, email: true },
          },
          lesson: {
            select: { title: true },
          },
          _count: {
            select: {
              answers: {
                where: { isCorrect: null },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.attempt.count({ where }),
    ]);

    return { data, total };
  }

  /** Lấy toàn bộ câu hỏi của lesson (kèm đáp án) để auto-grade */
  async getLessonQuestions(lessonId: string) {
    return this.prisma.lessonQuestion.findMany({
      where: { lessonId },
      include: { question: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async upsertAnswers(
    attemptId: string,
    answers: { questionId: string; answer: Prisma.InputJsonValue | null; isCorrect: boolean | null; score: number | null }[],
  ) {
    return this.prisma.$transaction(
      answers.map((ans) => {
        // Prisma nullable Json: use Prisma.JsonNull sentinel instead of null
        const answerValue = ans.answer ?? Prisma.JsonNull;
        return this.prisma.attemptAnswer.upsert({
          where: {
            attemptId_questionId: { attemptId, questionId: ans.questionId },
          },
          update: {
            answer: answerValue,
            isCorrect: ans.isCorrect ?? null,
            score: ans.score ?? null,
          },
          create: {
            attemptId,
            questionId: ans.questionId,
            answer: answerValue,
            isCorrect: ans.isCorrect ?? null,
            score: ans.score ?? null,
          },
        });
      }),
    );
  }

  async gradeAnswer(answerId: string, data: { score: number; feedback?: string; gradedById: string }) {
    return this.prisma.attemptAnswer.update({
      where: { id: answerId },
      data: {
        score: data.score,
        feedback: data.feedback,
        gradedById: data.gradedById,
        isCorrect: data.score > 0, // Simplified: any score > 0 is correct-ish? Or based on max score?
        gradedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, data: { status: AttemptStatus; totalScore?: number; maxScore?: number; submittedAt?: Date }) {
    return this.prisma.attempt.update({
      where: { id },
      data: {
        status: data.status,
        totalScore: data.totalScore,
        maxScore: data.maxScore,
        submittedAt: data.submittedAt,
      },
    });
  }

  async countByStudentAndLesson(studentId: string, lessonId: string) {
    return this.prisma.attempt.count({
      where: { studentId, lessonId },
    });
  }
}
