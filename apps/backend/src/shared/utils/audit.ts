import { PrismaClient, Prisma } from '@prisma/client';

export type AuditAction =
  // Auth
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  // User management
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'USER_DELETED'
  // Lesson lifecycle
  | 'LESSON_CREATED'
  | 'LESSON_UPDATED'
  | 'LESSON_SUBMITTED_REVIEW'
  | 'LESSON_APPROVED'
  | 'LESSON_REJECTED'
  | 'LESSON_PUBLISHED'
  | 'LESSON_ARCHIVED'
  | 'LESSON_DELETED'
  // Class management
  | 'CLASS_CREATED'
  | 'CLASS_UPDATED'
  | 'CLASS_DELETED'
  // Chat
  | 'CHAT_ROOM_CREATED'
  | 'CHAT_MESSAGE_SENT'
  | 'CHAT_MESSAGE_EDITED'
  | 'CHAT_MESSAGE_DELETED'
  // Question bank
  | 'QUESTION_CREATED'
  | 'QUESTION_UPDATED'
  | 'QUESTION_DELETED'
  | 'LESSON_QUESTION_ADDED'
  | 'LESSON_QUESTION_REMOVED'
  | 'LESSON_QUESTIONS_REORDERED'
  | 'LESSON_RANDOMIZE_TOGGLED'
  // Subject
  | 'SUBJECT_CREATED'
  | 'SUBJECT_UPDATED'
  | 'SUBJECT_DELETED'
  // User roles / school
  | 'USER_ROLES_CHANGED'
  | 'USER_SCHOOL_ASSIGNED'
  // Blog
  | 'BLOG_SUBMITTED_FOR_REVIEW'
  // File
  | 'FILE_UPLOADED';

export type AuditResourceType =
  | 'AUTH'
  | 'USER'
  | 'LESSON'
  | 'CLASS'
  | 'CONTENT'
  | 'CHAT'
  | 'QUESTION'
  | 'SUBJECT'
  | 'FILE';

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  ipAddress?: string;
  details?: Prisma.InputJsonValue;
}

/**
 * Ghi audit log — không throw lỗi để không block business logic.
 * Lỗi audit chỉ được log ra console (sẽ dùng BullMQ queue khi có job worker).
 */
export async function writeAuditLog(
  prisma: PrismaClient,
  entry: AuditEntry
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        details: entry.details ?? Prisma.DbNull,
      },
    });
  } catch (err) {
    // Không throw — audit failure không nên làm gián đoạn request
    console.error('[AuditLog] Failed to write audit entry:', { entry, err });
  }
}
