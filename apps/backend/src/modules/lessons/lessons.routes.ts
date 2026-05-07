import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authorize } from '../../shared/middleware/authenticate.js';
import { LessonsService } from './lessons.service.js';

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
    let userRole: string | undefined;
    try {
      await request.jwtVerify();
      userRole = (request.user as { role: string }).role;
    } catch {
      // unauthenticated — chỉ thấy PUBLISHED
    }

    const result = await service.list(query.data, userRole as never);
    return reply.send(result);
  });

  // GET /lessons/:slug
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    let userRole: string | undefined;
    try {
      await request.jwtVerify();
      userRole = (request.user as { role: string }).role;
    } catch {
      // unauthenticated
    }

    const lesson = await service.getBySlug(slug, userRole as never);
    return reply.send({ data: lesson });
  });

  // POST /lessons — tạo bài học mới
  app.post(
    '/',
    {
      preHandler: [
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
    { preHandler: [authorize('CONTENT_REVIEWER', 'SUPER_ADMIN')] },
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
    { preHandler: [authorize('CONTENT_APPROVER', 'SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updated = await service.publish(id, request.user.id);
      return reply.send({ data: updated });
    }
  );
};
