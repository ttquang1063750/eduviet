import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/app-error.js';
import { UserRole } from '@eduviet/shared-types';

// Access token payload
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

// Refresh token payload (dùng secret riêng, payload tối giản)
export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

// Augment @fastify/jwt để request.user có type rõ ràng
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
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
    // Map JWT `sub` claim → `id` cho tất cả route handlers dùng request.user.id
    const raw = request.user as unknown as AccessTokenPayload;
    (request as unknown as { user: { id: string; email: string; role: UserRole } }).user = {
      id: raw.sub,
      email: raw.email,
      role: raw.role,
    };
  } catch {
    const err = AppError.unauthorized();
    return reply
      .status(err.statusCode)
      .send({ error: { code: err.code, message: err.message } });
  }
}

export function authorize(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const user = request.user as unknown as { role: UserRole };
    if (!roles.includes(user.role)) {
      const err = AppError.forbidden();
      return reply
        .status(err.statusCode)
        .send({ error: { code: err.code, message: err.message } });
    }
  };
}
