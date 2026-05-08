import { Queue } from 'bullmq';
import { redisConnection } from '../redis.config';

export const EMAIL_QUEUE_NAME = 'email-queue';

export interface EmailJobData {
  to: string;
  subject: string;
  template?: 'welcome' | 'verify-email' | 'reset-password' | string;
  context?: Record<string, any>;
  html?: string;
}

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
