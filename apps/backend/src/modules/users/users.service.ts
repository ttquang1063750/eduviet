import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserRole } from '@eduviet/shared-types';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { UsersRepository, UserFilters } from './users.repository.js';

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'PROVINCE_ADMIN', 'DISTRICT_ADMIN', 'SCHOOL_ADMIN'];

export interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  phone?: string;
  schoolId?: string;
}

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

  /** Tạo user mới — chỉ SUPER_ADMIN và SCHOOL_ADMIN */
  async create(input: CreateUserInput, requesterId: string, requesterRole: UserRole) {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(requesterRole)) {
      throw AppError.forbidden();
    }

    // SCHOOL_ADMIN chỉ được tạo user trong trường của mình
    let schoolId = input.schoolId;
    if (requesterRole === 'SCHOOL_ADMIN') {
      const requester = await this.repo.findById(requesterId);
      if (!requester?.schoolId) {
        throw AppError.forbidden('Tài khoản admin chưa được gán trường');
      }
      if (schoolId && schoolId !== requester.schoolId) {
        throw AppError.forbidden('Bạn chỉ có thể tạo người dùng trong trường của mình');
      }
      schoolId = requester.schoolId;
    }

    const existingUser = await this.repo.findByEmail(input.email);
    if (existingUser) {
      throw AppError.conflict('Email này đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    try {
      const user = await this.repo.create({
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        role: input.role as Role,
        schoolId,
      });

      await writeAuditLog(this.prisma, {
        userId: requesterId,
        action: 'USER_CREATED',
        resourceType: 'USER',
        resourceId: user.id,
        details: { email: input.email, role: input.role },
      });

      return user;
    } catch (err: unknown) {
      // Prisma unique constraint violation (email đã tồn tại)
      if ((err as { code?: string }).code === 'P2002') {
        throw AppError.conflict('Email này đã được sử dụng');
      }
      throw err;
    }
  }

  /** Xoá mềm user — chỉ SUPER_ADMIN, không tự xoá chính mình */
  async delete(id: string, requesterId: string, requesterRole: UserRole) {
    if (requesterRole !== 'SUPER_ADMIN') {
      throw AppError.forbidden('Chỉ Super Admin mới có thể xoá người dùng');
    }
    if (id === requesterId) {
      throw AppError.badRequest('Bạn không thể xoá tài khoản của chính mình');
    }

    const user = await this.repo.findById(id);
    if (!user) throw AppError.notFound('Người dùng');

    await this.repo.softDelete(id);

    await writeAuditLog(this.prisma, {
      userId: requesterId,
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: id,
      details: { email: user.email, role: user.role },
    });
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

  /** Đổi role user — chỉ SUPER_ADMIN, không tự đổi của mình */
  async changeRole(
    id: string,
    newRole: UserRole,
    requesterId: string,
    requesterRole: UserRole
  ) {
    if (requesterRole !== 'SUPER_ADMIN') {
      throw AppError.forbidden('Chỉ Super Admin mới có thể thay đổi vai trò');
    }
    if (id === requesterId) {
      throw AppError.badRequest('Bạn không thể tự thay đổi vai trò của chính mình');
    }

    const user = await this.repo.findById(id);
    if (!user) throw AppError.notFound('Người dùng');

    const updatedUser = await this.repo.update(id, { role: newRole as Role });

    await writeAuditLog(this.prisma, {
      userId: requesterId,
      action: 'USER_ROLE_CHANGED',
      resourceType: 'USER',
      resourceId: id,
      details: {
        email: user.email,
        oldRole: user.role,
        newRole,
      },
    });

    return updatedUser;
  }

  /** Gán trường cho user — SUPER_ADMIN có thể gán bất kỳ, SCHOOL_ADMIN chỉ gán trường của mình */
  async assignSchool(
    id: string,
    schoolId: string | null,
    requesterId: string,
    requesterRole: UserRole
  ) {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(requesterRole)) {
      throw AppError.forbidden();
    }

    if (requesterRole === 'SCHOOL_ADMIN') {
      const requester = await this.repo.findById(requesterId);
      if (!requester?.schoolId) {
        throw AppError.forbidden('Tài khoản admin chưa được gán trường');
      }
      if (schoolId !== requester.schoolId) {
        throw AppError.forbidden('Bạn chỉ có thể gán người dùng vào trường của mình');
      }
    }

    const user = await this.repo.findById(id);
    if (!user) throw AppError.notFound('Người dùng');

    const updatedUser = await this.repo.update(id, { schoolId });

    await writeAuditLog(this.prisma, {
      userId: requesterId,
      action: 'USER_SCHOOL_ASSIGNED',
      resourceType: 'USER',
      resourceId: id,
      details: {
        email: user.email,
        schoolId,
      },
    });

    return updatedUser;
  }
}
