import { Queue } from 'bullmq';
import { redisConnection } from '../redis.config';

export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
}

export const notificationQueue = new Queue<NotificationJobData>(NOTIFICATION_QUEUE_NAME, {
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
