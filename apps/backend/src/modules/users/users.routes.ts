import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { UsersService } from './users.service.js';

const createUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100).trim(),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  role: z.nativeEnum(Role),
  phone: z
    .string()
    .regex(/^(\+84|0)[0-9]{9}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  schoolId: z.string().uuid('schoolId phải là UUID hợp lệ').optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+84|0)[0-9]{9}$/)
    .optional(),
  isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  role: z.string().optional(),
  search: z.string().optional(),
  schoolId: z.string().uuid().optional(),
});

export const usersRoutes: FastifyPluginAsync = async (app) => {
  const service = new UsersService(app.prisma);

  // POST /users — tạo user mới, chỉ SUPER_ADMIN và SCHOOL_ADMIN
  app.post(
    '/',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
      preHandler: [authorize('SUPER_ADMIN', 'SCHOOL_ADMIN')],
    },
    async (request, reply) => {
      const body = createUserSchema.safeParse(request.body);
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

      const user = await service.create(body.data, request.user.id, request.user.role);
      return reply.status(201).send({ data: user });
    }
  );

  // GET /users — danh sách users, chỉ admin
  app.get(
    '/',
    { preHandler: [authorize('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN')] },
    async (request, reply) => {
      const query = paginationSchema.safeParse(request.query);
      if (!query.success) {
        return reply
          .status(400)
          .send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
      }

      const result = await service.list(query.data);
      return reply.send(result);
    }
  );

  // GET /users/:id
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await service.getById(id, request.user.id, request.user.role);
    return reply.send({ data: user });
  });

  // DELETE /users/:id — soft delete, chỉ SUPER_ADMIN
  app.delete(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id, request.user.id, request.user.role);
      return reply.status(204).send();
    }
  );

  // PATCH /users/:id
  app.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateUserSchema.safeParse(request.body);
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

    const user = await service.update(id, body.data, request.user.id, request.user.role);
    return reply.send({ data: user });
  });

  // PATCH /users/:id/role — đổi role, chỉ SUPER_ADMIN
  app.patch(
    '/:id/role',
    {
      preHandler: [authorize('SUPER_ADMIN')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z.object({ role: z.nativeEnum(Role) }).safeParse(request.body);

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

      const user = await service.changeRole(
        id,
        body.data.role as never,
        request.user.id,
        request.user.role
      );
      return reply.send({ data: user });
    }
  );

  // PATCH /users/:id/school — gán trường, chỉ SUPER_ADMIN và SCHOOL_ADMIN
  app.patch(
    '/:id/school',
    {
      preHandler: [authorize('SUPER_ADMIN', 'SCHOOL_ADMIN')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z
        .object({ schoolId: z.string().uuid().nullable() })
        .safeParse(request.body);

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

      const user = await service.assignSchool(
        id,
        body.data.schoolId,
        request.user.id,
        request.user.role
      );
      return reply.send({ data: user });
    }
  );
};
