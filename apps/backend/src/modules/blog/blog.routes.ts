import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { optionalAuthenticate } from '../../shared/middleware/optional-authenticate.js';
import { BlogService } from './blog.service.js';
import { UserRole } from '@eduviet/shared-types';

const createPostSchema = z.object({
  title: z.string().min(5).max(300).trim(),
  content: z.string().min(20),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

const updatePostSchema = createPostSchema.partial();

const commentSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  parentId: z.string().uuid().optional(),
});

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(50).default(10),
  tag: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  authorId: z.string().uuid().optional(),
});

export const blogRoutes: FastifyPluginAsync = async (app) => {
  const service = new BlogService(app.prisma);

  // GET /blog — public, nhưng role ảnh hưởng filter nội dung (vd: DRAFT chỉ hiện cho author/admin)
  app.get('/', { preHandler: [optionalAuthenticate] }, async (request, reply) => {
    const query = listSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
    }
    const userRole = (request.user as { role?: UserRole } | undefined)?.role;
    const result = await service.list(query.data, userRole);
    return reply.send(result);
  });

  // GET /blog/tags — lấy danh sách tags phổ biến
  app.get('/tags', async (request, reply) => {
    const query = z.object({ limit: z.coerce.number().min(1).max(100).default(20) }).safeParse(request.query);
    const limit = query.success ? query.data.limit : 20;
    const tags = await service.getTags(limit);
    return reply.send({ data: tags });
  });

  // GET /blog/:slug — public, nhưng role quyết định có xem DRAFT/REVIEW không
  app.get('/:slug', { preHandler: [optionalAuthenticate] }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const userRole = (request.user as { role?: UserRole } | undefined)?.role;
    const post = await service.getBySlug(slug, userRole);
    return reply.send({ data: post });
  });

  // POST /blog — tạo bài viết
  app.post(
    '/',
    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_CREATOR', 'SUBJECT_TEACHER', 'HOMEROOM_TEACHER')] },
    async (request, reply) => {
      const body = createPostSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        });
      }
      const post = await service.create(body.data, request.user.id);
      return reply.status(201).send({ data: post });
    }
  );

  // PATCH /blog/:id
  app.patch(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updatePostSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } });
      }
      const post = await service.update(id, body.data, request.user.id);
      return reply.send({ data: post });
    }
  );

  // POST /blog/:id/submit-review — CONTENT_CREATOR gửi bài lên REVIEW
  app.post(
    '/:id/submit-review',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const post = await service.submitForReview(id, request.user.id);
      return reply.send({ data: post });
    }
  );

  // POST /blog/:id/publish
  app.post(
    '/:id/publish',
    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_APPROVER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const post = await service.publish(id, request.user.id);
      return reply.send({ data: post });
    }
  );

  // DELETE /blog/:id
  app.delete(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id, request.user.id);
      return reply.send({ data: { message: 'Bài viết đã được xóa' } });
    }
  );

  // POST /blog/:id/comments
  app.post(
    '/:id/comments',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = commentSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Nội dung bình luận không hợp lệ' } });
      }
      const comment = await service.addComment(id, body.data, request.user.id);
      return reply.status(201).send({ data: comment });
    }
  );

  // PATCH /blog/comments/:commentId/hide — moderator ẩn comment
  app.patch(
    '/comments/:commentId/hide',
    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_REVIEWER', 'CONTENT_APPROVER')] },
    async (request, reply) => {
      const { commentId } = request.params as { commentId: string };
      const comment = await service.hideComment(commentId, request.user.role as UserRole);
      return reply.send({ data: comment });
    }
  );

  // DELETE /blog/comments/:commentId
  app.delete(
    '/comments/:commentId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { commentId } = request.params as { commentId: string };
      await service.deleteComment(commentId, request.user.id, request.user.role as UserRole);
      return reply.send({ data: { message: 'Bình luận đã được xóa' } });
    }
  );
};
