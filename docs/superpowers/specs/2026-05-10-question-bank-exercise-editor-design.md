# EduViet — Question Bank & Exercise Editor

**Ngày:** 2026-05-10
**Scope:** Admin UI nhập liệu câu hỏi/đáp án + ngân hàng câu hỏi per-subject
**Người dùng chính:** CONTENT_CREATOR, SUPER_ADMIN

---

## 1. Mục tiêu

Xây dựng hệ thống cho phép CONTENT_CREATOR:
1. Tạo và quản lý **ngân hàng câu hỏi** scoped theo môn học (`Subject`)
2. Gắn câu hỏi từ ngân hàng (hoặc tạo mới) vào từng bài học (`Lesson`)
3. Cấu hình bài học **hiển thị câu hỏi ngẫu nhiên** hoặc theo thứ tự cố định

---

## 2. Schema thay đổi

### 2.1 Xoá model cũ

Model `Exercise` hiện tại bị **xoá hoàn toàn** và thay bằng `Question` + `LessonQuestion`.
Project đang ở giai đoạn development, chưa có production data.

### 2.2 Enum mới

```prisma
enum ExerciseType {
  SINGLE_CHOICE    // thêm mới — chọn 1 đáp án đúng
  MULTIPLE_CHOICE  // giữ nguyên — chọn nhiều đáp án đúng
  FILL_IN_BLANK
  SHORT_ANSWER
  ESSAY
  DRAWING
}
```

### 2.3 Model Question (ngân hàng câu hỏi)

```prisma
model Question {
  id            String       @id @default(uuid())
  subjectId     String       @map("subject_id")
  subject       Subject      @relation(fields: [subjectId], references: [id])
  type          ExerciseType
  question      String       @db.Text
  options       Json?        // array string[] — chỉ SINGLE_CHOICE / MULTIPLE_CHOICE
  correctAnswer Json         @map("correct_answer")
  // SINGLE_CHOICE: string (index)
  // MULTIPLE_CHOICE: string[] (indices)
  // FILL_IN_BLANK: string[] (mỗi phần tử ứng 1 [___])
  // SHORT_ANSWER / ESSAY / DRAWING: string (đáp án mẫu, chấm tay)
  explanation   String       @db.Text
  hints         Json         @default("[]")  // string[]
  points        Int          @default(10)
  creatorId     String       @map("creator_id")
  creator       User         @relation(fields: [creatorId], references: [id])
  lessons       LessonQuestion[]
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  deletedAt     DateTime?    @map("deleted_at")

  @@index([subjectId])
  @@index([creatorId])
  @@map("questions")
}
```

### 2.4 Model LessonQuestion (junction table)

```prisma
model LessonQuestion {
  id         String   @id @default(uuid())
  lessonId   String   @map("lesson_id")
  lesson     Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  questionId String   @map("question_id")
  question   Question @relation(fields: [questionId], references: [id])
  orderIndex Int      @default(0) @map("order_index")
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([lessonId, questionId])
  @@index([lessonId])
  @@index([questionId])
  @@map("lesson_questions")
}
```

### 2.5 Lesson — field mới

```prisma
model Lesson {
  // ... fields hiện tại ...
  randomizeQuestions Boolean @default(true) @map("randomize_questions")
  questions          LessonQuestion[]
  // Xoá: exercises Exercise[]
}
```

---

## 3. Backend

### 3.1 Migration

Tên migration: `replace_exercise_with_question_bank`

Steps:
1. Drop `exercises` table
2. Add `SINGLE_CHOICE` to `ExerciseType` enum
3. Create `questions` table
4. Create `lesson_questions` table
5. Add `randomize_questions` column to `lessons`

### 3.2 Module: questions

**File structure:**
```
modules/questions/
  questions.routes.ts
  questions.service.ts
  questions.repository.ts
  questions.schema.ts   (Zod schemas)
```

**Endpoints:** prefix `/api/questions`

| Method | Path | Roles | Mô tả |
|--------|------|-------|-------|
| `GET` | `/` | CONTENT_CREATOR+ | List với filter: `subjectId`, `type`, `q` (search text), pagination |
| `POST` | `/` | CONTENT_CREATOR+ | Tạo câu hỏi mới |
| `PUT` | `/:id` | CONTENT_CREATOR+ | Cập nhật (chỉ creator hoặc SUPER_ADMIN) |
| `DELETE` | `/:id` | CONTENT_CREATOR+ | Soft delete |

