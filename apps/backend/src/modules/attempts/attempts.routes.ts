import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AttemptsService } from './attempts.service';
import { authenticate } from '../../shared/middleware/authenticate';
import { z } from 'zod';
import { AttemptMode } from '@eduviet/shared-types';
import { AppError } from '../../shared/errors/app-error';

// ── Zod schemas ───────────────────────────────────────────────────────────────
const startSchema = z.object({
  lessonId: z.string().uuid(),
  mode: z.enum(['PRACTICE', 'TEST', 'MOCK_EXAM']),
});

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
  })),
});

const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional(),
});

const paginationSchema = z.object({
  lessonId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).optional(),
  perPage: z.coerce.number().min(1).max(100).optional(),
});

export default async function attemptsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
) {
  const service = new AttemptsService(fastify.prisma);

  // 1. Start Attempt
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const body = startSchema.safeParse(request.body);
    if (!body.success) throw AppError.badRequest('Dữ liệu không hợp lệ');
    const { lessonId, mode } = body.data;
    const data = await service.startAttempt(request.user.id, lessonId, mode as AttemptMode);
    return reply.status(201).send({ data });
  });

  // 2. Submit Attempt
  fastify.post('/:id/submit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = submitSchema.safeParse(request.body);
    if (!body.success) throw AppError.badRequest('Dữ liệu không hợp lệ');
    const data = await service.submitAttempt(id, request.user.id, body.data.answers);
    return reply.send({ data });
  });

  // 3. Get My History
  fastify.get('/my', { preHandler: [authenticate] }, async (request, reply) => {
    const q = paginationSchema.safeParse(request.query);
    const { lessonId, page, perPage } = q.success ? q.data : {};
    const { data, total } = await service.getMyHistory(request.user.id, { lessonId, page, perPage });
    return reply.send({ data, meta: { total, page, perPage } });
  });

  // 4. Get Result (Attempt Detail)
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = await service.getResult(id, request.user.id, request.user.roles);
    return reply.send({ data });
  });

  // 5. Get Pending Grading (Staff only)
  fastify.get('/pending-grading', { preHandler: [authenticate] }, async (request, reply) => {
    const q = paginationSchema.safeParse(request.query);
    const { page, perPage } = q.success ? q.data : {};
    const { data, total } = await service.getPendingGrading(request.user.roles, page, perPage);
    return reply.send({ data, meta: { total, page, perPage } });
  });

  // 6. Grade Answer (Staff only)
  fastify.patch('/:id/answers/:answerId/grade', { preHandler: [authenticate] }, async (request, reply) => {
    const { answerId } = request.params as { id: string; answerId: string };
    const body = gradeSchema.safeParse(request.body);
    if (!body.success) throw AppError.badRequest('Dữ liệu không hợp lệ');
    const data = await service.gradeAnswer(answerId, request.user.id, request.user.roles, body.data);
    return reply.send({ data });
  });
}
