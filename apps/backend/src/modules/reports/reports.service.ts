import { PrismaClient } from '@prisma/client';
import { ReportsRepository } from './reports.repository.js';

export class ReportsService {
  private readonly repo: ReportsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new ReportsRepository(prisma);
  }

  async getSummary() {
    const [userCounts, contentCounts, loginActivities] = await Promise.all([
      this.repo.countUsersByRole(),
      this.repo.countContent(),
      this.repo.getLoginActivities(),
    ]);

    return {
      userCounts,
      contentCounts,
      loginActivities,
    };
  }
}
