import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { NotificationsService } from './notifications.service.js';

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(50).default(20),
  unread: z.coerce.boolean().default(false),
});

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  const service = new NotificationsService(app.prisma);

  // GET /notifications — danh sách thông báo của user hiện tại
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const query = listSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
    }
    const { page, perPage, unread } = query.data;
    const result = await service.list(request.user.id, unread, page, perPage);
    return reply.send(result);
  });

  // PATCH /notifications/:id/read — đánh dấu đã đọc
  app.patch('/:id/read', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const notif = await service.markAsRead(id, request.user.id);
    return reply.send({ data: notif });
  });

  // POST /notifications/read-all — đánh dấu tất cả đã đọc
  app.post('/read-all', { preHandler: [authenticate] }, async (request, reply) => {
    const result = await service.markAllRead(request.user.id);
    return reply.send({ data: result });
  });
};
