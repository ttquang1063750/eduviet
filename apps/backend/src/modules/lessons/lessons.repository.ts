import { PrismaClient, Prisma } from '@prisma/client';

export interface LessonFilters {
  page: number;
  perPage: number;
  subject?: string;
  grade?: number;
  difficulty?: string;
  statuses: string[];
  search?: string;
}

// Prisma client hasn't been regenerated yet (migration pending).
// New models (Question, LessonQuestion) and fields (randomizeQuestions, lessonQuestions)
// are cast as `never` / accessed via (prisma as never) until `prisma generate` runs.
type AnyPrisma = Record<string, (args: unknown) => Promise<unknown>>;

const questionSelect = {
  id: true,
  subjectId: true,
  type: true,
  content: true,
  options: true,
  correctAnswer: true,
  explanation: true,
  hints: true,
  points: true,
  difficulty: true,
  tags: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
};

export class LessonsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get lq(): AnyPrisma {
    return (this.prisma as unknown as Record<string, AnyPrisma>)['lessonQuestion'];
  }

  async findMany(filters: LessonFilters) {
    const { page, perPage, subject, grade, difficulty, statuses, search } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.LessonWhereInput = {
      deletedAt: null,
      status: { in: statuses as Prisma.EnumContentStatusFilter['in'] },
      ...(subject ? { subject: { code: subject as never } } : {}),
      ...(grade ? { grade } : {}),
      ...(difficulty ? { difficulty: difficulty as never } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { topic: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          grade: true,
          topic: true,
          difficulty: true,
          status: true,
          estimatedMinutes: true,
          publishedAt: true,
          subject: { select: { id: true, code: true, name: true, color: true } },
        },
        skip,
        take: perPage,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return { lessons, total };
  }

  async findBySlug(slug: string) {
    return this.prisma.lesson.findUnique({
      where: { slug, deletedAt: null },
      include: {
        subject: true,
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
        lessonQuestions: {
          where: { question: { deletedAt: null } } as never,
          orderBy: { orderIndex: 'asc' } as never,
          include: {
            question: { select: questionSelect },
          },
        } as never,
      } as never,
    }) as Promise<(Awaited<ReturnType<typeof this.prisma.lesson.findUnique>> & {
      randomizeQuestions: boolean;
      lessonQuestions: Array<{
        id: string;
        lessonId: string;
        questionId: string;
        orderIndex: number;
        createdAt: Date;
        question: Record<string, unknown>;
      }>;
    }) | null>;
  }

  async findLessonQuestions(lessonId: string) {
    return this.lq['findMany']({
      where: { lessonId, question: { deletedAt: null } },
      orderBy: { orderIndex: 'asc' },
      include: {
        question: { select: questionSelect },
      },
    }) as Promise<Array<{
      id: string;
      lessonId: string;
      questionId: string;
      orderIndex: number;
      createdAt: Date;
      question: Record<string, unknown>;
    }>>;
  }

  async addQuestionToLesson(lessonId: string, questionId: string) {
    const maxOrder = await this.lq['findFirst']({
      where: { lessonId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    }) as { orderIndex: number } | null;

    return this.lq['create']({
      data: {
        lessonId,
        questionId,
        orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
      },
      include: {
        question: { select: questionSelect },
      },
    }) as Promise<{
      id: string;
      lessonId: string;
      questionId: string;
      orderIndex: number;
      createdAt: Date;
      question: Record<string, unknown>;
    }>;
  }

  async removeQuestionFromLesson(lessonId: string, questionId: string) {
    return this.lq['deleteMany']({
      where: { lessonId, questionId },
    });
  }

  async reorderLessonQuestions(lessonId: string, orderedIds: string[]) {
    // Use sequential updates since lq is a dynamic accessor and can't be typed for $transaction
    for (let index = 0; index < orderedIds.length; index++) {
      const questionId = orderedIds[index];
      await this.lq['updateMany']({
        where: { lessonId, questionId },
        data: { orderIndex: index },
      });
    }
  }

  async setRandomize(lessonId: string, randomize: boolean) {
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { randomizeQuestions: randomize } as never,
    }) as unknown as Promise<{ id: string; randomizeQuestions: boolean }>;
  }

  async findById(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async create(data: {
    title: string;
    slug: string;
    subjectId: string;
    grade: number;
    topic: string;
    difficulty: string;
    theory: string;
    estimatedMinutes: number;
    creatorId: string;
    status: string;
  }) {
    return this.prisma.lesson.create({
      data: data as never,
      include: { subject: true },
    });
  }

  async updateStatus(id: string, status: string, extra?: Record<string, unknown>) {
    return this.prisma.lesson.update({
      where: { id },
      data: { status: status as never, ...extra },
    });
  }
}
