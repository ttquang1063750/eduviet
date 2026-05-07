import { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { ClassesRepository, ClassFilters } from './classes.repository.js';
import { ChatRepository } from '../chat/chat.repository.js';

export class ClassesService {
  private readonly repo: ClassesRepository;
  private readonly chatRepo: ChatRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new ClassesRepository(prisma);
    this.chatRepo = new ChatRepository(prisma);
  }

  async list(filters: ClassFilters) {
    const { classes, total } = await this.repo.findMany(filters);
    return {
      data: classes,
      meta: {
        total,
        page: filters.page,
        perPage: filters.perPage,
        totalPages: Math.ceil(total / filters.perPage),
      },
    };
  }

  async getById(id: string) {
    const cls = await this.repo.findById(id);
    if (!cls) throw AppError.notFound('Lớp học');
    return cls;
  }

  async create(
    data: { name: string; grade: number; academicYear: string; schoolId: string; homeroomTeacherId?: string },
    actorId: string
  ) {
    const cls = await this.repo.create(data);

    // Auto-create CLASS ChatRoom
    const memberIds = [actorId];
    if (data.homeroomTeacherId && data.homeroomTeacherId !== actorId) {
      memberIds.push(data.homeroomTeacherId);
    }

    await this.chatRepo.createRoom({
      type: 'CLASS',
      name: `Lớp ${cls.name}`,
      classId: cls.id,
      memberIds,
    });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'CLASS_CREATED',
      resourceType: 'CLASS',
      resourceId: cls.id,
      details: { name: cls.name, grade: cls.grade },
    });
    return cls;
  }

  async update(
    id: string,
    data: Partial<{ name: string; homeroomTeacherId: string | null }>,
    actorId: string
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Lớp học');
    const updated = await this.repo.update(id, data);
    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'CLASS_UPDATED',
      resourceType: 'CLASS',
      resourceId: id,
    });
    return updated;
  }

  async delete(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Lớp học');
    await this.repo.softDelete(id);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'CLASS_DELETED',
      resourceType: 'CLASS',
      resourceId: id,
    });
  }

  /** Thêm học sinh vào lớp */
  async enroll(classId: string, userId: string, actorId: string) {
    const cls = await this.repo.findById(classId);
    if (!cls) throw AppError.notFound('Lớp học');

    const alreadyEnrolled = await this.repo.isEnrolled(classId, userId);
    if (alreadyEnrolled) throw AppError.conflict('Học sinh đã có trong lớp này');

    const enrollment = await this.repo.addEnrollment(classId, userId);

    // Tự động add vào CLASS ChatRoom
    const chatRoom = await this.prisma.chatRoom.findFirst({
      where: { classId, type: 'CLASS' },
    });

    if (chatRoom) {
      await this.prisma.chatRoomMember.upsert({
        where: { roomId_userId: { roomId: chatRoom.id, userId } },
        create: { roomId: chatRoom.id, userId },
        update: {},
      });
    }

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'CLASS_UPDATED',
      resourceType: 'CLASS',
      resourceId: classId,
      details: { action: 'enroll', targetUserId: userId },
    });
    return enrollment;
  }

  /** Xóa học sinh khỏi lớp */
  async unenroll(classId: string, userId: string, actorId: string) {
    const cls = await this.repo.findById(classId);
    if (!cls) throw AppError.notFound('Lớp học');

    await this.repo.removeEnrollment(classId, userId);

    // Tự động remove khỏi CLASS ChatRoom
    const chatRoom = await this.prisma.chatRoom.findFirst({
      where: { classId, type: 'CLASS' },
    });

    if (chatRoom) {
      await this.prisma.chatRoomMember.deleteMany({
        where: { roomId: chatRoom.id, userId },
      });
    }

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'CLASS_UPDATED',
      resourceType: 'CLASS',
      resourceId: classId,
      details: { action: 'unenroll', targetUserId: userId },
    });
  }
}
