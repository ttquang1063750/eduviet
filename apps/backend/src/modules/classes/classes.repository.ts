import { PrismaClient, Prisma } from '@prisma/client';

export interface ClassFilters {
  page: number;
  perPage: number;
  schoolId?: string;
  grade?: number;
  academicYear?: string;
}

const CLASS_SELECT = {
  id: true,
  name: true,
  grade: true,
  academicYear: true,
  school: { select: { id: true, name: true } },
  homeroomTeacher: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  _count: { select: { enrollments: true } },
  createdAt: true,
} satisfies Prisma.ClassSelect;

export class ClassesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: ClassFilters) {
    const { page, perPage, schoolId, grade, academicYear } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.ClassWhereInput = {
      deletedAt: null,
      ...(schoolId ? { schoolId } : {}),
      ...(grade ? { grade } : {}),
      ...(academicYear ? { academicYear } : {}),
    };

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        select: CLASS_SELECT,
        skip,
        take: perPage,
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.class.count({ where }),
    ]);

    return { classes, total };
  }

  async findById(id: string) {
    return this.prisma.class.findUnique({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        homeroomTeacher: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        enrollments: {
          include: {
            user: {
              select: {
                id: true, fullName: true, email: true, avatarUrl: true, role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async create(data: {
    name: string;
    grade: number;
    academicYear: string;
    schoolId: string;
    homeroomTeacherId?: string;
  }) {
    return this.prisma.class.create({ data, select: CLASS_SELECT });
  }

  async update(id: string, data: Partial<{ name: string; homeroomTeacherId: string | null }>) {
    return this.prisma.class.update({ where: { id }, data, select: CLASS_SELECT });
  }

  async softDelete(id: string) {
    return this.prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addEnrollment(classId: string, userId: string) {
    return this.prisma.classEnrollment.create({ data: { classId, userId } });
  }

  async removeEnrollment(classId: string, userId: string) {
    return this.prisma.classEnrollment.deleteMany({ where: { classId, userId } });
  }

  async isEnrolled(classId: string, userId: string) {
    const count = await this.prisma.classEnrollment.count({ where: { classId, userId } });
    return count > 0;
  }
}
