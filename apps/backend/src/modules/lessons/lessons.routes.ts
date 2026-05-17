import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authorize, authenticate } from '../../shared/middleware/authenticate.js';
import { LessonsService } from './lessons.service.js';

const WRITER_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'CONTENT_CREATOR',
  'SUBJECT_TEACHER',
  'HOMEROOM_TEACHER',
] as const;

const lessonQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(50).default(12),
  subject: z.string().optional(),
  grade: z.coerce.number().min(1).max(12).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'ADVANCED']).optional(),
  status: z
    .enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'])
    .optional(),
  search: z.string().optional(),
});

const createLessonSchema = z.object({
  title: z.string().min(5).max(200).trim(),
  subjectId: z.string().uuid(),
  grade: z.number().min(1).max(12),
  topic: z.string().min(2).max(200).trim(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'ADVANCED']),
  theory: z.string().min(10),
  estimatedMinutes: z.number().min(5).max(180).default(30),
});

const reviewBodySchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().optional(),
});

export const lessonsRoutes: FastifyPluginAsync = async (app) => {
  const service = new LessonsService(app.prisma);

  // GET /lessons — danh sách (public: PUBLISHED, admin: tất cả)
  app.get('/', async (request, reply) => {
    const query = lessonQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply
        .status(400)
        .send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
    }

    // Xác định quyền (không bắt buộc đăng nhập)
    let userRoles: string[] | undefined;
    let userId: string | undefined;
    try {
      await request.jwtVerify();
      userRoles = (request.user as { roles?: string[] }).roles;
      userId = (request.user as { id?: string }).id;
    } catch {
      // unauthenticated — chỉ thấy PUBLISHED
    }

    const result = await service.list(query.data, userRoles as never, userId);
    return reply.send(result);
  });

  // GET /lessons/:slug
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    let userRoles: string[] | undefined;
    try {
      await request.jwtVerify();
      userRoles = (request.user as { roles?: string[] }).roles;
    } catch {
      // unauthenticated
    }

    const lesson = await service.getBySlug(slug, userRoles as never);
    return reply.send({ data: lesson });
  });

  // GET /lessons/id/:id
  app.get('/id/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const lesson = await service.getById(id);
    return reply.send({ data: lesson });
  });

  // POST /lessons — tạo bài học mới
  app.post(
    '/',
    {
      preHandler: [
        authenticate,
        authorize(
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'CONTENT_CREATOR',
          'SUBJECT_TEACHER',
          'HOMEROOM_TEACHER'
        ),
      ],
    },
    async (request, reply) => {
      const body = createLessonSchema.safeParse(request.body);
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

      const lesson = await service.create(body.data, request.user.id);
      return reply.status(201).send({ data: lesson });
    }
  );

  // POST /lessons/:id/submit-review
  app.post(
    '/:id/submit-review',
    {
      preHandler: [
        authenticate,
        authorize('CONTENT_CREATOR', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER', 'SUPER_ADMIN'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updated = await service.submitForReview(id, request.user.id);
      return reply.send({ data: updated });
    }
  );

  // POST /lessons/:id/review — reviewer approve/reject
  app.post(
    '/:id/review',
    { preHandler: [authenticate, authorize('CONTENT_REVIEWER', 'SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = reviewBodySchema.safeParse(request.body);
      if (!body.success) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } });
      }

      const updated = await service.review(
        id,
        request.user.id,
        body.data.action,
        body.data.note
      );
      return reply.send({ data: updated });
    }
  );

  // POST /lessons/:id/publish — approver publish
  app.post(
    '/:id/publish',
    { preHandler: [authenticate, authorize('CONTENT_APPROVER', 'SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updated = await service.publish(id, request.user.id);
      return reply.send({ data: updated });
    }
  );

  // PATCH /lessons/:id — cập nhật bài học
  app.patch(
    '/:id',
    {
      preHandler: [
        authenticate,
        authorize(...WRITER_ROLES),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      // Dùng partial của create schema
      const body = createLessonSchema.partial().safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
        });
      }

      const updated = await service.update(id, body.data, request.user.id, request.user.roles);
      return reply.send({ data: updated });
    }
  );

  // PATCH /lessons/:id/assign — gán reviewer
  app.patch(
    '/:id/assign',
    {
      preHandler: [
        authenticate,
        authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_APPROVER'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z.object({ reviewerId: z.string().uuid() }).safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'reviewerId không hợp lệ' },
        });
      }

      const updated = await service.assignReviewer(id, body.data.reviewerId, request.user.id, request.user.roles);
      return reply.send({ data: updated });
    }
  );

  // ─── Lesson Questions (nested) ─────────────────────────────────────────────

  // GET /lessons/:id/questions — danh sách câu hỏi gắn với bài học
  app.get(
    '/:id/questions',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const questions = await service.getLessonQuestions(id, request.user.roles);
      return reply.send({ data: questions });
    }
  );

  // POST /lessons/:id/questions — gắn câu hỏi vào bài học
  app.post(
    '/:id/questions',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z
        .object({ questionId: z.string().uuid() })
        .safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'questionId không hợp lệ' },
        });
      }
      const result = await service.addQuestionToLesson(id, body.data.questionId, request.user.id, request.user.roles);
      return reply.status(201).send({ data: result });
    }
  );

  // DELETE /lessons/:id/questions/:questionId — gỡ câu hỏi khỏi bài học
  app.delete(
    '/:id/questions/:questionId',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id, questionId } = request.params as { id: string; questionId: string };
      await service.removeQuestionFromLesson(id, questionId, request.user.id, request.user.roles);
      return reply.send({ data: { message: 'Đã gỡ câu hỏi khỏi bài học' } });
    }
  );

  // PATCH /lessons/:id/questions/reorder — sắp xếp thứ tự câu hỏi
  app.patch(
    '/:id/questions/reorder',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z
        .object({ orderedIds: z.array(z.string().uuid()).min(1) })
        .safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'orderedIds không hợp lệ' },
        });
      }
      await service.reorderLessonQuestions(id, body.data.orderedIds, request.user.id, request.user.roles);
      return reply.send({ data: { message: 'Đã cập nhật thứ tự câu hỏi' } });
    }
  );

  // PATCH /lessons/:id/randomize — bật/tắt randomize
  app.patch(
    '/:id/randomize',
    { preHandler: [authenticate, authorize(...WRITER_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z
        .object({ randomize: z.boolean() })
        .safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'randomize phải là boolean' },
        });
      }
      const updated = await service.setRandomize(id, body.data.randomize, request.user.id, request.user.roles);
      return reply.send({ data: updated });
    }
  );
};
