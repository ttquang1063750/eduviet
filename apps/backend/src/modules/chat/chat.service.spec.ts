import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service.js';
import { AppError } from '../../shared/errors/app-error.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  chatRoom: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  chatRoomMember: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  chatMessage: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChatService(mockPrisma as any);
  });

  describe('getMessages()', () => {
    it('throw Forbidden nếu user không phải member', async () => {
      mockPrisma.chatRoomMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getMessages('room-1', 'user-1')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('trả về messages nếu là member', async () => {
      mockPrisma.chatRoomMember.findUnique.mockResolvedValue({ userId: 'user-1' });
      mockPrisma.chatMessage.findMany.mockResolvedValue([{ id: 'msg-1', content: 'hello' }]);

      const result = await service.getMessages('room-1', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('hello');
    });
  });

  describe('sendMessage()', () => {
    it('throw Forbidden nếu user không phải member', async () => {
      mockPrisma.chatRoomMember.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('room-1', 'user-1', 'hello')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('tạo message và ghi audit log nếu là member', async () => {
      mockPrisma.chatRoomMember.findUnique.mockResolvedValue({ userId: 'user-1' });
      mockPrisma.chatMessage.create.mockResolvedValue({ id: 'msg-1', roomId: 'room-1' });
      mockPrisma.chatRoom.update.mockResolvedValue({});

      await service.sendMessage('room-1', 'user-1', 'hello');

      expect(mockPrisma.chatMessage.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CHAT_MESSAGE_SENT' })
        })
      );
    });
  });
});
