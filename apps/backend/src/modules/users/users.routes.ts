import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^(\+84|0)[0-9]{9}$/).optional(),
  isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  role: z.string().optional(),
  search: z.string().optional(),
});

export const usersRoutes: FastifyPluginAsync = async (app) => {
  // List users — Admin only
  app.get(
    '/',
    { preHandler: [authorize('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN')] },
    async (request, reply) => {
      const query = paginationSchema.safeParse(request.query);
      if (!query.success) return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });

      const { page, perPage, role, search } = query.data;
      const skip = (page - 1) * perPage;

      const where = {
        deletedAt: null,
        ...(role ? { role: role as never } : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [users, total] = await Promise.all([
        app.prisma.user.findMany({
          where,
          select: {
            id: true, email: true, fullName: true, role: true,
            avatarUrl: true, isActive: true, isVerified: true,
            schoolId: true, createdAt: true,
          },
          skip,
          take: perPage,
          orderBy: { createdAt: 'desc' },
        }),
        app.prisma.user.count({ where }),
      ]);

      return reply.send({
        data: users,
        meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
      });
    }
  );

  // Get user by ID
  app.get(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Users can only see their own profile unless admin
      const currentUser = request.user;
      const isAdmin = ['SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN'].includes(currentUser.role);
      if (!isAdmin && currentUser.id !== id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền xem thông tin này' } });
      }

      const user = await app.prisma.user.findUnique({
        where: { id, deletedAt: null },
        select: {
          id: true, email: true, fullName: true, role: true,
          avatarUrl: true, phone: true, isActive: true, isVerified: true,
          schoolId: true, school: { select: { id: true, name: true } },
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại' } });
      }

      return reply.send({ data: user });
    }
  );

  // Update user
  app.patch(
    '/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateUserSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' } });
      }

      const currentUser = request.user;
      const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(currentUser.role);
      if (!isAdmin && currentUser.id !== id) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền cập nhật thông tin này' } });
      }

      // Only admins can change isActive
      const data = isAdmin ? body.data : { fullName: body.data.fullName, phone: body.data.phone };

      const user = await app.prisma.user.update({
        where: { id, deletedAt: null },
        data,
        select: {
          id: true, email: true, fullName: true, role: true,
          avatarUrl: true, isActive: true, createdAt: true,
        },
      });

      await app.prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USER_UPDATED',
          resourceType: 'USER',
          resourceId: id,
          details: { updatedFields: Object.keys(body.data) },
        },
      });

      return reply.send({ data: user });
    }
  );
};
