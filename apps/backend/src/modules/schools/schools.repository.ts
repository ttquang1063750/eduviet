import { PrismaClient, Prisma } from '@prisma/client';

export interface SchoolFilters {
  page: number;
  perPage: number;
  districtId?: string;
  provinceId?: string;
  search?: string;
}

export class SchoolsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findProvinces() {
    return this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      include: { nation: { select: { id: true, name: true } } },
    });
  }

  async findDistricts(provinceId?: string) {
    return this.prisma.district.findMany({
      where: provinceId ? { provinceId } : undefined,
      orderBy: { name: 'asc' },
      include: { province: { select: { id: true, name: true, code: true } } },
    });
  }

  async findMany(filters: SchoolFilters) {
    const { page, perPage, districtId, provinceId, search } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.SchoolWhereInput = {
      deletedAt: null,
      ...(districtId ? { districtId } : {}),
      ...(provinceId ? { district: { provinceId } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          phone: true,
          email: true,
          district: {
            select: {
              id: true,
              name: true,
              province: { select: { id: true, name: true } },
            },
          },
          createdAt: true,
        },
        skip,
        take: perPage,
        orderBy: { name: 'asc' },
      }),
      this.prisma.school.count({ where }),
    ]);

    return { schools, total };
  }

  async findById(id: string) {
    return this.prisma.school.findUnique({
      where: { id, deletedAt: null },
      include: {
        district: {
          include: { province: { include: { nation: true } } },
        },
        _count: { select: { users: true, classes: true } },
      },
    });
  }

  async create(data: {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    districtId: string;
  }) {
    return this.prisma.school.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; address: string; phone: string; email: string }>) {
    return this.prisma.school.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.school.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
