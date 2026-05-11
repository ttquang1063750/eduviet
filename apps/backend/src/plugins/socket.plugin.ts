import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { UserRole } from '@eduviet/shared-types';
import { AccessTokenPayload } from '../shared/middleware/authenticate.js';

// ─── Socket user type ─────────────────────────────────────────────────────────

export interface SocketUser {
  id: string;
  email: string;
  roles: UserRole[];
}

// ─── Type augmentations ───────────────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

declare module 'socket.io' {
  interface Socket {
    user: SocketUser;
  }
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

const socketPlugin: FastifyPluginAsync = fp(async (app) => {
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  // Socket.io Redis adapter cần 2 kết nối riêng biệt (pub + sub)
  const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });
  const subClient = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true });

  await Promise.all([pubClient.connect(), subClient.connect()]);

  const io = new Server(app.server, {
    cors: {
      origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:4200').split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.adapter(createAdapter(pubClient, subClient));

  // ── JWT auth middleware ────────────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth['token'] as string | undefined;
      if (!token) return next(new Error('UNAUTHORIZED'));

      const payload = app.jwt.verify<AccessTokenPayload>(token);
      socket.user = {
        id: payload.sub,
        email: payload.email,
        roles: Array.isArray(payload.roles) ? payload.roles : [],
      };
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  app.decorate('io', io);

  app.addHook('onClose', async () => {
    io.close();
    await Promise.all([pubClient.quit(), subClient.quit()]);
  });
});

export default socketPlugin;
