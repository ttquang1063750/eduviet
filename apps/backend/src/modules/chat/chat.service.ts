import { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { ChatRepository } from './chat.repository.js';

export class ChatService {
  private readonly repo: ChatRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new ChatRepository(prisma);
  }

  /** Kiểm tra user có là thành viên phòng không */
  async isMember(roomId: string, userId: string): Promise<boolean> {
    return this.repo.isMember(roomId, userId);
  }

  /** Lấy danh sách phòng chat của người dùng */
  async getRooms(userId: string) {
    const rooms = await this.repo.findRoomsByUser(userId);
    
    // Bổ sung số lượng tin nhắn chưa đọc cho mỗi room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await this.repo.countUnread(room.id, userId);
        return { ...room, unreadCount };
      })
    );

    return roomsWithUnread;
  }

  /** Lấy tin nhắn trong phòng chat với phân trang cursor */
  async getMessages(roomId: string, userId: string, limit = 50, cursor?: Date) {
    const isMember = await this.repo.isMember(roomId, userId);
    if (!isMember) {
      throw AppError.forbidden('Bạn không phải là thành viên của phòng chat này');
    }

    return this.repo.findMessages(roomId, limit, cursor);
  }

  /** Gửi tin nhắn mới */
  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    mediaUrl?: string
  ) {
    const isMember = await this.repo.isMember(roomId, senderId);
    if (!isMember) {
      throw AppError.forbidden('Bạn không có quyền gửi tin nhắn vào phòng này');
    }

    const message = await this.repo.createMessage({
      roomId,
      senderId,
      content,
      mediaUrl,
    });

    await writeAuditLog(this.prisma, {
      userId: senderId,
      action: 'CHAT_MESSAGE_SENT',
      resourceType: 'CHAT',
      resourceId: message.id,
      details: { roomId },
    });

    return message;
  }

  /** Sửa tin nhắn */
  async editMessage(messageId: string, userId: string, content: string) {
    const message = await this.repo.findMessageById(messageId);
    if (!message) throw AppError.notFound('Tin nhắn');
    
    if (message.senderId !== userId) {
      throw AppError.forbidden('Bạn chỉ có thể sửa tin nhắn của chính mình');
    }

    if (message.deletedAt) {
      throw AppError.conflict('Không thể sửa tin nhắn đã bị xóa');
    }

    const updated = await this.repo.editMessage(messageId, content);

    await writeAuditLog(this.prisma, {
      userId,
      action: 'CHAT_MESSAGE_EDITED',
      resourceType: 'CHAT',
      resourceId: messageId,
      details: { roomId: message.roomId },
    });

    return updated;
  }

  /** Xóa tin nhắn (soft delete) */
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.repo.findMessageById(messageId);
    if (!message) throw AppError.notFound('Tin nhắn');

    if (message.senderId !== userId) {
      throw AppError.forbidden('Bạn chỉ có thể xóa tin nhắn của chính mình');
    }

    const deleted = await this.repo.deleteMessage(messageId);

    await writeAuditLog(this.prisma, {
      userId,
      action: 'CHAT_MESSAGE_DELETED',
      resourceType: 'CHAT',
      resourceId: messageId,
      details: { roomId: message.roomId },
    });

    return deleted;
  }

  /** Đánh dấu đã đọc — cập nhật lastReadAt (unread count) + readBy per message (read receipts) */
  async markRead(roomId: string, userId: string) {
    // Chạy song song: cập nhật lastReadAt trên member + readBy trên messages
    await Promise.all([
      this.repo.markRead(roomId, userId),
      this.repo.markMessagesRead(roomId, userId),
    ]);

    // Không throw nếu audit thất bại
    await writeAuditLog(this.prisma, {
      userId,
      action: 'CHAT_MESSAGES_READ',
      resourceType: 'CHAT',
      resourceId: roomId,
    });

    return { success: true };
  }

  /** Tạo hoặc lấy phòng chat 1-1 */
  async getOrCreateOneOnOneRoom(userAId: string, userBId: string) {
    if (userAId === userBId) {
      throw AppError.badRequest('Không thể tạo phòng chat với chính mình');
    }

    let room = await this.repo.findOneOnOneRoom(userAId, userBId);

    if (!room) {
      room = await this.repo.createRoom({
        type: 'ONE_ON_ONE',
        memberIds: [userAId, userBId],
      });

      await writeAuditLog(this.prisma, {
        userId: userAId,
        action: 'CHAT_ROOM_CREATED',
        resourceType: 'CHAT',
        resourceId: room.id,
        details: { type: 'ONE_ON_ONE', recipientId: userBId },
      });
    }

    return room;
  }

  /** Lấy chi tiết room (kiểm tra quyền) */
  async getRoomDetail(roomId: string, userId: string) {
    const room = await this.repo.findRoomById(roomId);
    if (!room) throw AppError.notFound('Phòng chat');

    const isMember = room.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw AppError.forbidden('Bạn không có quyền truy cập phòng chat này');
    }

    return room;
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.repo.findRoomById(roomId);
    if (!room) throw AppError.notFound('Phòng chat');

    const isMember = room.members.some((m) => m.userId === userId);
    if (!isMember) throw AppError.forbidden('Bạn không có quyền xoá phòng chat này');

    const memberIds = room.members.map((m) => m.userId);
    await this.repo.deleteRoom(roomId);

    await writeAuditLog(this.prisma, {
      userId,
      action: 'CHAT_ROOM_DELETED',
      resourceType: 'CHAT',
      resourceId: roomId,
    });

    return { roomId, memberIds };
  }
}
