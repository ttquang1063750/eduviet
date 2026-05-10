import { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { notificationQueue } from '@eduviet/redis';

export class NotificationsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(userId: string, onlyUnread: boolean, page: number, perPage: number) {
    const skip = (page - 1) * perPage;
    const where = { userId, ...(onlyUnread ? { isRead: false } : {}) };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage), unreadCount },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw AppError.notFound('Thông báo');
    if (notif.userId !== userId) throw AppError.forbidden();

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  }

  /** Tạo notification (gọi từ các service khác) - Đã được chuyển sang dùng BullMQ */
  async create(data: {
    userId: string;
    title: string;
    body: string;
    channel: 'IN_APP' | 'EMAIL';
    notifData?: Record<string, unknown>;
  }) {
    await notificationQueue.add('send-notification', {
      userId: data.userId,
      title: data.title,
      message: data.body,
      type: (data.notifData?.['type'] as string) || 'SYSTEM',
      referenceId: data.notifData?.['referenceId'] as string | undefined,
    });

    return { queued: true };
  }
}
