import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/app-error.js';
import { UserRole } from '@eduviet/shared-types';

// JWT payload shape
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    // Normalised user object populated after jwtVerify()
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    // Map JWT `sub` claim → `id` so all route handlers use request.user.id
    const payload = request.user as unknown as JwtPayload;
    (request.user as FastifyRequest['user']) = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    const err = AppError.unauthorized();
    reply.status(err.statusCode).send({ error: { code: err.code, message: err.message } });
  }
}

export function authorize(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const userRole = (request.user as { role: UserRole }).role;
    if (!roles.includes(userRole)) {
      const err = AppError.forbidden();
      reply.status(err.statusCode).send({ error: { code: err.code, message: err.message } });
    }
  };
}
