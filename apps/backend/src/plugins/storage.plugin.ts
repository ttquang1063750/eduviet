import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { StorageService } from '../../../../libs/storage/src/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    storage: StorageService;
  }
}

const storagePlugin: FastifyPluginAsync = fp(async (app) => {
  const storage = new StorageService({
    endPoint: process.env['MINIO_ENDPOINT'] ?? 'localhost',
    port: parseInt(process.env['MINIO_PORT'] ?? '9000', 10),
    useSSL: process.env['MINIO_USE_SSL'] === 'true',
    accessKey: process.env['MINIO_ACCESS_KEY'] ?? 'minioadmin',
    secretKey: process.env['MINIO_SECRET_KEY'] ?? 'minioadmin',
    bucket: process.env['MINIO_BUCKET'] ?? 'eduviet',
    publicBaseUrl: process.env['MINIO_PUBLIC_BASE_URL'],
  });

  // Đảm bảo bucket tồn tại khi app khởi động
  await storage.ensureBucket();
  await storage.ensurePublicReadPolicy('public');

  app.decorate('storage', storage);

  app.log.info('[storage] MinIO plugin ready');
});

export default storagePlugin;
