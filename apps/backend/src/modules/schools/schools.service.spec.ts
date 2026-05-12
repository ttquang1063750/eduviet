import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchoolsService } from './schools.service.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSchool = {
  id: 'school-uuid-1',
  name: 'Trường THPT Nguyễn Huệ',
  code: 'THPT-NH',
  address: '123 Đường ABC, TP.HCM',
  phone: '0283456789',
  email: 'contact@nguyenhue.edu.vn',
  districtId: 'district-uuid-1',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  findProvinces: vi.fn(),
  findDistricts: vi.fn(),
  findMany: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
};

const mockPrisma = {
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SchoolsService', () => {
  let service: SchoolsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SchoolsService(mockPrisma as any);
    (service as any).repo = mockRepo;
  });

  // ── list() ──────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('trả về danh sách trường học với meta pagination', async () => {
      const schools = [mockSchool];
      mockRepo.findMany.mockResolvedValue({ schools, total: 1 });

      const result = await service.list({ page: 1, perPage: 20 });

      expect(mockRepo.findMany).toHaveBeenCalledOnce();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('tính đúng totalPages khi có nhiều bản ghi', async () => {
      mockRepo.findMany.mockResolvedValue({ schools: [], total: 45 });

      const result = await service.list({ page: 1, perPage: 20 });

      expect(result.meta.totalPages).toBe(3); // ceil(45/20) = 3
    });
  });

  // ── getById() ────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('trả về trường học khi tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(mockSchool);

      const result = await service.getById('school-uuid-1');

      expect(result).toEqual(mockSchool);
    });

    it('ném 404 khi trường học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getById('not-found'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createDto = {
      name: 'Trường THPT Nguyễn Huệ',
      code: 'THPT-NH',
      districtId: 'district-uuid-1',
    };

    it('tạo trường học thành công và ghi audit log', async () => {
      mockRepo.create.mockResolvedValue(mockSchool);

      const result = await service.create(createDto, 'admin-uuid-1');

      expect(mockRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
      expect(result).toEqual(mockSchool);
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('cập nhật trường học thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockSchool);
      const updated = { ...mockSchool, name: 'Tên mới' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update('school-uuid-1', { name: 'Tên mới' }, 'admin-uuid-1');

      expect(mockRepo.update).toHaveBeenCalledWith('school-uuid-1', { name: 'Tên mới' });
      expect(result.name).toBe('Tên mới');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
    });

    it('ném 404 khi trường học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('not-found', { name: 'X' }, 'admin-uuid-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── delete() ─────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('xóa mềm trường học thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockSchool);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await service.delete('school-uuid-1', 'admin-uuid-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('school-uuid-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
    });

    it('ném 404 khi trường học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('not-found', 'admin-uuid-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── getProvinces() / getDistricts() ──────────────────────────────────────

  describe('getProvinces()', () => {
    it('gọi repo.findProvinces và trả về kết quả', async () => {
      const provinces = [{ id: 'p1', name: 'TP.HCM' }];
      mockRepo.findProvinces.mockResolvedValue(provinces);

      const result = await service.getProvinces();

      expect(result).toEqual(provinces);
    });
  });

  describe('getDistricts()', () => {
    it('gọi repo.findDistricts với provinceId', async () => {
      const districts = [{ id: 'd1', name: 'Quận 1' }];
      mockRepo.findDistricts.mockResolvedValue(districts);

      const result = await service.getDistricts('p1');

      expect(mockRepo.findDistricts).toHaveBeenCalledWith('p1');
      expect(result).toEqual(districts);
    });
  });
});
