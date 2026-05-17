import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { LessonAssignmentsService } from './lesson-assignments.service.js';
import { LessonAssignmentsRepository } from './lesson-assignments.repository.js';
import { AssignmentScope } from '@eduviet/shared-types';

export const lessonAssignmentsRoutes: FastifyPluginAsync = async (app) => {
  const repository = new LessonAssignmentsRepository(app.prisma);
  const service = new LessonAssignmentsService(app.prisma, repository);

  // GET / — list assignments for a lesson
  app.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        querystring: z.object({
          lessonId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { lessonId } = request.query as { lessonId: string };
      const data = await service.listByLesson(lessonId, request.user.id, request.user.roles);
      return { data };
    }
  );

  // POST / — create assignment
  app.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({
          lessonId: z.string().uuid(),
          scope: z.enum(['SCHOOL', 'CLASS', 'USER']),
          targetId: z.string().uuid(),
          note: z.string().optional(),
          dueDate: z.string().datetime().optional(),
        }),
      },
    },
    async (request, reply) => {
      const body = request.body as {
        lessonId: string;
        scope: AssignmentScope;
        targetId: string;
        note?: string;
        dueDate?: string;
      };
      const data = await service.assign(request.user.id, request.user.roles, body);
      return reply.status(201).send({ data });
    }
  );

  // DELETE /:id — remove assignment
  app.delete(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.unassign(id, request.user.id, request.user.roles);
      return { data: { message: 'Đã xóa phân công bài học' } };
    }
  );
};
