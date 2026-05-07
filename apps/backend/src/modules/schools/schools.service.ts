import { PrismaClient } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { SchoolsRepository, SchoolFilters } from './schools.repository.js';

export class SchoolsService {
  private readonly repo: SchoolsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new SchoolsRepository(prisma);
  }

  async getProvinces() {
    return this.repo.findProvinces();
  }

  async getDistricts(provinceId?: string) {
    return this.repo.findDistricts(provinceId);
  }

  async list(filters: SchoolFilters) {
    const { schools, total } = await this.repo.findMany(filters);
    return {
      data: schools,
      meta: {
        total,
        page: filters.page,
        perPage: filters.perPage,
        totalPages: Math.ceil(total / filters.perPage),
      },
    };
  }

  async getById(id: string) {
    const school = await this.repo.findById(id);
    if (!school) throw AppError.notFound('Trường học');
    return school;
  }

  async create(
    data: { name: string; code: string; address?: string; phone?: string; email?: string; districtId: string },
    actorId: string
  ) {
    const school = await this.repo.create(data);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'USER_CREATED', // dùng tạm, sẽ thêm SCHOOL_CREATED khi mở rộng AuditAction
      resourceType: 'USER',
      resourceId: school.id,
      details: { name: school.name, code: school.code },
    });

    return school;
  }

  async update(
    id: string,
    data: Partial<{ name: string; address: string; phone: string; email: string }>,
    actorId: string
  ) {
    const school = await this.repo.findById(id);
    if (!school) throw AppError.notFound('Trường học');

    const updated = await this.repo.update(id, data);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'USER_UPDATED',
      resourceType: 'USER',
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async delete(id: string, actorId: string) {
    const school = await this.repo.findById(id);
    if (!school) throw AppError.notFound('Trường học');

    await this.repo.softDelete(id);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'USER_DELETED',
      resourceType: 'USER',
      resourceId: id,
    });
  }
}
