import { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import path from 'node:path';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { ChatService } from './chat.service.js';
import {
  getMessagesSchema,
  createOneOnOneSchema,
  editMessageSchema,
} from './chat.schema.js';

// MIME types cho phép upload trong chat
const CHAT_ALLOWED_MIME = new Set<string>([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
]);

const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const chatRoutes: FastifyPluginAsync = async (app) => {
  const service = new ChatService(app.prisma);

  // Mọi route chat đều cần authenticate
  app.addHook('preHandler', authenticate);

  // GET /rooms — Lấy danh sách phòng chat của user
  app.get('/rooms', async (request, reply) => {
    const rooms = await service.getRooms(request.user.id);
    return reply.send({ data: rooms });
  });

  // GET /rooms/:id — Chi tiết phòng chat
  app.get('/rooms/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = await service.getRoomDetail(id, request.user.id);
    return reply.send({ data: room });
  });

  // GET /rooms/:id/messages — Lấy tin nhắn trong phòng
  app.get('/rooms/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = getMessagesSchema.safeParse(request.query);
    
    if (!query.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' },
      });
    }

    const { limit, cursor } = query.data;
    const messages = await service.getMessages(
      id,
      request.user.id,
      limit,
      cursor ? new Date(cursor) : undefined
    );
    
    return reply.send({ data: messages });
  });

  // POST /rooms/one-on-one — Tạo/lấy phòng chat 1-1
  app.post('/rooms/one-on-one', async (request, reply) => {
    const body = createOneOnOneSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
      });
    }

    const room = await service.getOrCreateOneOnOneRoom(
      request.user.id,
      body.data.recipientId
    );

    // Notify cả 2 thành viên qua private room để client tự join socket room
    const memberIds = room.members?.map((m: { userId: string }) => m.userId) ?? [request.user.id, body.data.recipientId];
    memberIds.forEach((uid: string) => {
      app.io.to(`user:${uid}`).emit('room_invited', room);
    });

    return reply.status(201).send({ data: room });
  });

  // DELETE /rooms/:id — Xoá phòng chat
  app.delete('/rooms/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await service.deleteRoom(id, request.user.id);

    // Thông báo tất cả thành viên để client xoá room khỏi danh sách
    result.memberIds.forEach((uid: string) => {
      app.io.to(`user:${uid}`).emit('room_deleted', { roomId: result.roomId });
    });

    return reply.send({ data: { roomId: result.roomId } });
  });

  // PATCH /messages/:id — Sửa tin nhắn
  app.patch('/messages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = editMessageSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
      });
    }

    const updated = await service.editMessage(id, request.user.id, body.data.content);
    return reply.send({ data: updated });
  });

  // DELETE /messages/:id — Xóa tin nhắn
  app.delete('/messages/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await service.deleteMessage(id, request.user.id);
    return reply.send({ data: result });
  });

  // POST /rooms/:id/upload — Upload file/ảnh trong chat room
  app.post(
    '/rooms/:id/upload',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { id: roomId } = request.params as { id: string };

      // RBAC: phải là thành viên phòng
      const isMember = await service.isMember(roomId, request.user.id);
      if (!isMember) {
        throw AppError.forbidden('Bạn không phải là thành viên của phòng chat này');
      }

      const data = await request.file({ limits: { fileSize: MAX_CHAT_FILE_SIZE } });
      if (!data) throw AppError.badRequest('Không có file nào được gửi lên');

      if (!CHAT_ALLOWED_MIME.has(data.mimetype)) {
        throw AppError.badRequest(
          'Loại file không được phép. Chỉ chấp nhận: ảnh (jpg/png/gif/webp), PDF, DOCX, XLSX'
        );
      }

      const buffer = await data.toBuffer();
      if (buffer.length > MAX_CHAT_FILE_SIZE) {
        throw AppError.badRequest('File quá lớn. Kích thước tối đa là 10MB');
      }

      const ext = path.extname(data.filename) || `.${data.mimetype.split('/')[1]}`;
      const key = `public/uploads/chat/${roomId}/${crypto.randomUUID()}${ext}`;
      const url = await app.storage.upload(buffer, key, data.mimetype);

      await writeAuditLog(app.prisma, {
        userId: request.user.id,
        action: 'FILE_UPLOADED',
        resourceType: 'FILE',
        resourceId: key,
        details: { roomId, size: buffer.length, mimeType: data.mimetype },
      });

      return reply.send({ data: { url, key, size: buffer.length, mimeType: data.mimetype } });
    }
  );

  // POST /rooms/:id/mark-read — Đánh dấu đã đọc
  app.post('/rooms/:id/mark-read', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await service.markRead(id, request.user.id);
    return reply.send({ data: result });
  });
};
