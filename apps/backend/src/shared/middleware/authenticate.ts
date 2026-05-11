import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../errors/app-error.js';
import { UserRole } from '@eduviet/shared-types';

// Access token payload
export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: UserRole[];
}

// Refresh token payload (dùng secret riêng, payload tối giản)
export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

// Augment @fastify/jwt để request.user có type rõ ràng
// user.roles là MẢNG — multi-role, không còn user.role đơn
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: {
      id: string;
      email: string;
      roles: UserRole[];
    };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    // Map JWT `sub` claim → `id` cho tất cả route handlers dùng request.user.id
    const raw = request.user as unknown as AccessTokenPayload;
    (request as unknown as { user: { id: string; email: string; roles: UserRole[] } }).user = {
      id: raw.sub,
      email: raw.email,
      roles: Array.isArray(raw.roles) ? raw.roles : [],
    };
  } catch {
    const err = AppError.unauthorized();
    return reply
      .status(err.statusCode)
      .send({ error: { code: err.code, message: err.message } });
  }
}

// OR logic — pass nếu user có ít nhất 1 role trong danh sách
// Callsite authorize('ROLE1', 'ROLE2') không đổi
export function authorize(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const user = request.user as unknown as { roles: UserRole[] };
    const userRoles: UserRole[] = Array.isArray(user.roles) ? user.roles : [];
    const hasRole = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      const err = AppError.forbidden();
      return reply
        .status(err.statusCode)
        .send({ error: { code: err.code, message: err.message } });
    }
  };
}
