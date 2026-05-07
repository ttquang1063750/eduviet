import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service.js';

/**
 * ChatGateway - Xử lý các sự kiện real-time qua Socket.io.
 * Gateway này được khởi tạo sau khi ChatService đã sẵn sàng.
 */
export class ChatGateway {
  private readonly chatService: ChatService;

  constructor(private readonly app: FastifyInstance) {
    this.chatService = new ChatService(app.prisma);
    this.setupListeners();
  }

  private setupListeners() {
    const io = this.app.io;

    io.on('connection', (socket: Socket) => {
      const userId = socket.user.id;
      console.log(`[ChatGateway] User connected: ${userId} (Socket: ${socket.id})`);

      // ── Tham gia các phòng chat ──────────────────────────────────────────
      socket.on('join_rooms', async (roomIds: string[]) => {
        if (!Array.isArray(roomIds)) return;
        
        // Join vào từng room socket
        roomIds.forEach((roomId) => {
          socket.join(roomId);
        });
        
        console.log(`[ChatGateway] User ${userId} joined rooms: ${roomIds.join(', ')}`);
      });

      // ── Gửi tin nhắn ──────────────────────────────────────────────────────
      socket.on('send_message', async (data: { roomId: string; content: string; mediaUrl?: string }) => {
        try {
          const message = await this.chatService.sendMessage(
            data.roomId,
            userId,
            data.content,
            data.mediaUrl
          );

          // Emit tới mọi người trong room (bao gồm cả sender để confirm)
          io.to(data.roomId).emit('new_message', message);
        } catch (error: any) {
          socket.emit('error', { message: error.message || 'Lỗi khi gửi tin nhắn' });
        }
      });

      // ── Typing indicators ──────────────────────────────────────────────────
      socket.on('typing_start', (data: { roomId: string }) => {
        socket.to(data.roomId).emit('user_typing', {
          roomId: data.roomId,
          userId,
          fullName: socket.user.email, // Sẽ tốt hơn nếu lấy fullName từ DB hoặc token
        });
      });

      socket.on('typing_stop', (data: { roomId: string }) => {
        socket.to(data.roomId).emit('user_stopped_typing', {
          roomId: data.roomId,
          userId,
        });
      });

      // ── Đánh dấu đã đọc ────────────────────────────────────────────────────
      socket.on('mark_read', async (data: { roomId: string }) => {
        try {
          await this.chatService.markRead(data.roomId, userId);
          // Không cần emit lại cho người khác, chỉ cập nhật DB
          // Nhưng có thể emit 'message_read' nếu muốn hiện double-tick cho sender
          socket.to(data.roomId).emit('message_read', {
            roomId: data.roomId,
            userId,
            at: new Date(),
          });
        } catch (error: any) {
          console.error('[ChatGateway] mark_read error:', error.message);
        }
      });

      // ── Sửa tin nhắn ───────────────────────────────────────────────────────
      socket.on('edit_message', async (data: { messageId: string; content: string }) => {
        try {
          const updated = await this.chatService.editMessage(data.messageId, userId, data.content);
          io.to(updated.roomId).emit('message_edited', updated);
        } catch (error: any) {
          socket.emit('error', { message: error.message || 'Lỗi khi sửa tin nhắn' });
        }
      });

      // ── Xóa tin nhắn ───────────────────────────────────────────────────────
      socket.on('delete_message', async (data: { messageId: string }) => {
        try {
          const result = await this.chatService.deleteMessage(data.messageId, userId);
          io.to(result.roomId).emit('message_deleted', result);
        } catch (error: any) {
          socket.emit('error', { message: error.message || 'Lỗi khi xóa tin nhắn' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`[ChatGateway] User disconnected: ${userId}`);
      });
    });
  }
}

/**
 * Helper function để đăng ký Gateway vào Fastify app
 */
export const registerChatGateway = (app: FastifyInstance) => {
  return new ChatGateway(app);
};
