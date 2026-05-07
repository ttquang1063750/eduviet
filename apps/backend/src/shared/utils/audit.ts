import { PrismaClient } from '@prisma/client';

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
  | 'CHAT_MESSAGE_DELETED';

export type AuditResourceType = 'AUTH' | 'USER' | 'LESSON' | 'CLASS' | 'CONTENT' | 'CHAT';

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
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
    await prisma.auditLog.create({ data: entry as never });
  } catch (err) {
    // Không throw — audit failure không nên làm gián đoạn request
    console.error('[AuditLog] Failed to write audit entry:', { entry, err });
  }
}
