import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service';
import { AppError } from '../../shared/errors/app-error';

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

const mockPrisma = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockPrisma as never);
  });

  // ── list() ──────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('trả về danh sách users với meta pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(42);

      const result = await service.list({ page: 1, perPage: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(42);
      expect(result.meta.totalPages).toBe(3); // ceil(42/20)
    });
  });

  // ── getById() ────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('throw NotFound khi user không tồn tại', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

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
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getById('user-uuid-1', 'user-uuid-1', 'STUDENT');
      expect(result).toEqual(mockUser);
    });

    it('SUPER_ADMIN có thể xem bất kỳ profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getById('user-uuid-1', 'admin-id', 'SUPER_ADMIN');
      expect(result).toEqual(mockUser);
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
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.update('user-uuid-1', { fullName: 'Tên mới', isActive: false }, 'user-uuid-1', 'STUDENT');

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('isActive');
      expect(updateCall.data.fullName).toBe('Tên mới');
    });

    it('SCHOOL_ADMIN có thể đổi isActive', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.update('user-uuid-1', { isActive: false }, 'admin-id', 'SCHOOL_ADMIN');

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.isActive).toBe(false);
    });

    it('ghi audit log sau update', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await service.update('user-uuid-1', { fullName: 'Tên mới' }, 'user-uuid-1', 'STUDENT');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'USER_UPDATED' }) })
      );
    });
  });
});
