import { FastifyRequest, FastifyReply } from 'fastify';
import { AccessTokenPayload } from './authenticate.js';
import { UserRole } from '@eduviet/shared-types';

/**
 * Middleware tuỳ chọn — thử xác thực JWT nhưng không reject nếu không có token.
 * Nếu token hợp lệ: map request.user như `authenticate`.
 * Nếu không có token / token không hợp lệ: bỏ qua, tiếp tục như guest request.
 *
 * Dùng cho các route public nhưng cần biết role nếu đã đăng nhập
 * (vd: GET /blog để lọc nội dung theo role).
 */
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
    // Chúng ta cast sang bất kỳ vì augmentation nằm ở authenticate.ts
    const raw = request.user as unknown as AccessTokenPayload;
    (request as unknown as { user: { id: string; email: string; roles: UserRole[] } }).user = {
      id: raw.sub,
      email: raw.email,
      roles: Array.isArray(raw.roles) ? raw.roles : [],
    };
  } catch {
    // Token vắng mặt hoặc không hợp lệ — tiếp tục như guest, không throw
  }
}
