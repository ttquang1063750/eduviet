import { z } from 'zod';

export const getMessagesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().datetime().optional(),
});

export const createOneOnOneSchema = z.object({
  recipientId: z.string().uuid(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type GetMessagesQuery = z.infer<typeof getMessagesSchema>;
export type CreateOneOnOneBody = z.infer<typeof createOneOnOneSchema>;
export type EditMessageBody = z.infer<typeof editMessageSchema>;
