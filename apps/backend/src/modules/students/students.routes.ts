import { FastifyPluginAsync } from 'fastify';
import { authenticate, authorize } from '../../shared/middleware/authenticate.js';
import { StudentsService } from './students.service.js';

export const studentsRoutes: FastifyPluginAsync = async (app) => {
  const service = new StudentsService(app.prisma);

  // GET /api/students/me/dashboard — dashboard cá nhân của học sinh
  app.get(
    '/me/dashboard',
    {
      preHandler: [
        authenticate,
        authorize(
          'STUDENT',
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'HOMEROOM_TEACHER',
          'SUBJECT_TEACHER',
        ),
      ],
    },
    async (request, reply) => {
      const dashboard = await service.getMyDashboard(request.user.id);
      return reply.send({ data: dashboard });
    },
  );
};
