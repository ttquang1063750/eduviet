import { PrismaClient } from '@prisma/client';

export interface QuestionFilters {
  page: number;
  perPage: number;
  subjectId?: string;
  type?: string;
  difficulty?: string;
  search?: string;
}

// Prisma client hasn't been regenerated yet (migration pending).
// Using (prisma as never) casts until `prisma generate` runs.
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

export class QuestionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get q(): AnyPrisma {
    return (this.prisma as unknown as Record<string, AnyPrisma>)['question'];
  }

  async findMany(filters: QuestionFilters) {
    const { page, perPage, subjectId, type, difficulty, search } = filters;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(subjectId ? { subjectId } : {}),
      ...(type ? { type } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(search
        ? {
            OR: [
              { content: { contains: search, mode: 'insensitive' } },
              { tags: { has: search } },
            ],
          }
        : {}),
    };

    const [questions, total] = await Promise.all([
      this.q['findMany']({
        where,
        select: questionSelect,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }) as Promise<unknown[]>,
      this.q['count']({ where }) as Promise<number>,
    ]);

    return { questions, total };
  }

  async findById(id: string) {
    return this.q['findUnique']({
      where: { id, deletedAt: null },
      select: questionSelect,
    }) as Promise<Record<string, unknown> | null>;
  }

  async create(data: {
    subjectId: string;
    type: string;
    content: string;
    options?: unknown;
    correctAnswer: unknown;
    explanation?: string;
    hints?: string[];
    points?: number;
    difficulty?: string;
    tags?: string[];
    creatorId: string;
  }) {
    return this.q['create']({
      data: {
        subjectId: data.subjectId,
        type: data.type,
        content: data.content,
        options: data.options ?? null,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation ?? null,
        hints: data.hints ?? [],
        points: data.points ?? 10,
        difficulty: data.difficulty ?? null,
        tags: data.tags ?? [],
        creatorId: data.creatorId,
      },
      select: questionSelect,
    }) as Promise<Record<string, unknown>>;
  }

  async update(
    id: string,
    data: {
      content?: string;
      options?: unknown;
      correctAnswer?: unknown;
      explanation?: string | null;
      hints?: string[];
      points?: number;
      difficulty?: string;
      tags?: string[];
    },
  ) {
    const updateData: Record<string, unknown> = {};

    if (data.content !== undefined) updateData['content'] = data.content;
    if (data.explanation !== undefined) updateData['explanation'] = data.explanation;
    if (data.points !== undefined) updateData['points'] = data.points;
    if (data.difficulty !== undefined) updateData['difficulty'] = data.difficulty;
    if (data.tags !== undefined) updateData['tags'] = data.tags;
    if (data.hints !== undefined) updateData['hints'] = data.hints;
    if (data.options !== undefined) updateData['options'] = data.options;
    if (data.correctAnswer !== undefined) updateData['correctAnswer'] = data.correctAnswer;

    return this.q['update']({
      where: { id },
      data: updateData,
      select: questionSelect,
    }) as Promise<Record<string, unknown>>;
  }

  async softDelete(id: string) {
    return this.q['update']({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    }) as Promise<{ id: string }>;
  }
}