**Zod validation — discriminated union theo `type`:**
```typescript
const BaseQuestionSchema = z.object({
  subjectId: z.string().uuid(),
  question: z.string().min(5),
  explanation: z.string().min(1),
  hints: z.array(z.string()).default([]),
  points: z.number().int().positive().default(10),
});

const ChoiceQuestionSchema = BaseQuestionSchema.extend({
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE']),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
});

const TextQuestionSchema = BaseQuestionSchema.extend({
  type: z.enum(['FILL_IN_BLANK', 'SHORT_ANSWER', 'ESSAY', 'DRAWING']),
  options: z.undefined(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
});

const CreateQuestionSchema = z.discriminatedUnion('type', [
  ChoiceQuestionSchema,
  TextQuestionSchema,
]);
```

### 3.3 Module: lesson questions

**Thêm vào `lessons.routes.ts`**, sub-prefix `/:lessonId/questions`

| Method | Path | Mô tả |
|--------|------|-------|
| `GET` | `/:lessonId/questions` | Danh sách câu hỏi của lesson (join Question data) |
| `POST` | `/:lessonId/questions` | Thêm question vào lesson: `{ questionId }` hoặc `{ question: CreateQuestionPayload }` (tạo mới + link) |
| `DELETE` | `/:lessonId/questions/:questionId` | Gỡ khỏi lesson (không xoá Question) |
| `PATCH` | `/:lessonId/questions/reorder` | `[{ id: LessonQuestionId, orderIndex: number }]` |
| `PATCH` | `/:lessonId/settings` | `{ randomizeQuestions: boolean }` |

### 3.4 Audit log

```typescript
// Sau mỗi mutation trong questions.service.ts:
await writeAuditLog(prisma, {
  userId: actorId,
  action: 'QUESTION_CREATED' | 'QUESTION_UPDATED' | 'QUESTION_DELETED',
  resourceType: 'QUESTION',
  resourceId: question.id,
});
```

---

## 4. Frontend

### 4.1 Routes mới

```typescript
// Thêm vào /admin lazy routes
{
  path: 'lessons/:id/exercises',
  loadComponent: () => import('./features/admin/exercises/exercise-editor.component')
    .then(m => m.ExerciseEditorComponent),
},
{
  path: 'questions',
  loadComponent: () => import('./features/admin/questions/question-bank.component')
    .then(m => m.QuestionBankComponent),
},
```

### 4.2 File structure

```
features/admin/exercises/
  exercise-editor.component.ts/html/scss       (shell, split panel)
  exercise-editor-state.service.ts             (signal state)
  lesson-question-list-panel.component.ts/html/scss  (panel trái)
  exercise-form-panel.component.ts/html/scss   (panel phải — form)
  question-bank-picker.component.ts/html/scss  (panel phải — picker)

features/admin/questions/
  question-bank.component.ts/html/scss         (trang CRUD độc lập)
  question-form.component.ts/html/scss         (form dùng chung)

core/services/
  questions.service.ts                         (API calls)
```

### 4.3 ExerciseEditorStateService

```typescript
@Injectable()
export class ExerciseEditorStateService {
  readonly lessonId = signal<string>('');
  readonly randomize = signal<boolean>(true);
  readonly lessonQuestions = signal<LessonQuestion[]>([]);
  readonly activePanel = signal<'form' | 'bank-picker' | null>(null);
  readonly editingQuestion = signal<Question | null>(null);   // null = tạo mới
}
```

### 4.4 Layout panel chia đôi

```
┌─────────────────────────────────────────────────────────┐
│  ← Quay lại bài học    [Tiêu đề lesson]                  │
├──────────────────────┬──────────────────────────────────┤
│  DANH SÁCH CÂU HỎI  │  FORM NHẬP LIỆU / BANK PICKER    │
│  ─────────────────  │  ────────────────────────────────  │
│  🔀 Ngẫu nhiên [ON] │  [Chọn loại câu hỏi]             │
│                      │                                   │
│  1. ◉ Câu hỏi A  ⋮  │  (form theo loại)                │
│  2. ☑ Câu hỏi B  ⋮  │                                   │
│  3. ✏️ Câu hỏi C  ⋮  │                                   │
│                      │                                   │
│  [+ Tạo câu hỏi mới] │                                   │
│  [📚 Từ ngân hàng]   │                                   │
└──────────────────────┴──────────────────────────────────┘
```

