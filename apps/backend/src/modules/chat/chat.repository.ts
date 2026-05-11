import { PrismaClient, Prisma } from '@prisma/client';

// ─── Reusable selects ─────────────────────────────────────────────────────────

const senderSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
  roles: true,
} satisfies Prisma.UserSelect;

const messageSelect = {
  id: true,
  roomId: true,
  content: true,
  mediaUrl: true,
  createdAt: true,
  editedAt: true,
  deletedAt: true,
  sender: { select: senderSelect },
} satisfies Prisma.ChatMessageSelect;

const roomSelect = {
  id: true,
  name: true,
  type: true,
  classId: true,
  createdAt: true,
  members: {
    select: {
      userId: true,
      lastReadAt: true,
      user: { select: senderSelect },
    },
  },
} satisfies Prisma.ChatRoomSelect;

// ─── Repository ───────────────────────────────────────────────────────────────

export class ChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Rooms ──────────────────────────────────────────────────────────────────

  /** Lấy tất cả rooms mà userId là member */
  async findRoomsByUser(userId: string) {
    return this.prisma.chatRoom.findMany({
      where: {
        members: { some: { userId } },
      },
      select: {
        ...roomSelect,
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findRoomById(id: string) {
    return this.prisma.chatRoom.findUnique({
      where: { id },
      select: roomSelect,
    });
  }

  /** Tìm room ONE_ON_ONE giữa 2 users */
  async findOneOnOneRoom(userAId: string, userBId: string) {
    return this.prisma.chatRoom.findFirst({
      where: {
        type: 'ONE_ON_ONE',
        members: { every: { userId: { in: [userAId, userBId] } } },
      },
      select: roomSelect,
    });
  }

  async createRoom(data: {
    type: 'CLASS' | 'TEACHER_PARENT' | 'ONE_ON_ONE' | 'STAFF';
    name?: string;
    classId?: string;
    memberIds: string[];
  }) {
    return this.prisma.chatRoom.create({
      data: {
        type: data.type,
        name: data.name,
        classId: data.classId,
        members: {
          create: data.memberIds.map((userId) => ({ userId })),
        },
      },
      select: roomSelect,
    });
  }

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { userId: true },
    });
    return member !== null;
  }

  // ── Messages ───────────────────────────────────────────────────────────────

  /**
   * Lấy messages theo cursor (cursor = createdAt của message cuối cùng đã load).
   * Trả về `limit` messages mới nhất TRƯỚC cursor đó (infinite scroll từ dưới lên).
   */
  async findMessages(roomId: string, limit = 50, cursor?: Date) {
    return this.prisma.chatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: cursor } } : {}),
      },
      select: messageSelect,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async createMessage(data: {
    roomId: string;
    senderId: string;
    content: string;
    mediaUrl?: string;
  }) {
    const message = await this.prisma.chatMessage.create({
      data,
      select: messageSelect,
    });

    // Cập nhật updatedAt của room để sort rooms_loaded đúng thứ tự
    await this.prisma.chatRoom.update({
      where: { id: data.roomId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async editMessage(messageId: string, content: string) {
    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
      select: messageSelect,
    });
  }

  /** Soft delete — set deletedAt, xóa content */
  async deleteMessage(messageId: string) {
    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: 'Tin nhắn đã bị xóa' },
      select: { id: true, roomId: true, deletedAt: true },
    });
  }

  async findMessageById(messageId: string) {
    return this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { ...messageSelect, senderId: true },
    });
  }

  // ── Read receipts ──────────────────────────────────────────────────────────

  async deleteRoom(roomId: string) {
    // Xoá members trước (FK), sau đó xoá messages rồi xoá room
    await this.prisma.chatRoomMember.deleteMany({ where: { roomId } });
    await this.prisma.chatMessage.deleteMany({ where: { roomId } });
    return this.prisma.chatRoom.delete({ where: { id: roomId } });
  }

  async markRead(roomId: string, userId: string) {
    return this.prisma.chatRoomMember.update({
      where: { roomId_userId: { roomId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  /** Đếm messages chưa đọc trong room cho user */
  async countUnread(roomId: string, userId: string): Promise<number> {
    const member = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { lastReadAt: true },
    });

    if (!member) return 0;

    return this.prisma.chatMessage.count({
      where: {
        roomId,
        deletedAt: null,
        senderId: { not: userId },
        ...(member.lastReadAt ? { createdAt: { gt: member.lastReadAt } } : {}),
      },
    });
  }
}
