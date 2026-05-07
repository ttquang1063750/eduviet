import { FastifyPluginAsync } from 'fastify';
import { SubjectsService } from './subjects.service.js';

export const subjectsRoutes: FastifyPluginAsync = async (app) => {
  const service = new SubjectsService(app.prisma);

  app.get('/', async (_request, reply) => {
    const subjects = await service.list();
    return reply.send({ data: subjects });
  });
};
