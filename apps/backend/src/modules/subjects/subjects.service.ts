import { PrismaClient, SubjectCode } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';

export interface CreateSubjectDto {
  code: SubjectCode;
  name: string;
  nameEn: string;
  color?: string;
  iconUrl?: string;
}

export interface UpdateSubjectDto {
  name?: string;
  nameEn?: string;
  color?: string;
  iconUrl?: string;
}

export interface SubjectSuggestion {
  name: string;
  nameEn: string;
  color: string;
  iconUrl: string;
}

export class SubjectsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    return this.prisma.subject.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateSubjectDto, actorId: string) {
    const existing = await this.prisma.subject.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new AppError(409, 'CONFLICT', `Môn học với mã ${dto.code} đã tồn tại`);
    }

    const subject = await this.prisma.subject.create({
      data: {
        code: dto.code,
        name: dto.name,
        nameEn: dto.nameEn,
        color: dto.color,
        iconUrl: dto.iconUrl,
      },
    });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'SUBJECT_CREATED',
      resourceType: 'SUBJECT',
      resourceId: subject.id,
    });

    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto, actorId: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy môn học');

    const updated = await this.prisma.subject.update({
      where: { id },
      data: dto,
    });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'SUBJECT_UPDATED',
      resourceType: 'SUBJECT',
      resourceId: id,
    });

    return updated;
  }

  async delete(id: string, actorId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: { _count: { select: { lessons: true } } },
    });
    if (!subject) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy môn học');

    if (subject._count.lessons > 0) {
      throw new AppError(
        409,
        'CONFLICT',
        `Không thể xóa môn học đang có ${subject._count.lessons} bài học. Hãy xóa bài học trước.`,
      );
    }

    await this.prisma.subject.delete({ where: { id } });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'SUBJECT_DELETED',
      resourceType: 'SUBJECT',
      resourceId: id,
    });
  }

  async suggest(code: SubjectCode): Promise<SubjectSuggestion> {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new AppError(503, 'INTERNAL_ERROR', 'AI suggest chưa được cấu hình');

    const prompt = `You are a Vietnamese education system helper. Given a subject code, suggest Vietnamese and English names, a hex color, and an emoji icon.

Subject code: ${code}

Respond with ONLY valid JSON, no explanation:
{
  "name": "<tên tiếng Việt>",
  "nameEn": "<English name>",
  "color": "<hex color like #4A90E2>",
  "iconUrl": "<single emoji>"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new AppError(502, 'INTERNAL_ERROR', 'AI suggest thất bại, thử lại sau');
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const text = data.content[0]?.text ?? '{}';

    try {
      const parsed = JSON.parse(text) as SubjectSuggestion;
      if (!parsed.name || !parsed.nameEn || !parsed.color || !parsed.iconUrl) {
        throw new Error('Incomplete response');
      }
      return parsed;
    } catch {
      throw new AppError(502, 'INTERNAL_ERROR', 'AI trả về dữ liệu không hợp lệ');
    }
  }
}
