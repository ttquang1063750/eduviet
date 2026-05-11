import { PrismaClient } from '@prisma/client';
import { UserRole } from '@eduviet/shared-types';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { QuestionsRepository, QuestionFilters } from './questions.repository.js';

const ALLOWED_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'CONTENT_CREATOR',
  'SUBJECT_TEACHER',
  'HOMEROOM_TEACHER',
];

interface CreateQuestionDto {
  subjectId: string;
  type: string;
  content: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer: string | string[];
  explanation?: string;
  hints?: string[];
  points?: number;
  difficulty?: string;
  tags?: string[];
}

interface UpdateQuestionDto {
  content?: string;
  options?: Array<{ id: string; text: string }> | null;
  correctAnswer?: string | string[];
  explanation?: string;
  hints?: string[];
  points?: number;
  difficulty?: string;
  tags?: string[];
}

interface GenerateQuestionsDto {
  keyword: string;
  subjectId: string;
  count: number;
  type?: string;
}

interface GeneratedQuestion {
  type: string;
  content: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer: string | string[];
  explanation: string;
  hints: string[];
  points: number;
  difficulty: string;
  tags: string[];
}

export class QuestionsService {
  private readonly repo: QuestionsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new QuestionsRepository(prisma);
  }

  async list(
    query: Omit<QuestionFilters, 'page' | 'perPage'> & { page?: number; perPage?: number },
    userRoles?: UserRole[],
  ) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.perPage ?? 20, 100);

    const isAllowed = userRoles?.some((r) => ALLOWED_ROLES.includes(r));
    if (!isAllowed) {
      throw AppError.forbidden('Bạn không có quyền xem ngân hàng câu hỏi');
    }

    const { questions, total } = await this.repo.findMany({ ...query, page, perPage });

    return {
      data: questions,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getById(id: string, userRoles?: UserRole[]) {
    const isAllowed = userRoles?.some((r) => ALLOWED_ROLES.includes(r));
    if (!isAllowed) {
      throw AppError.forbidden('Bạn không có quyền xem câu hỏi này');
    }

    const question = await this.repo.findById(id);
    if (!question) throw AppError.notFound('Câu hỏi');

    return question;
  }

  async create(dto: CreateQuestionDto, creatorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ALLOWED_ROLES.includes(r));
    if (!isAllowed) {
      throw AppError.forbidden('Bạn không có quyền tạo câu hỏi');
    }

    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw AppError.notFound('Môn học');

    const question = await this.repo.create({
      subjectId: dto.subjectId,
      type: dto.type,
      content: dto.content,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      explanation: dto.explanation,
      hints: dto.hints,
      points: dto.points,
      difficulty: dto.difficulty,
      tags: dto.tags,
      creatorId,
    });

    await writeAuditLog(this.prisma, {
      userId: creatorId,
      action: 'QUESTION_CREATED',
      resourceType: 'QUESTION',
      resourceId: String(question['id'] ?? ''),
    });

    return question;
  }

  async update(id: string, dto: UpdateQuestionDto, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ALLOWED_ROLES.includes(r));
    if (!isAllowed) {
      throw AppError.forbidden('Bạn không có quyền chỉnh sửa câu hỏi');
    }

    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Câu hỏi');

    const question = await this.repo.update(id, {
      content: dto.content,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      explanation: dto.explanation,
      hints: dto.hints,
      points: dto.points,
      difficulty: dto.difficulty,
      tags: dto.tags,
    });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'QUESTION_UPDATED',
      resourceType: 'QUESTION',
      resourceId: id,
    });

    return question;
  }

  async delete(id: string, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ALLOWED_ROLES.includes(r));
    if (!isAllowed) {
      throw AppError.forbidden('Bạn không có quyền xóa câu hỏi');
    }

    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Câu hỏi');

    await this.repo.softDelete(id);

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'QUESTION_DELETED',
      resourceType: 'QUESTION',
      resourceId: id,
    });
  }

  async generate(dto: GenerateQuestionsDto, actorId: string, userRoles: UserRole[]) {
    const isAllowed = userRoles.some((r) => ALLOWED_ROLES.includes(r));
    if (!isAllowed) {
      throw AppError.forbidden('Bạn không có quyền tạo câu hỏi tự động');
    }

    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new AppError(503, 'INTERNAL_ERROR', 'AI generate chưa được cấu hình');

    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject) throw AppError.notFound('Môn học');

    const typeInstruction = dto.type ? `All questions must be of type: ${dto.type}.` : 'Mix question types as appropriate.';

    const prompt = `You are a Vietnamese education content creator. Generate ${dto.count} high-quality exam questions for Vietnamese high school students.

Subject: ${subject.name} (${subject.nameEn})
Topic keyword: ${dto.keyword}
Number of questions: ${dto.count}
${typeInstruction}

Available question types: SINGLE_CHOICE, MULTIPLE_CHOICE, FILL_IN_BLANK, SHORT_ANSWER, ESSAY, DRAWING

Rules:
- SINGLE_CHOICE / MULTIPLE_CHOICE: must include "options" array with 4 items, each with "id" (a/b/c/d) and "text"
- SINGLE_CHOICE correctAnswer: single option id string
- MULTIPLE_CHOICE correctAnswer: array of option id strings
- FILL_IN_BLANK: content uses ___ for blanks, correctAnswer is array of strings (one per blank)
- SHORT_ANSWER / ESSAY / DRAWING: correctAnswer is a string describing expected answer
- Write questions in Vietnamese
- difficulty must be one of: EASY, MEDIUM, HARD, ADVANCED
- Include relevant tags in Vietnamese

Respond with ONLY a valid JSON array, no explanation:
[
  {
    "type": "SINGLE_CHOICE",
    "content": "...",
    "options": [{"id": "a", "text": "..."}, {"id": "b", "text": "..."}, {"id": "c", "text": "..."}, {"id": "d", "text": "..."}],
    "correctAnswer": "a",
    "explanation": "...",
    "hints": ["..."],
    "points": 10,
    "difficulty": "MEDIUM",
    "tags": ["..."]
  }
]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new AppError(502, 'INTERNAL_ERROR', 'AI generate thất bại, thử lại sau');
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const text = data.content[0]?.text ?? '[]';

    try {
      const parsed = JSON.parse(text) as GeneratedQuestion[];
      if (!Array.isArray(parsed)) throw new Error('Expected array');
      return parsed.slice(0, dto.count);
    } catch {
      throw new AppError(502, 'INTERNAL_ERROR', 'AI trả về dữ liệu không hợp lệ');
    }
  }
}
