import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassesService } from './classes.service.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockClass = {
  id: 'class-uuid-1',
  name: '10A1',
  grade: 10,
  academicYear: '2025-2026',
  schoolId: 'school-uuid-1',
  homeroomTeacherId: 'teacher-uuid-1',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEnrollment = {
  id: 'enroll-uuid-1',
  classId: 'class-uuid-1',
  userId: 'student-uuid-1',
  enrolledAt: new Date(),
};

const mockChatRoom = {
  id: 'room-uuid-1',
  classId: 'class-uuid-1',
  type: 'CLASS',
};

const mockRepo = {
  findMany: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  isEnrolled: vi.fn(),
  addEnrollment: vi.fn(),
  removeEnrollment: vi.fn(),
};

const mockChatRepo = {
  createRoom: vi.fn(),
};

const mockPrisma = {
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
  },
  chatRoom: {
    findFirst: vi.fn(),
  },
  chatRoomMember: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClassesService', () => {
  let service: ClassesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClassesService(mockPrisma as any);
    (service as any).repo = mockRepo;
    (service as any).chatRepo = mockChatRepo;
  });

  // ── list() ──────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('trả về danh sách lớp học với meta pagination', async () => {
      mockRepo.findMany.mockResolvedValue({ classes: [mockClass], total: 1 });

      const result = await service.list({ page: 1, perPage: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  // ── getById() ────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('trả về lớp học khi tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);

      const result = await service.getById('class-uuid-1');

      expect(result).toEqual(mockClass);
    });

    it('ném 404 khi lớp học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getById('not-found'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    const createDto = {
      name: '10A1',
      grade: 10,
      academicYear: '2025-2026',
      schoolId: 'school-uuid-1',
      homeroomTeacherId: 'teacher-uuid-1',
    };

    it('tạo lớp học + ChatRoom + ghi audit log', async () => {
      mockRepo.create.mockResolvedValue(mockClass);
      mockChatRepo.createRoom.mockResolvedValue({ id: 'room-uuid-1' });

      const result = await service.create(createDto, 'admin-uuid-1');

      expect(mockRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockChatRepo.createRoom).toHaveBeenCalledOnce();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
      expect(result).toEqual(mockClass);
    });

    it('thêm homeroomTeacherId vào members của ChatRoom nếu khác actorId', async () => {
      mockRepo.create.mockResolvedValue(mockClass);
      mockChatRepo.createRoom.mockResolvedValue({ id: 'room-uuid-1' });

      await service.create(createDto, 'admin-uuid-1');

      const createRoomCall = mockChatRepo.createRoom.mock.calls[0][0] as { memberIds: string[] };
      expect(createRoomCall.memberIds).toContain('teacher-uuid-1');
      expect(createRoomCall.memberIds).toContain('admin-uuid-1');
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('cập nhật lớp học thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);
      const updated = { ...mockClass, name: '10A2' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update('class-uuid-1', { name: '10A2' }, 'admin-uuid-1');

      expect(result.name).toBe('10A2');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
    });

    it('ném 404 khi lớp học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('not-found', { name: 'X' }, 'admin-uuid-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── delete() ─────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('xóa mềm lớp học thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);

      await service.delete('class-uuid-1', 'admin-uuid-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('class-uuid-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
    });

    it('ném 404 khi lớp học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('not-found', 'admin-uuid-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── enroll() ─────────────────────────────────────────────────────────────

  describe('enroll()', () => {
    it('đăng ký học sinh vào lớp thành công và add vào ChatRoom', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);
      mockRepo.isEnrolled.mockResolvedValue(false);
      mockRepo.addEnrollment.mockResolvedValue(mockEnrollment);
      mockPrisma.chatRoom.findFirst.mockResolvedValue(mockChatRoom);
      mockPrisma.chatRoomMember.upsert.mockResolvedValue({});

      const result = await service.enroll('class-uuid-1', 'student-uuid-1', 'admin-uuid-1');

      expect(result).toEqual(mockEnrollment);
      expect(mockPrisma.chatRoomMember.upsert).toHaveBeenCalledOnce();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
    });

    it('ném 404 khi lớp học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.enroll('not-found', 'student-uuid-1', 'admin-uuid-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('ném 409 khi học sinh đã có trong lớp', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);
      mockRepo.isEnrolled.mockResolvedValue(true);

      await expect(service.enroll('class-uuid-1', 'student-uuid-1', 'admin-uuid-1'))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ── unenroll() ───────────────────────────────────────────────────────────

  describe('unenroll()', () => {
    it('xóa học sinh khỏi lớp và ChatRoom thành công', async () => {
      mockRepo.findById.mockResolvedValue(mockClass);
      mockRepo.removeEnrollment.mockResolvedValue(undefined);
      mockPrisma.chatRoom.findFirst.mockResolvedValue(mockChatRoom);
      mockPrisma.chatRoomMember.deleteMany.mockResolvedValue({});

      await service.unenroll('class-uuid-1', 'student-uuid-1', 'admin-uuid-1');

      expect(mockRepo.removeEnrollment).toHaveBeenCalledWith('class-uuid-1', 'student-uuid-1');
      expect(mockPrisma.chatRoomMember.deleteMany).toHaveBeenCalledOnce();
    });

    it('ném 404 khi lớp học không tồn tại', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.unenroll('not-found', 'student-uuid-1', 'admin-uuid-1'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
