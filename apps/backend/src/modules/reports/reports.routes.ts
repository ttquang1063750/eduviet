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

  app.get(
    '/export/excel',
    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN')] },
    async (_request, reply) => {
      const buffer = await reportsService.exportSummaryExcel();
      const filename = `eduviet-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      return reply
        .header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(buffer);
    }
  );

  app.get(
    '/export/pdf',
    { preHandler: [authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN')] },
    async (_request, reply) => {
      const buffer = await reportsService.exportSummaryPdf();
      const filename = `eduviet-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(buffer);
    }
  );
};
