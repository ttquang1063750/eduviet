import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { SubjectsService } from './subjects.service.js';
import { SubjectCode } from '@prisma/client';

const subjectCodeValues = Object.values(SubjectCode) as [SubjectCode, ...SubjectCode[]];

const createSubjectSchema = z.object({
  code: z.enum(subjectCodeValues),
  name: z.string().min(1).max(100).trim(),
  nameEn: z.string().min(1).max(100).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  iconUrl: z.string().max(500).optional(),
});

const updateSubjectSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  nameEn: z.string().min(1).max(100).trim().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  iconUrl: z.string().max(500).optional(),
});

const suggestQuerySchema = z.object({
  code: z.enum(subjectCodeValues),
});

export const subjectsRoutes: FastifyPluginAsync = async (app) => {
  const service = new SubjectsService(app.prisma);

  // GET /api/subjects — danh sách môn học (mọi user đã đăng nhập)
  app.get('/', { preHandler: [authenticate] }, async (_request, reply) => {
    const subjects = await service.list();
    return reply.send({ data: subjects });
  });

  // GET /api/subjects/suggest?code= — AI gợi ý thông tin môn học (SUPER_ADMIN only)
  app.get(
    '/suggest',
    { preHandler: [authorize('SUPER_ADMIN')] },
    async (request, reply) => {
      const query = suggestQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Mã môn học không hợp lệ' },
        });
      }
      const suggestion = await service.suggest(query.data.code);
      return reply.send({ data: suggestion });
    },
  );

  // POST /api/subjects — tạo môn học mới
  app.post(
    '/',
    { preHandler: [authorize('SUPER_ADMIN', 'CONTENT_APPROVER')] },
    async (request, reply) => {
      const body = createSubjectSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
      }
      const subject = await service.create(body.data, request.user.id);
      return reply.status(201).send({ data: subject });
    },
  );

  // PATCH /api/subjects/:id — cập nhật môn học
  app.patch(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN', 'CONTENT_APPROVER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateSubjectSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
        });
      }
      const subject = await service.update(id, body.data, request.user.id);
      return reply.send({ data: subject });
    },
  );

  // DELETE /api/subjects/:id — xóa môn học (chỉ khi không có lesson)
  app.delete(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id, request.user.id);
      return reply.send({ data: { message: 'Đã xóa môn học thành công' } });
    },
  );
};
