import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { GeoService } from './geo.service.js';

const nationIdSchema = z.object({ nationId: z.string().uuid().optional() });
const provinceIdSchema = z.object({ provinceId: z.string().uuid().optional() });

export const geoRoutes: FastifyPluginAsync = async (app) => {
  const service = new GeoService(app.prisma);

  // GET /api/geo/nations — danh sách quốc gia
  app.get('/nations', { preHandler: [authenticate] }, async (_request, reply) => {
    const nations = await service.getNations();
    return reply.send({ data: nations });
  });

  // GET /api/geo/provinces?nationId= — tỉnh/thành theo quốc gia (lazy-load cho tree)
  app.get('/provinces', { preHandler: [authenticate] }, async (request, reply) => {
    const query = nationIdSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
    }
    const provinces = await service.getProvinces(query.data.nationId);
    return reply.send({ data: provinces });
  });

  // GET /api/geo/districts?provinceId= — quận/huyện theo tỉnh (lazy-load cho tree)
  app.get('/districts', { preHandler: [authenticate] }, async (request, reply) => {
    const query = provinceIdSchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Query không hợp lệ' } });
    }
    const districts = await service.getDistricts(query.data.provinceId);
    return reply.send({ data: districts });
  });
};
