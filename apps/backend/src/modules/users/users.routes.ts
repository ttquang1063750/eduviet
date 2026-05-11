import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { UsersService } from './users.service.js';
import type { UserRole } from '@eduviet/shared-types';

const USER_ROLES = [
  'SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN',
  'CONTENT_CREATOR', 'CONTENT_REVIEWER', 'CONTENT_APPROVER',
  'GRADER', 'HOMEROOM_TEACHER', 'SUBJECT_TEACHER', 'STUDENT', 'PARENT',
] as const;

const rolesSchema = z
  .array(z.enum(USER_ROLES))
  .min(1, 'Phải có ít nhất 1 vai trò');

const createUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100).trim(),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  roles: rolesSchema,
  title: z.string().max(100).optional(),
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
  roles: rolesSchema.optional(),
  title: z.string().max(100).nullable().optional(),
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

      const user = await service.create(body.data, request.user.id, request.user.roles);
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
    const user = await service.getById(id, request.user.id, request.user.roles);
    return reply.send({ data: user });
  });

  // DELETE /users/:id — soft delete, chỉ SUPER_ADMIN
  app.delete(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id, request.user.id, request.user.roles);
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

    const user = await service.update(id, body.data, request.user.id, request.user.roles);
    return reply.send({ data: user });
  });

  // PATCH /users/:id/roles — đổi roles, chỉ SUPER_ADMIN
  app.patch(
    '/:id/roles',
    { preHandler: [authorize('SUPER_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z.object({ roles: rolesSchema }).safeParse(request.body);

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

      const user = await service.changeRoles(
        id,
        body.data.roles as UserRole[],
        request.user.id,
        request.user.roles
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
        request.user.roles
      );
      return reply.send({ data: user });
    }
  );
};
