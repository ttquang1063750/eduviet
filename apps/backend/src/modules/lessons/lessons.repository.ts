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

export class LessonsRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
        exercises: { orderBy: { orderIndex: 'asc' } },
      },
    });
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
