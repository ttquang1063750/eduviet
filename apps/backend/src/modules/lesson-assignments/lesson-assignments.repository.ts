import { PrismaClient, Prisma } from '@prisma/client';
import { AssignmentScope } from '@eduviet/shared-types';

export class LessonAssignmentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    lessonId: string;
    scope: AssignmentScope;
    targetId: string;
    assignedById: string;
    note?: string;
    dueDate?: Date;
  }) {
    const { lessonId, scope, targetId, assignedById, note, dueDate } = data;

    const assignmentData: Prisma.LessonAssignmentCreateInput = {
      lesson: { connect: { id: lessonId } },
      assignedBy: { connect: { id: assignedById } },
      note,
      dueDate,
      ...(scope === 'SCHOOL' ? { school: { connect: { id: targetId } } } : {}),
      ...(scope === 'CLASS' ? { class: { connect: { id: targetId } } } : {}),
      ...(scope === 'USER' ? { user: { connect: { id: targetId } } } : {}),
    };

    return this.prisma.lessonAssignment.create({
      data: assignmentData,
      include: {
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, email: true } },
        assignedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.lessonAssignment.delete({
      where: { id },
    });
  }

  async findByLesson(lessonId: string) {
    return this.prisma.lessonAssignment.findMany({
      where: { lessonId },
      include: {
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, email: true } },
        assignedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.lessonAssignment.findUnique({
      where: { id },
      include: {
        lesson: { select: { id: true, title: true, subjectId: true, grade: true } },
      },
    });
  }

  async findExisting(lessonId: string, scope: AssignmentScope, targetId: string) {
    const where: Prisma.LessonAssignmentWhereInput = {
      lessonId,
      ...(scope === 'SCHOOL' ? { schoolId: targetId } : {}),
      ...(scope === 'CLASS' ? { classId: targetId } : {}),
      ...(scope === 'USER' ? { userId: targetId } : {}),
    };

    return this.prisma.lessonAssignment.findFirst({ where });
  }
}
