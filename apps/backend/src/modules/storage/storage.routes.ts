import { FastifyPluginAsyncZod } from 'fastify-zod-openapi';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import crypto from 'node:crypto';
import path from 'node:path';

// MIME types được phép upload
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

// Kích thước tối đa: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const UploadResponseSchema = z.object({
  data: z.object({
    url: z.string().url(),
    key: z.string(),
    size: z.number(),
    mimeType: z.string(),
  }),
});

export const storageRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * POST /api/storage/upload
   * Upload file chung — dùng cho lesson assets, avatar, v.v.
   * Chat upload dùng route riêng tại /api/chat/rooms/:id/upload
   */
  app.post(
    '/upload',
    {
      schema: {
        response: { 200: UploadResponseSchema },
      },
      config: {
        // Giới hạn rate limit upload
        rateLimit: { max: 20, timeWindow: '1 minute' },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const data = await request.file({
        limits: { fileSize: MAX_FILE_SIZE },
      });

      if (!data) {
        throw AppError.badRequest('Không có file nào được gửi lên.');
      }

      // Kiểm tra MIME type
      const mimeType = data.mimetype;
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        throw AppError.badRequest(
          `Loại file không được phép. Chỉ chấp nhận: ${[...ALLOWED_MIME_TYPES].join(', ')}`
        );
      }

      // Đọc buffer và kiểm tra kích thước
      const buffer = await data.toBuffer();
      if (buffer.length > MAX_FILE_SIZE) {
        throw AppError.badRequest('File quá lớn. Kích thước tối đa là 10MB.');
      }

      // Tạo key unique: uploads/userId/uuid.ext
      const ext = path.extname(data.filename) || `.${mimeType.split('/')[1]}`;
      const key = `uploads/${request.user.id}/${crypto.randomUUID()}${ext}`;

      const url = await app.storage.upload(buffer, key, mimeType);

      await writeAuditLog(app.prisma, {
        userId: request.user.id,
        action: 'FILE_UPLOADED',
        resourceType: 'FILE',
        resourceId: key,
        details: { size: buffer.length, mimeType, key },
      });

      return reply.send({
        data: {
          url,
          key,
          size: buffer.length,
          mimeType,
        },
      });
    }
  );
};
