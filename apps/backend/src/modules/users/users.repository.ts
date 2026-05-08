import { PrismaClient, Prisma, Role } from '@prisma/client';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role: Role;
  schoolId?: string;
}

export interface UserFilters {
  page: number;
  perPage: number;
  role?: string;
  search?: string;
}

const PUBLIC_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  isVerified: true,
  schoolId: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const DETAIL_SELECT = {
  ...PUBLIC_SELECT,
  phone: true,
  school: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: UserFilters) {
    const { page, perPage, role, search } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role: role as never } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: PUBLIC_SELECT,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: DETAIL_SELECT,
    });
  }

  async create(data: CreateUserData) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        schoolId: data.schoolId,
      },
      select: PUBLIC_SELECT,
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data,
      select: PUBLIC_SELECT,
    });
  }
}
