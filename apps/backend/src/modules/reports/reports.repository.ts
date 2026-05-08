import { PrismaClient, UserRole } from '@prisma/client';

export class ReportsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async countUsersByRole() {
    const counts = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
      where: {
        deletedAt: null,
      },
    });

    const result: { [key in UserRole]?: number } = {};
    for (const item of counts) {
      result[item.role] = item._count.id;
    }
    return result;
  }

  async countContent() {
    const [lessons, classes, blogPosts] = await Promise.all([
      this.prisma.lesson.count({ where: { deletedAt: null } }),
      this.prisma.class.count({ where: { deletedAt: null } }),
      this.prisma.blogPost.count({ where: { deletedAt: null } }),
    ]);

    return {
      lessons,
      classes,
      blogPosts,
    };
  }

  async getLoginActivities() {
    // Get logins for the last 7 days, grouped by day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.prisma.auditLog.groupBy({
      by: ['createdAt'],
      where: {
        action: 'USER_LOGIN',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    // This is a simplified version. A real implementation might need to handle timezones
    // and format the date properly in the database query if possible.
    const dailyLogins = result.reduce((acc, item) => {
        const date = item.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += item._count.id;
        return acc;
    }, {} as Record<string, number>);

    return dailyLogins;
  }
}
