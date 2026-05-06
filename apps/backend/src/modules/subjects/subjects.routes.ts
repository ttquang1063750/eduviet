import { FastifyPluginAsync } from 'fastify';

export const subjectsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_request, reply) => {
    const subjects = await app.prisma.subject.findMany({
      orderBy: { name: 'asc' },
    });
    return reply.send({ data: subjects });
  });
};
