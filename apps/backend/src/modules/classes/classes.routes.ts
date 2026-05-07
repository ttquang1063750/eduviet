import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authorize, authenticate } from '../../shared/middleware/authenticate.js';
import { ClassesService } from './classes.service.js';

const createClassSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  grade: z.number().int().min(1).max(12),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Định dạng: 2024-2025'),
  schoolId: z.string().uuid(),
  homeroomTeacherId: z.string().uuid().optional(),
});

const updateClassSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  homeroomTeacherId: z.string().uuid().nullable().optional(),
});

const enrollSchema = z.object({ userId: z.string().uuid() });

const listClassSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  schoolId: z.string().uuid().optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  academicYear: z.string().optional(),
});

export const classesRoutes: FastifyPluginAsync = async (app) => {
  const service = new ClassesService(app.prisma);

  // GET /classes
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const query = listClassSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
    }
    const result = await service.list(query.data);
    return reply.send(result);
  });

  // GET /classes/:id
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const cls = await service.getById(id);
    return reply.send({ data: cls });
  });

  // POST /classes
  app.post(
    '/',
    { preHandler: [authorize('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN')] },
    async (request, reply) => {
      const body = createClassSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
      }
      const cls = await service.create(body.data, request.user.id);
      return reply.status(201).send({ data: cls });
    }
  );

  // PATCH /classes/:id
  app.patch(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOMEROOM_TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateClassSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } });
      }
      const cls = await service.update(id, body.data, request.user.id);
      return reply.send({ data: cls });
    }
  );

  // DELETE /classes/:id
  app.delete(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN', 'SCHOOL_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id, request.user.id);
      return reply.send({ data: { message: 'Lớp học đã được xóa' } });
    }
  );

  // POST /classes/:id/enrollments — thêm học sinh vào lớp
  app.post(
    '/:id/enrollments',
    { preHandler: [authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOMEROOM_TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = enrollSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'userId không hợp lệ' } });
      }
      const enrollment = await service.enroll(id, body.data.userId, request.user.id);
      return reply.status(201).send({ data: enrollment });
    }
  );

  // DELETE /classes/:id/enrollments/:userId — xóa học sinh khỏi lớp
  app.delete(
    '/:id/enrollments/:userId',
    { preHandler: [authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HOMEROOM_TEACHER')] },
    async (request, reply) => {
      const { id, userId } = request.params as { id: string; userId: string };
      await service.unenroll(id, userId, request.user.id);
      return reply.send({ data: { message: 'Đã xóa học sinh khỏi lớp' } });
    }
  );
};
