import { PrismaClient } from '@prisma/client';
import { UserRole } from '@eduviet/shared-types';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { UsersRepository, UserFilters } from './users.repository.js';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN'];

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  isActive?: boolean;
}

export class UsersService {
  private readonly repo: UsersRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new UsersRepository(prisma);
  }

  /** Danh sách users — chỉ admin */
  async list(filters: UserFilters) {
    const { users, total } = await this.repo.findMany(filters);
    return {
      data: users,
      meta: {
        total,
        page: filters.page,
        perPage: filters.perPage,
        totalPages: Math.ceil(total / filters.perPage),
      },
    };
  }

  /** Lấy thông tin user theo id — user chỉ xem được chính mình, admin xem được tất cả */
  async getById(id: string, requesterId: string, requesterRole: UserRole) {
    const isAdmin = ADMIN_ROLES.includes(requesterRole);
    if (!isAdmin && requesterId !== id) {
      throw AppError.forbidden('Bạn không có quyền xem thông tin này');
    }

    const user = await this.repo.findById(id);
    if (!user) throw AppError.notFound('Người dùng');

    return user;
  }

  /** Cập nhật user — user chỉ sửa được chính mình (không sửa isActive), admin sửa được tất cả */
  async update(
    id: string,
    data: UpdateUserData,
    requesterId: string,
    requesterRole: UserRole
  ) {
    const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(requesterRole);
    if (!isAdmin && requesterId !== id) {
      throw AppError.forbidden('Bạn không có quyền cập nhật thông tin này');
    }

    // Chỉ admin mới được đổi isActive
    const safeData = isAdmin
      ? data
      : { fullName: data.fullName, phone: data.phone };

    const user = await this.repo.update(id, safeData);

    await writeAuditLog(this.prisma, {
      userId: requesterId,
      action: 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: id,
      details: {
        updatedFields: Object.keys(safeData).filter(
          (k) => safeData[k as keyof typeof safeData] !== undefined
        ),
      },
    });

    return user;
  }
}
