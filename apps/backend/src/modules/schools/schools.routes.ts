import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authorize, authenticate } from '../../shared/middleware/authenticate.js';
import { SchoolsService } from './schools.service.js';

const createSchoolSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  code: z.string().min(2).max(20).trim().toUpperCase(),
  address: z.string().max(500).trim().optional(),
  phone: z.string().regex(/^(\+84|0)[0-9]{9}$/).optional(),
  email: z.string().email().optional(),
  districtId: z.string().uuid(),
});

const updateSchoolSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  address: z.string().max(500).trim().optional(),
  phone: z.string().regex(/^(\+84|0)[0-9]{9}$/).optional(),
  email: z.string().email().optional(),
});

const listSchoolSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  districtId: z.string().uuid().optional(),
  provinceId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const schoolsRoutes: FastifyPluginAsync = async (app) => {
  const service = new SchoolsService(app.prisma);

  // GET /schools/provinces — danh sách tỉnh/thành (public)
  app.get('/provinces', async (_request, reply) => {
    const provinces = await service.getProvinces();
    return reply.send({ data: provinces });
  });

  // GET /schools/districts?provinceId=... (public)
  app.get('/districts', async (request, reply) => {
    const { provinceId } = request.query as { provinceId?: string };
    const districts = await service.getDistricts(provinceId);
    return reply.send({ data: districts });
  });

  // GET /schools — danh sách trường (yêu cầu đăng nhập)
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const query = listSchoolSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
    }
    const result = await service.list(query.data);
    return reply.send(result);
  });

  // GET /schools/:id
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const school = await service.getById(id);
    return reply.send({ data: school });
  });

  // POST /schools — tạo trường mới (chỉ admin cấp huyện trở lên)
  app.post(
    '/',
    { preHandler: [authorize('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN')] },
    async (request, reply) => {
      const body = createSchoolSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
      }
      const school = await service.create(body.data, request.user.id);
      return reply.status(201).send({ data: school });
    }
  );

  // PATCH /schools/:id
  app.patch(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateSchoolSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
        });
      }
      const school = await service.update(id, body.data, request.user.id);
      return reply.send({ data: school });
    }
  );

  // DELETE /schools/:id (soft delete)
  app.delete(
    '/:id',
    { preHandler: [authorize('SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await service.delete(id, request.user.id);
      return reply.send({ data: { message: 'Trường học đã được xóa thành công' } });
    }
  );
};
