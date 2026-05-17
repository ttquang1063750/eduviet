import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AttemptsService } from './attempts.service';
import { authenticate } from '../../shared/middleware/authenticate';
import { z } from 'zod';
import { AttemptMode } from '@eduviet/shared-types';

export default async function attemptsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  const service = new AttemptsService(fastify.prisma);

  // 1. Start Attempt
  fastify.post('/', {
    preHandler: [authenticate],
    schema: {
      body: z.object({
        lessonId: z.string().uuid(),
        mode: z.enum(['PRACTICE', 'TEST', 'MOCK_EXAM']),
      }),
    },
    handler: async (request, reply) => {
      const { lessonId, mode } = request.body as { lessonId: string; mode: AttemptMode };
      const data = await service.startAttempt(request.user.id, lessonId, mode);
      return { data };
    },
  });

  // 2. Submit Attempt
  fastify.post('/:id/submit', {
    preHandler: [authenticate],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        answers: z.array(z.object({
          questionId: z.string().uuid(),
          answer: z.any(),
        })),
      }),
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { answers } = request.body as { answers: { questionId: string; answer: any }[] };
      const data = await service.submitAttempt(id, request.user.id, answers);
      return { data };
    },
  });

  // 3. Get My History
  fastify.get('/my', {
    preHandler: [authenticate],
    schema: {
      querystring: z.object({
        lessonId: z.string().uuid().optional(),
        page: z.coerce.number().min(1).optional(),
        perPage: z.coerce.number().min(1).max(100).optional(),
      }),
    },
    handler: async (request, reply) => {
      const { lessonId, page, perPage } = request.query as any;
      const { data, total } = await service.getMyHistory(request.user.id, { lessonId, page, perPage });
      return { data, meta: { total, page, perPage } };
    },
  });

  // 4. Get Result (Attempt Detail)
  fastify.get('/:id', {
    preHandler: [authenticate],
    schema: {
      params: z.object({ id: z.string().uuid() }),
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = await service.getResult(id, request.user.id, request.user.roles);
      return { data };
    },
  });

  // 5. Get Pending Grading (Staff only)
  fastify.get('/pending-grading', {
    preHandler: [authenticate],
    schema: {
      querystring: z.object({
        page: z.coerce.number().min(1).optional(),
        perPage: z.coerce.number().min(1).max(100).optional(),
      }),
    },
    handler: async (request, reply) => {
      const { page, perPage } = request.query as any;
      const { data, total } = await service.getPendingGrading(request.user.roles, page, perPage);
      return { data, meta: { total, page, perPage } };
    },
  });

  // 6. Grade Answer (Staff only)
  fastify.patch('/:id/answers/:answerId/grade', {
    preHandler: [authenticate],
    schema: {
      params: z.object({
        id: z.string().uuid(),
        answerId: z.string().uuid(),
      }),
      body: z.object({
        score: z.number().min(0),
        feedback: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const { answerId } = request.params as { answerId: string };
      const body = request.body as { score: number; feedback?: string };
      const data = await service.gradeAnswer(answerId, request.user.id, request.user.roles, body);
      return { data };
    },
  });
}
