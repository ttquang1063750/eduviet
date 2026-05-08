import { FastifyPluginAsync } from 'fastify';
import { ReportsService } from './reports.service.js';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';

export const reportsRoutes: FastifyPluginAsync = async (app) => {
  const reportsService = new ReportsService(app.prisma);

  app.get(
    '/summary',
    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN')] },
    async (request, reply) => {
      const summary = await reportsService.getSummary();
      return reply.send({ data: summary });
    }
  );
};