Panel trái: `width: 35%`, CDK `DragDropModule` cho reorder.
Panel phải: `width: 65%`, hiển thị form hoặc bank picker tuỳ `activePanel`.

### 4.5 Form nhập liệu — theo từng loại

**SINGLE_CHOICE / MULTIPLE_CHOICE:**
- Textarea câu hỏi (hỗ trợ KaTeX preview)
- Dynamic list options: `signal<string[]>(['', ''])`, thêm/xoá tối đa 6
- SINGLE_CHOICE: `<mat-radio-group>` đánh dấu đáp án đúng
- MULTIPLE_CHOICE: `<mat-checkbox>` cho mỗi option
- `correctAnswer` lưu: SINGLE_CHOICE → index string, MULTIPLE_CHOICE → string[]

**FILL_IN_BLANK:**
- Textarea câu hỏi — hướng dẫn: dùng `[___]` cho chỗ trống
- Live preview hiển thị câu với ô input thật
- `correctAnswer`: auto-detect số `[___]` → sinh tương ứng số ô nhập đáp án đúng

**SHORT_ANSWER / ESSAY:**
- Textarea câu hỏi
- Textarea đáp án mẫu (label: "Đáp án tham khảo — dùng để chấm tay")

**DRAWING:**
- Textarea câu hỏi
- Textarea mô tả kết quả mong muốn
- Konva canvas nhỏ để preview (tái dụng `DrawingCanvasComponent`)

**Shared fields (mọi loại):**
- Hints: danh sách có thể thêm/xoá từng dòng
- Điểm: `<input type="number">` mặc định 10
- Giải thích: textarea

### 4.6 Question Bank Picker

Hiển thị trong panel phải khi bấm "📚 Từ ngân hàng":
- Filter: `subjectId` (auto-fill từ lesson, read-only), dropdown `type`, ô search `q`
- Danh sách câu hỏi: checkbox chọn nhiều
- Nút "Thêm X câu hỏi vào bài học" → `POST /:lessonId/questions` batch

### 4.7 Checklist Angular

Mọi component mới phải đảm bảo:
- 3 file: `.ts` + `.html` + `.scss`
- `ChangeDetectionStrategy.OnPush`
- `inject()` thay constructor
- Signals cho state
- `@if` / `@for` control flow
- Không `any`, không `CommonModule`
- Không `alert()` / `confirm()` — dùng `ToastService` / `ConfirmService`

---

## 5. Shared Types

Thêm vào `packages/shared-types/src/`:

```typescript
// question.types.ts
export type ExerciseType =
  | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  | 'FILL_IN_BLANK' | 'SHORT_ANSWER'
  | 'ESSAY' | 'DRAWING';

export interface Question {
  id: string;
  subjectId: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  hints: string[];
  points: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonQuestion {
  id: string;
  lessonId: string;
  questionId: string;
  question: Question;
  orderIndex: number;
}
```

---

## 6. Thứ tự implement (micro-steps)

1. `[DB]` Prisma schema — xoá Exercise, thêm Question + LessonQuestion + randomizeQuestions + SINGLE_CHOICE enum
2. `[DB]` Migration: `replace_exercise_with_question_bank`
3. `[BE]` `shared-types` — thêm `question.types.ts`
4. `[BE]` `questions.routes.ts` + `questions.schema.ts` (Zod)
5. `[BE]` `questions.repository.ts`
6. `[BE]` `questions.service.ts`
7. `[BE]` Lesson routes — thêm sub-routes `/:lessonId/questions` + `/settings`
8. `[FE]` `questions.service.ts` (Angular)
9. `[FE]` `exercise-editor-state.service.ts`
10. `[FE]` `lesson-question-list-panel` component
11. `[FE]` `exercise-form-panel` component (form + type selector)
12. `[FE]` `question-bank-picker` component
13. `[FE]` `exercise-editor` shell component + routes
14. `[FE]` `question-bank` admin page (CRUD độc lập)
15. `[FE]` Sidebar link + cập nhật lesson-detail để dùng `LessonQuestion` thay `Exercise`
