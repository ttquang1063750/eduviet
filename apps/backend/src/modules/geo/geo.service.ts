import { PrismaClient } from '@prisma/client';

export class GeoService {
  constructor(private readonly prisma: PrismaClient) {}

  async getNations() {
    return this.prisma.nation.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
  }

  async getProvinces(nationId?: string) {
    return this.prisma.province.findMany({
      where: nationId ? { nationId } : undefined,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, nationId: true },
    });
  }

  async getDistricts(provinceId?: string) {
    return this.prisma.district.findMany({
      where: provinceId ? { provinceId } : undefined,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, provinceId: true },
    });
  }
}
