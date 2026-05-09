import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service.js';
import { AppError } from '../../shared/errors/app-error.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-1',
  email: 'student@test.com',
  fullName: 'Nguyễn Văn A',
  role: 'STUDENT' as const,
  avatarUrl: null,
  isActive: true,
  isVerified: true,
  schoolId: 'school-uuid-1',
  createdAt: new Date(),
};

// Raw mapping used in QueryRaw
const mockUserRaw = {
  id: mockUser.id,
  email: mockUser.email,
  phone: '0123456789',
  full_name: mockUser.fullName,
  role: mockUser.role,
  avatar_url: mockUser.avatarUrl,
  is_active: mockUser.isActive,
  is_verified: mockUser.isVerified,
  school_id: mockUser.schoolId,
  created_at: mockUser.createdAt,
};

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockPrisma as any);
  });

  // ── list() ──────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('trả về danh sách users với meta pagination', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([mockUserRaw]) // for users
        .mockResolvedValueOnce([{ count: 42n }]); // for total count

      const result = await service.list({ page: 1, perPage: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('student@test.com');
      expect(result.meta.total).toBe(42);
      expect(result.meta.totalPages).toBe(3); // ceil(42/20)
    });
  });

  // ── getById() ────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('throw NotFound khi user không tồn tại', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await expect(service.getById('bad-id', 'req-id', 'SUPER_ADMIN')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    it('throw Forbidden khi STUDENT xem profile người khác', async () => {
      await expect(
        service.getById('other-user-id', 'my-id', 'STUDENT')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('STUDENT có thể xem profile của chính mình', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([mockUserRaw]);

      const result = await service.getById('user-uuid-1', 'user-uuid-1', 'STUDENT');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('SUPER_ADMIN có thể xem bất kỳ profile', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([mockUserRaw]);

      const result = await service.getById('user-uuid-1', 'admin-id', 'SUPER_ADMIN');
      expect(result.id).toBe(mockUser.id);
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('throw Forbidden khi STUDENT cập nhật profile người khác', async () => {
      await expect(
        service.update('other-id', { fullName: 'Mới' }, 'my-id', 'STUDENT')
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('STUDENT không thể đổi isActive', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([mockUserRaw]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await service.update('user-uuid-1', { fullName: 'Tên mới', isActive: false }, 'user-uuid-1', 'STUDENT');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it('SCHOOL_ADMIN có thể đổi isActive', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([mockUserRaw]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await service.update('user-uuid-1', { isActive: false }, 'admin-id', 'SCHOOL_ADMIN');

      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it('ghi audit log sau update', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([mockUserRaw]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await service.update('user-uuid-1', { fullName: 'Tên mới' }, 'user-uuid-1', 'STUDENT');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'USER_UPDATED' }) })
      );
    });
  });
});
