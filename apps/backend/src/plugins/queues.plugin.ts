import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { createEmailWorker, createNotificationWorker, NotificationJobData } from '@eduviet/redis';
import { NotificationChannel } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    queues: {
      emailWorker: ReturnType<typeof createEmailWorker>;
      notificationWorker: ReturnType<typeof createNotificationWorker>;
    };
  }
}

const queuesPlugin = fp(async (app: FastifyInstance) => {
  const emailWorker = createEmailWorker();

  const notificationWorker = createNotificationWorker({
    saveNotification: async (data: NotificationJobData) => {
      await app.prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          body: data.message,
          channel: NotificationChannel.IN_APP,
          data: {
            type: data.type,
            referenceId: data.referenceId,
          } as never,
        },
      });
    },
  });

  app.decorate('queues', { emailWorker, notificationWorker });

  app.addHook('onClose', async () => {
    await emailWorker.close();
    await notificationWorker.close();
  });
});

export default queuesPlugin;
