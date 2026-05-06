import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';

import prismaPlugin from './plugins/prisma.plugin.js';
import redisPlugin from './plugins/redis.plugin.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { lessonsRoutes } from './modules/lessons/lessons.routes.js';
import { subjectsRoutes } from './modules/subjects/subjects.routes.js';
import { AppError } from './shared/errors/app-error.js';

const app = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] ?? 'info',
    redact: ['req.headers.authorization', 'req.body.password'],
  },
  trustProxy: true,
});

async function bootstrap() {
  // Security
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
  });

  await app.register(cors, {
    origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:4200').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    redis: undefined, // Will use in-memory for dev; swap with redis instance for prod
  });

  // Cookies & JWT
  await app.register(cookie, { secret: process.env['JWT_SECRET'] ?? 'cookie-secret' });
  await app.register(jwt, {
    secret: process.env['JWT_SECRET'] ?? 'jwt-secret-change-in-production',
  });

  // Plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(lessonsRoutes, { prefix: '/api/lessons' });
  await app.register(subjectsRoutes, { prefix: '/api/subjects' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    // Validation errors from Fastify
    if (error.validation) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', details: error.validation },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Đã có lỗi xảy ra, vui lòng thử lại sau' },
    });
  });

  const port = parseInt(process.env['API_PORT'] ?? '3000', 10);
  const host = process.env['API_HOST'] ?? '0.0.0.0';

  await app.listen({ port, host });
  console.log(`🚀 EduViet API running at http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
