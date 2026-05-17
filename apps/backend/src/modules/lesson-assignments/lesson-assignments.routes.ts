import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { LessonAssignmentsService } from './lesson-assignments.service.js';
import { LessonAssignmentsRepository } from './lesson-assignments.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { AssignmentScope } from '@eduviet/shared-types';

// ── Zod schemas ───────────────────────────────────────────────────────────────
const listQuerySchema = z.object({
  lessonId: z.string().uuid(),
});

const assignBodySchema = z.object({
  lessonId: z.string().uuid(),
  scope: z.enum(['SCHOOL', 'CLASS', 'USER']),
  targetId: z.string().uuid(),
  note: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const lessonAssignmentsRoutes: FastifyPluginAsync = async (app) => {
  const repository = new LessonAssignmentsRepository(app.prisma);
  const service = new LessonAssignmentsService(app.prisma, repository);

  // GET / — list assignments for a lesson
  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const q = listQuerySchema.safeParse(request.query);
    if (!q.success) throw AppError.badRequest('lessonId là bắt buộc và phải là UUID');
    const data = await service.listByLesson(q.data.lessonId, request.user.id, request.user.roles);
    return { data };
  });

  // POST / — create assignment
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = assignBodySchema.safeParse(request.body);
    if (!body.success) throw AppError.badRequest('Dữ liệu không hợp lệ');
    const data = await service.assign(request.user.id, request.user.roles, {
      ...body.data,
      scope: body.data.scope as AssignmentScope,
    });
    return reply.status(201).send({ data });
  });

  // DELETE /:id — remove assignment
  app.delete('/:id', { preHandler: [authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    await service.unassign(id, request.user.id, request.user.roles);
    return { data: { message: 'Đã xóa phân công bài học' } };
  });
};
