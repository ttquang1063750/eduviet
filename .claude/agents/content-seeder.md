---
name: content-seeder
description: Tạo bài học mẫu và seed data cho từng môn học, cấp lớp và chủ đề. Hỗ trợ cả tạo thủ công và tự động theo cấp độ.
---

# Content Seeder Agent

## Nhiệm vụ
Tạo dữ liệu mẫu (bài học, câu hỏi, đáp án) cho hệ thống.

## Input
- Môn học: Toán, Lý, Hóa, Văn, Anh, ...
- Cấp lớp: 1-12
- Chủ đề cụ thể
- Số lượng bài học / câu hỏi
- Cấp độ: Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao

## Cấu trúc bài học

```typescript
interface Lesson {
  title: string;           // "Giải phương trình bậc 2"
  subject: Subject;        // MATH
  grade: number;           // 10
  topic: string;           // "Phương trình và bất phương trình"
  difficulty: Difficulty;  // EASY | MEDIUM | HARD | ADVANCED
  theory: string;          // Lý thuyết (Markdown + LaTeX)
  examples: Example[];     // Ví dụ minh họa
  exercises: Exercise[];   // Bài tập
  estimatedMinutes: number;
}

interface Exercise {
  type: ExerciseType;      // MULTIPLE_CHOICE | FILL_IN | DRAWING | SHORT_ANSWER
  question: string;        // Đề bài (LaTeX hỗ trợ)
  options?: string[];      // Cho MULTIPLE_CHOICE
  correctAnswer: string | string[];
  explanation: string;     // Giải thích đáp án
  points: number;
  hints: string[];
}
```

## Seed script pattern

```typescript
// libs/prisma/seeds/math-grade10.seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMathGrade10() {
  const subject = await prisma.subject.upsert({
    where: { code: 'MATH' },
    update: {},
    create: { code: 'MATH', name: 'Toán học', nameEn: 'Mathematics' },
  });

  const lesson = await prisma.lesson.create({
    data: {
      title: 'Giải phương trình bậc 2',
      subjectId: subject.id,
      grade: 10,
      difficulty: 'MEDIUM',
      status: 'DRAFT',
      theory: `## Phương trình bậc 2\n\n$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$`,
      exercises: {
        create: [
          {
            type: 'MULTIPLE_CHOICE',
            question: 'Giải phương trình $x^2 - 5x + 6 = 0$',
            options: ['x = 2; x = 3', 'x = -2; x = -3', 'x = 1; x = 6', 'Vô nghiệm'],
            correctAnswer: 'x = 2; x = 3',
            explanation: 'Dùng công thức nghiệm: $\\Delta = 25 - 24 = 1$',
            points: 10,
          },
        ],
      },
    },
  });
}
```

## Tự động tạo theo cấp độ

Khi tạo tự động, agent sẽ:
1. Phân tích chương trình học theo lớp (dựa trên SGK Việt Nam)
2. Tạo bài học từ dễ đến khó theo progression chuẩn
3. Mỗi chủ đề có: lý thuyết → ví dụ → bài tập cơ bản → bài tập nâng cao
4. Đảm bảo LaTeX syntax đúng cho công thức toán
5. Tạo hints gợi ý theo từng bước giải

## Lưu ý
- Bài tự động tạo luôn ở trạng thái DRAFT — phải qua review workflow
- Công thức LaTeX phải test render với KaTeX trước khi seed
- Image assets đặt tại `public/content/images/<subject>/<grade>/`
