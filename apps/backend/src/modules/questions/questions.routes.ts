import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { QuestionsService } from './questions.service.js';

const WRITER_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'CONTENT_CREATOR',
  'SUBJECT_TEACHER',
  'HOMEROOM_TEACHER',
] as const;

const difficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD', 'ADVANCED']);
const questionTypeEnum = z.enum([
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'FILL_IN_BLANK',
  'SHORT_ANSWER',
  'ESSAY',
  'DRAWING',
]);

const questionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  subjectId: z.string().uuid().optional(),
  type: questionTypeEnum.optional(),
  difficulty: difficultyEnum.optional(),
  search: z.string().optional(),
});

const questionOptionSchema = z.object({
  id: z.string().min(1).max(10),
  text: z.string().min(1).max(1000),
});

const createQuestionSchema = z.object({
  subjectId: z.string().uuid(),
  type: questionTypeEnum,
  content: z.string().min(1).max(5000).trim(),
  options: z.array(questionOptionSchema).min(2).max(8).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().max(5000).optional(),
  hints: z.array(z.string().max(500)).max(5).optional(),
  points: z.number().int().min(1).max(100).optional(),
  difficulty: difficultyEnum.optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

const updateQuestionSchema = z.object({
  content: z.string().min(1).max(5000).trim().optional(),
  options: z.array(questionOptionSchema).min(2).max(8).nullable().optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  explanation: z.string().max(5000).optional(),
  hints: z.array(z.string().max(500)).max(5).optional(),
  points: z.number().int().min(1).max(100).optional(),
  difficulty: difficultyEnum.optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

const generateSchema = z.object({
  keyword: z.string().min(1).max(200).trim(),
  subjectId: z.string().uuid(),
  count: z.number().int().min(1).max(10),
  type: questionTypeEnum.optional(),
});

export const questionsRoutes: FastifyPluginAsync = async (app) => {
  const service = new QuestionsService(app.prisma);

  // GET /api/questions — danh sách câu hỏi (giáo viên+)
  app.get(
    '/',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const query = questionQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' },
        });
      }

      const result = await service.list(query.data, request.user.roles);
      return reply.send(result);
    },
  );

  // POST /api/questions — tạo câu hỏi mới
  app.post(
    '/',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const body = createQuestionSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const question = await service.create(body.data, request.user.id, request.user.roles);
      return reply.status(201).send({ data: question });
    },
  );

  // POST /api/questions/generate — AI tạo câu hỏi (trả draft, không lưu DB)
  app.post(
    '/generate',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const body = generateSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const questions = await service.generate(body.data, request.user.id, request.user.roles);
      return reply.send({ data: questions });
    },
  );

  // GET /api/questions/:id — chi tiết câu hỏi
  app.get(
    '/:id',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const question = await service.getById(id, request.user.roles);
      return reply.send({ data: question });
    },
  );

  // PATCH /api/questions/:id — cập nhật câu hỏi
  app.patch(
    '/:id',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateQuestionSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const question = await service.update(id, body.data, request.user.id, request.user.roles);
      return reply.send({ data: question });
    },
  );

  // DELETE /api/questions/:id — xóa câu hỏi (soft delete)
  app.delete(
    '/:id',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id, request.user.id, request.user.roles);
      return reply.send({ data: { message: 'Đã xóa câu hỏi thành công' } });
    },
  );
};
