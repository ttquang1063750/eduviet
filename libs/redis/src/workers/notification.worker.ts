import { Worker, Job } from 'bullmq';
import { NOTIFICATION_QUEUE_NAME, NotificationJobData } from '../queues/notification.queue';
import { redisConnection } from '../redis.config';

export interface NotificationDependencies {
  saveNotification: (data: NotificationJobData) => Promise<void>;
}

export const createNotificationWorker = (deps: NotificationDependencies) => {
  return new Worker<NotificationJobData>(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job<NotificationJobData>) => {
      await deps.saveNotification(job.data);
      console.log(`Notification processed for user ${job.data.userId}: ${job.data.title}`);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );
};
