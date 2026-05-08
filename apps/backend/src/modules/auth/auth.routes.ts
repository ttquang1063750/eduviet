import { FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { authenticate } from '../../shared/middleware/authenticate.js';

const COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60,
};

// Rate limit chặt hơn cho endpoints nhạy cảm (chống brute-force)
const AUTH_RATE_LIMIT = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
      errorResponseBuilder: () => ({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Quá nhiều lần thử. Vui lòng đợi 15 phút và thử lại.',
        },
      }),
    },
  },
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = new AuthService(app);

  // POST /auth/register
  app.post('/register', AUTH_RATE_LIMIT, async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
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

    const result = await authService.register(body.data, request.ip);
    return reply.status(201).send({ data: result });
  });

  // POST /auth/login — rate limited (5 req / 15 phút per IP)
  app.post('/login', AUTH_RATE_LIMIT, async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
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

    const { accessToken, refreshToken, user } = await authService.login(
      body.data,
      request.headers['user-agent'],
      request.ip
    );

    reply.setCookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    return reply.send({ data: { accessToken, user } });
  });

  // POST /auth/refresh — rate limited nhẹ hơn (20 req / 15 phút)
  app.post(
    '/refresh',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '15 minutes',
        },
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies[COOKIE_NAME];
      if (!refreshToken) {
        return reply.status(401).send({
          error: { code: 'UNAUTHORIZED', message: 'Refresh token không tồn tại' },
        });
      }

      const { accessToken, newRefreshToken } = await authService.refresh(refreshToken);
      reply.setCookie(COOKIE_NAME, newRefreshToken, COOKIE_OPTIONS);
      return reply.send({ data: { accessToken } });
    }
  );

  // POST /auth/logout
  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const refreshToken = request.cookies[COOKIE_NAME];
    await authService.logout(request.user.id, refreshToken);
    reply.clearCookie(COOKIE_NAME, { path: '/api/auth' });
    return reply.send({ data: { message: 'Đăng xuất thành công' } });
  });

  // GET /auth/me
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        schoolId: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      return reply
        .status(404)
        .send({ error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại' } });
    }

    return reply.send({ data: user });
  });
};
