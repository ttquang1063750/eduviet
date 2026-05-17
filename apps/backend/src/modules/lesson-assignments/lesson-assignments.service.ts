import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { LessonAssignmentsRepository } from './lesson-assignments.repository.js';
import { AssignmentScope } from '@eduviet/shared-types';

const PRIVILEGED_ROLES: UserRole[] = ['SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN'];

export class LessonAssignmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repository: LessonAssignmentsRepository,
  ) {}

  async assign(
    actorId: string,
    actorRoles: UserRole[],
    data: {
      lessonId: string;
      scope: AssignmentScope;
      targetId: string;
      note?: string;
      dueDate?: string;
    }
  ) {
    const { lessonId, scope, targetId, note, dueDate } = data;

    // 1. Get lesson info to check subject and grade
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId, deletedAt: null },
      select: { id: true, subjectId: true, grade: true, title: true },
    });
    if (!lesson) throw AppError.notFound('Bài học');

    // 2. Check if already assigned to this target
    const existing = await this.repository.findExisting(lessonId, scope, targetId);
    if (existing) throw AppError.conflict('Bài học đã được gán cho mục tiêu này');

    // 3. RBAC Check
    await this.checkPermission(actorId, actorRoles, scope, targetId, lesson.subjectId);

    // 4. Create assignment
    const assignment = await this.repository.create({
      lessonId,
      scope,
      targetId,
      assignedById: actorId,
      note,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_ASSIGNED',
      resourceType: 'LESSON',
      resourceId: lessonId,
      details: { scope, targetId, assignmentId: assignment.id },
    });

    return assignment;
  }

  async unassign(id: string, actorId: string, actorRoles: UserRole[]) {
    const assignment = await this.repository.findById(id);
    if (!assignment) throw AppError.notFound('Phân công bài học');

    // Check permission (same as assign, but we check if actor has power over the target)
    await this.checkPermission(actorId, actorRoles, assignment.schoolId ? 'SCHOOL' : assignment.classId ? 'CLASS' : 'USER', 
      (assignment.schoolId || assignment.classId || assignment.userId)!, assignment.lesson.subjectId);

    await this.repository.delete(id);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_UNASSIGNED',
      resourceType: 'LESSON',
      resourceId: assignment.lessonId,
      details: { assignmentId: id },
    });
  }

  async listByLesson(lessonId: string, actorId: string, actorRoles: UserRole[]) {
    // Admin/Teacher role check
    const isStaff = actorRoles.some(r => ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER'].includes(r));
    if (!isStaff) throw AppError.forbidden('Bạn không có quyền xem danh sách phân công');

    return this.repository.findByLesson(lessonId);
  }

  private async checkPermission(
    actorId: string,
    actorRoles: UserRole[],
    scope: AssignmentScope,
    targetId: string,
    subjectId: string
  ) {
    if (actorRoles.some(r => PRIVILEGED_ROLES.includes(r))) return;

    if (actorRoles.includes('SCHOOL_ADMIN')) {
      const actor = await this.prisma.user.findUnique({ where: { id: actorId }, select: { schoolId: true } });
      if (!actor?.schoolId) throw AppError.forbidden('Bạn không thuộc trường nào');

      // Check if target is within school
      if (scope === 'SCHOOL') {
        if (targetId !== actor.schoolId) throw AppError.forbidden('Bạn chỉ có thể gán cho trường của mình');
      } else if (scope === 'CLASS') {
        const cls = await this.prisma.class.findUnique({ where: { id: targetId }, select: { schoolId: true } });
        if (cls?.schoolId !== actor.schoolId) throw AppError.forbidden('Lớp học không thuộc trường của bạn');
      } else {
        const user = await this.prisma.user.findUnique({ where: { id: targetId }, select: { schoolId: true } });
        if (user?.schoolId !== actor.schoolId) throw AppError.forbidden('Học sinh không thuộc trường của bạn');
      }
      return;
    }

    if (actorRoles.includes('HOMEROOM_TEACHER')) {
      if (scope === 'SCHOOL') throw AppError.forbidden('GV chủ nhiệm không thể gán cho toàn trường');
      
      const classId = scope === 'CLASS' ? targetId : (await this.prisma.classEnrollment.findFirst({ where: { userId: targetId }, select: { classId: true } }))?.classId;
      if (!classId) throw AppError.notFound('Lớp học');

      const cls = await this.prisma.class.findUnique({ where: { id: classId }, select: { homeroomTeacherId: true } });
      if (cls?.homeroomTeacherId !== actorId) throw AppError.forbidden('Bạn không phải GV chủ nhiệm của lớp này');
      return;
    }

    if (actorRoles.includes('SUBJECT_TEACHER')) {
      if (scope === 'SCHOOL') throw AppError.forbidden('GV bộ môn không thể gán cho toàn trường');

      const classId = scope === 'CLASS' ? targetId : (await this.prisma.classEnrollment.findFirst({ where: { userId: targetId }, select: { classId: true } }))?.classId;
      if (!classId) throw AppError.notFound('Lớp học');

      const isSubjectTeacher = await (this.prisma as any).classSubjectTeacher.findFirst({
        where: { classId, teacherId: actorId, subjectId }
      });

      if (!isSubjectTeacher) {
        throw AppError.forbidden('Bạn không dạy môn học này trong lớp này');
      }
      return;
    }

    throw AppError.forbidden('Bạn không có quyền thực hiện thao tác này');
  }
}
