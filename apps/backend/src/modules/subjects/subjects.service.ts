import { PrismaClient } from '@prisma/client';

export class SubjectsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: { name: 'asc' },
    });
    return subjects;
  }
}
