import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { UsersService } from './users.service.js';

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
});

export const usersRoutes: FastifyPluginAsync = async (app) => {
  const service = new UsersService(app.prisma);

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
};
