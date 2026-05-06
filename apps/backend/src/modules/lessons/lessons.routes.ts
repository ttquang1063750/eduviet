import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';

const lessonQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(50).default(12),
  subject: z.string().optional(),
  grade: z.coerce.number().min(1).max(12).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'ADVANCED']).optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).optional(),
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

const reviewNoteSchema = z.object({
  note: z.string().optional(),
});

export const lessonsRoutes: FastifyPluginAsync = async (app) => {
  // Public: list published lessons
  app.get('/', async (request, reply) => {
    const query = lessonQuerySchema.safeParse(request.query);
    if (!query.success) return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });

    const { page, perPage, subject, grade, difficulty, status, search } = query.data;
    const skip = (page - 1) * perPage;

    // Non-authenticated users can only see PUBLISHED
    let allowedStatuses: string[] = ['PUBLISHED'];
    try {
      await request.jwtVerify();
      const userRole = (request.user as { role: string }).role;
      if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_CREATOR', 'CONTENT_REVIEWER', 'CONTENT_APPROVER'].includes(userRole)) {
        allowedStatuses = status ? [status] : ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
      }
    } catch {
      // unauthenticated — only published
    }

    const where = {
      deletedAt: null,
      status: { in: allowedStatuses as never[] },
      ...(subject ? { subject: { code: subject as never } } : {}),
      ...(grade ? { grade } : {}),
      ...(difficulty ? { difficulty: difficulty as never } : {}),
      ...(search ? { OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { topic: { contains: search, mode: 'insensitive' as const } },
      ]} : {}),
    };

    const [lessons, total] = await Promise.all([
      app.prisma.lesson.findMany({
        where,
        select: {
          id: true, title: true, slug: true, grade: true, topic: true,
          difficulty: true, status: true, estimatedMinutes: true, publishedAt: true,
          subject: { select: { id: true, code: true, name: true, color: true } },
        },
        skip,
        take: perPage,
        orderBy: { publishedAt: 'desc' },
      }),
      app.prisma.lesson.count({ where }),
    ]);

    return reply.send({
      data: lessons,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  });

  // Get single lesson
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const lesson = await app.prisma.lesson.findUnique({
      where: { slug, deletedAt: null },
      include: {
        subject: true,
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
        exercises: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!lesson) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Bài học không tồn tại' } });
    }

    if (lesson.status !== 'PUBLISHED') {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền xem bài học này' } });
      }
    }

    // Hide correct answers for exercises (students see during quiz)
    const sanitizedLesson = {
      ...lesson,
      exercises: lesson.exercises.map(({ correctAnswer: _ca, ...ex }) => ex),
    };

    return reply.send({ data: sanitizedLesson });
  });

  // Create lesson — CONTENT_CREATOR+
  app.post(
    '/',
    {
      preHandler: [
        authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_CREATOR', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER'),
      ],
    },
    async (request, reply) => {
      const body = createLessonSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
      }

      const slug = body.data.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100) + '-' + Date.now();

      const lesson = await app.prisma.lesson.create({
        data: {
          ...body.data,
          slug,
          creatorId: request.user.id,
          status: 'DRAFT',
        },
        include: { subject: true },
      });

      await app.prisma.auditLog.create({
        data: {
          userId: request.user.id,
          action: 'LESSON_CREATED',
          resourceType: 'LESSON',
          resourceId: lesson.id,
        },
      });

      return reply.status(201).send({ data: lesson });
    }
  );

  // Submit for review
  app.post(
    '/:id/submit-review',
    { preHandler: [authorize('CONTENT_CREATOR', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER', 'SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const lesson = await app.prisma.lesson.findUnique({ where: { id, deletedAt: null } });
      if (!lesson) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Bài học không tồn tại' } });
      if (lesson.status !== 'DRAFT' && lesson.status !== 'REJECTED') {
        return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Bài học không ở trạng thái có thể submit' } });
      }

      const updated = await app.prisma.lesson.update({
        where: { id },
        data: { status: 'IN_REVIEW' },
      });

      return reply.send({ data: updated });
    }
  );

  // Reviewer approve/reject
  app.post(
    '/:id/review',
    { preHandler: [authorize('CONTENT_REVIEWER', 'SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z.object({
        action: z.enum(['approve', 'reject']),
        note: z.string().optional(),
      }).safeParse(request.body);

      if (!body.success) return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } });

      const lesson = await app.prisma.lesson.findUnique({ where: { id, deletedAt: null } });
      if (!lesson) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Bài học không tồn tại' } });
      if (lesson.status !== 'IN_REVIEW') {
        return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Bài học không ở trạng thái chờ review' } });
      }

      const newStatus = body.data.action === 'approve' ? 'APPROVED' : 'REJECTED';
      const updated = await app.prisma.lesson.update({
        where: { id },
        data: { status: newStatus, reviewerId: request.user.id, reviewNote: body.data.note },
      });

      return reply.send({ data: updated });
    }
  );

  // Approver publish
  app.post(
    '/:id/publish',
    { preHandler: [authorize('CONTENT_APPROVER', 'SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = reviewNoteSchema.safeParse(request.body);

      const lesson = await app.prisma.lesson.findUnique({ where: { id, deletedAt: null } });
      if (!lesson) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Bài học không tồn tại' } });
      if (lesson.status !== 'APPROVED') {
        return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Bài học chưa được review approve' } });
      }

      const updated = await app.prisma.lesson.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });

      await app.prisma.auditLog.create({
        data: {
          userId: request.user.id,
          action: 'LESSON_PUBLISHED',
          resourceType: 'LESSON',
          resourceId: id,
        },
      });

      return reply.send({ data: updated });
    }
  );
};
