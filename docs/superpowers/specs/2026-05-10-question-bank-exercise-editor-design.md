# Question Bank & Exercise Editor — Design Spec

> Ngày: 2026-05-10  
> Trạng thái: Approved  
> Scope: Question Bank model + Admin Exercise Editor UI  
> Người dùng chính: CONTENT_CREATOR, SUBJECT_TEACHER, HOMEROOM_TEACHER, admins  

---

## 1. Mục tiêu

Thay thế model `Exercise` (1 bài học → N câu hỏi cố định) bằng hệ thống ngân hàng câu hỏi tái sử dụng. Mỗi `Question` thuộc về một môn học và có thể được gắn vào nhiều bài học. Thứ tự câu hỏi trong bài có thể cố định hoặc ngẫu nhiên theo toggle per lesson.

---

## 2. Data Model

### 2.1 Enum — QuestionType (đổi tên từ ExerciseType)

```prisma
enum QuestionType {
  SINGLE_CHOICE     // mới — chọn 1 đáp án đúng
  MULTIPLE_CHOICE   // giữ — chọn nhiều đáp án đúng
  FILL_IN_BLANK
  SHORT_ANSWER
  ESSAY
  DRAWING
}
```

### 2.2 Model — Question

```prisma
model Question {
  id            String       @id @default(uuid())
  subjectId     String       @map("subject_id")
  subject       Subject      @relation(fields: [subjectId], references: [id])
  type          QuestionType
  content       String       @db.Text        // Markdown + KaTeX
  options       Json?                        // QuestionOption[] — chỉ SINGLE/MULTIPLE_CHOICE
  correctAnswer Json         @map("correct_answer")
  // SINGLE_CHOICE:   string (option id)
  // MULTIPLE_CHOICE: string[] (option ids)
  // FILL_IN_BLANK:   string[] (mỗi phần tử = 1 đáp án cho 1 [___])
  // SHORT_ANSWER / ESSAY / DRAWING: string (đáp án mẫu / rubric)
  explanation   String?      @db.Text
  hints         Json         @default("[]")  // string[]
  points        Int          @default(10)
  difficulty    Difficulty?
  tags          String[]     @default([])
  creatorId     String       @map("creator_id")
  creator       User         @relation(fields: [creatorId], references: [id])
  lessonLinks   LessonQuestion[]
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  deletedAt     DateTime?    @map("deleted_at")

  @@index([subjectId])
  @@index([creatorId])
  @@map("questions")
}
```

`QuestionOption` shape: `{ id: string; text: string }`

### 2.3 Model — LessonQuestion (junction)

```prisma
model LessonQuestion {
  id          String   @id @default(uuid())
  lessonId    String   @map("lesson_id")
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  questionId  String   @map("question_id")
  question    Question @relation(fields: [questionId], references: [id])
  orderIndex  Int      @default(0) @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")

  @@unique([lessonId, questionId])
  @@index([lessonId])
  @@index([questionId])
  @@map("lesson_questions")
}
```

### 2.4 Lesson — thay đổi

```prisma
model Lesson {
  // Xoá:
  //   exercises Exercise[]
  // Thêm:
  lessonQuestions    LessonQuestion[]
  randomizeQuestions Boolean @default(false) @map("randomize_questions")
}
```

### 2.5 Subject — thêm relation

```prisma
model Subject {
  // Thêm:
  questions Question[]
}
```

---

## 3. Migration

File: `libs/prisma/migrations/20260510000002_question_bank/migration.sql`

Thứ tự thực hiện:
1. `CREATE TYPE "QuestionType"` với đủ 6 giá trị
2. `CREATE TABLE questions` (dùng `QuestionType`)
3. `CREATE TABLE lesson_questions`
4. Migrate data: `INSERT INTO questions SELECT FROM exercises` (map fields)
5. Migrate junction: `INSERT INTO lesson_questions (id, lesson_id, question_id, order_index) SELECT gen_random_uuid(), lesson_id, id, order_index FROM exercises`
6. `ALTER TABLE lessons ADD COLUMN randomize_questions BOOLEAN NOT NULL DEFAULT false`
7. `DROP TABLE exercises`
8. `DROP TYPE "ExerciseType"`

> Project đang ở development — không có production data cần giữ lại.

---

## 4. shared-types

File: `packages/shared-types/src/question.types.ts`

```typescript
export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'FILL_IN_BLANK'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'DRAWING';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  subjectId: string;
  type: QuestionType;
  content: string;
  options: QuestionOption[] | null;
  correctAnswer: string | string[];
  explanation: string | null;
  hints: string[];
  points: number;
  difficulty: string | null;
  tags: string[];
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

export interface CreateQuestionRequest {
  subjectId: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  explanation?: string;
  hints?: string[];
  points?: number;
  difficulty?: string;
  tags?: string[];
}

export type UpdateQuestionRequest = Partial<Omit<CreateQuestionRequest, 'subjectId' | 'type'>>;

export interface GenerateQuestionsRequest {
  keyword: string;
  subjectId: string;
  count: number;      // 1–10
  type?: QuestionType;
}
```

Export từ `packages/shared-types/src/index.ts`.

---

## 5. Backend API

### 5.1 Module — `/api/questions`

File layout:
```
modules/questions/
  questions.routes.ts
  questions.service.ts
  questions.repository.ts
```

| Method | Path | Roles | Mô tả |
|--------|------|-------|-------|
| GET | `/api/questions` | authenticate | List bank. Filter: `subjectId`, `type`, `difficulty`, `search`, `page`, `perPage` |
| POST | `/api/questions` | CONTENT_CREATOR / teachers / admins | Tạo câu hỏi mới |
| GET | `/api/questions/:id` | authenticate | Chi tiết |
| PATCH | `/api/questions/:id` | owner hoặc admin | Cập nhật |
| DELETE | `/api/questions/:id` | owner hoặc admin | Soft delete |
| POST | `/api/questions/generate` | CONTENT_CREATOR / teachers / admins | AI tạo draft (không auto-save, trả về array) |

**RBAC tạo/sửa**: `CONTENT_CREATOR`, `SUBJECT_TEACHER`, `HOMEROOM_TEACHER`, `SCHOOL_ADMIN`, `SUPER_ADMIN`

**`POST /generate`**: gọi AI (cùng pattern subjects AI suggest), prompt tiếng Việt. Trả về `CreateQuestionRequest[]` draft — client quyết định lưu câu nào.

### 5.2 Nested routes — `/api/lessons/:id/questions`

Thêm vào `lessons.routes.ts` (không tạo file riêng):

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/lessons/:id/questions` | Danh sách + question detail + orderIndex |
| POST | `/api/lessons/:id/questions` | Thêm từ bank `{ questionId }` HOẶC tạo mới `{ question: CreateQuestionRequest }` |
| DELETE | `/api/lessons/:id/questions/:questionId` | Gỡ khỏi bài (không xoá Question) |
| PATCH | `/api/lessons/:id/questions/reorder` | `{ order: string[] }` — batch update orderIndex |
| PATCH | `/api/lessons/:id/randomize` | `{ randomizeQuestions: boolean }` |

### 5.3 lessons.service.ts / lessons.repository.ts

- Cập nhật `getBySlug()` và `findBySlug()`: join `lessonQuestions` + `question` thay `exercises`
- Nếu `randomizeQuestions=true` và endpoint là student-facing: shuffle array trước khi trả về
- Ẩn `correctAnswer` trong student-facing response (giữ pattern hiện tại)

### 5.4 Audit log

```typescript
await writeAuditLog(prisma, {
  userId: actorId,
  action: 'QUESTION_CREATED' | 'QUESTION_UPDATED' | 'QUESTION_DELETED',
  resourceType: 'QUESTION',
  resourceId: question.id,
});
```

---

## 6. Frontend

### 6.1 Route mới

```typescript
// app.routes.ts — thêm vào admin lazy routes
{
  path: 'lessons/:id/exercises',
  loadComponent: () =>
    import('./features/admin/lessons/exercise-editor/exercise-editor.component')
      .then(m => m.ExerciseEditorComponent),
}
```

Thêm link "Câu hỏi" trong lesson detail admin view.

### 6.2 File structure

```
features/admin/lessons/exercise-editor/
  exercise-editor.component.ts/html/scss          ← shell, split panel
  question-form/
    question-form.component.ts/html/scss           ← right panel: form động
  question-bank-picker/
    question-bank-picker.component.ts/html/scss    ← modal chọn từ bank

core/services/
  questions.service.ts                             ← tất cả API calls
```

### 6.3 ExerciseEditorComponent (shell)

Signals:
```typescript
readonly lesson       = signal<Lesson | null>(null);
readonly lessonQs     = signal<LessonQuestion[]>([]);
readonly selectedQ    = signal<LessonQuestion | null>(null);  // null = form trống (tạo mới)
readonly showPicker   = signal(false);
readonly showGenerate = signal(false);
readonly loading      = signal(true);
readonly isSaving     = signal(false);
```

Layout (split panel 40/60):
```
┌────────────────────────────────────────────────────────┐
│  ← Quay lại bài học    [Tiêu đề lesson]                │
├──────────────────────┬─────────────────────────────────┤
│  DANH SÁCH CÂU HỎI  │  FORM / BANK PICKER             │
│  ─────────────────  │  ──────────────────────────────  │
│  🔀 Ngẫu nhiên [■]  │  (QuestionFormComponent         │
│                      │   hoặc                           │
│  1. ◉ Câu hỏi A  ⋮  │   QuestionBankPickerComponent)  │
│  2. ☑ Câu hỏi B  ⋮  │                                 │
│                      │                                  │
│  [+ Tạo mới]        │                                  │
│  [📚 Từ ngân hàng]  │                                  │
│  [✨ Tự động tạo]   │                                  │
└──────────────────────┴─────────────────────────────────┘
```

CDK `DragDropModule` cho reorder — drag handle bị disabled khi `randomizeQuestions=true`.

### 6.4 QuestionFormComponent

**Input signals**: `question: Question | null` (null = tạo mới), `subjectId: string`  
**Output**: `(saved)` emit `Question`, `(cancelled)` emit void

Form sections chung (mọi loại): `content` (textarea + KaTeX preview), `points`, `difficulty`, `tags`, `explanation`, `hints` (dynamic list)

Form sections riêng theo `type`:

| Type | Phần riêng |
|------|-----------|
| `SINGLE_CHOICE` | N options (2–6, text input) + radio chọn đáp án đúng |
| `MULTIPLE_CHOICE` | N options (add/remove) + checkbox chọn nhiều đáp án đúng |
| `FILL_IN_BLANK` | Content có `[___]` placeholder + live preview + ô nhập đáp án per blank |
| `SHORT_ANSWER` | Textarea đáp án tham khảo + ghi chú chấm điểm |
| `ESSAY` | Textarea rubric/tiêu chí chấm |
| `DRAWING` | Upload ảnh tham chiếu + textarea hướng dẫn vẽ |

### 6.5 QuestionBankPickerComponent (modal)

- Filter: search text, type select, difficulty select (`subjectId` tự lock theo lesson — read-only)
- Paginated list — multi-select checkbox
- Footer: "Thêm N câu hỏi đã chọn" → `POST /api/lessons/:id/questions` mỗi questionId

### 6.6 Auto-generate dialog (inline trong ExerciseEditorComponent)

- Input: keyword, count (1–10), type
- "Tạo" → `POST /api/questions/generate` → hiện draft list
- Mỗi draft: checkbox + content preview
- "Thêm N câu đã chọn vào bài" → `POST /api/questions` (lưu) + `POST /api/lessons/:id/questions` (gắn)

### 6.7 questions.service.ts (Angular)

```typescript
// Question bank
getBank(filter: QuestionFilter)                    // GET /api/questions
create(data: CreateQuestionRequest)                // POST /api/questions
update(id: string, data: UpdateQuestionRequest)    // PATCH /api/questions/:id
delete(id: string)                                 // DELETE /api/questions/:id
generate(req: GenerateQuestionsRequest)            // POST /api/questions/generate

// Lesson questions
getLessonQuestions(lessonId: string)               // GET /api/lessons/:id/questions
addToLesson(lessonId: string, questionId: string)  // POST /api/lessons/:id/questions
removeFromLesson(lessonId: string, questionId: string)  // DELETE /api/lessons/:id/questions/:qId
reorder(lessonId: string, order: string[])         // PATCH /api/lessons/:id/questions/reorder
setRandomize(lessonId: string, value: boolean)     // PATCH /api/lessons/:id/randomize
```

### 6.8 Angular checklist (mọi component mới)

- 3 file riêng: `.ts` + `.html` + `.scss`
- `ChangeDetectionStrategy.OnPush`
- `inject()` thay constructor injection
- Signals cho state
- `@if` / `@for` control flow (không `*ngIf` / `*ngFor`)
- Không `CommonModule`, không `any`
- Không `alert()` / `confirm()` — dùng `ToastService` / `ConfirmService`

---

## 7. Implementation Steps

| # | Layer | Mô tả |
|---|-------|-------|
| 1 | DB | `schema.prisma`: rename enum `ExerciseType` → `QuestionType` + `SINGLE_CHOICE`, xoá `Exercise`, thêm `Question` + `LessonQuestion`, cập nhật `Lesson` + `Subject` |
| 2 | DB | Migration SQL: `20260510000002_question_bank` |
| 3 | Types | `packages/shared-types/src/question.types.ts` + export từ index |
| 4 | BE | `questions.repository.ts`: CRUD + search + pagination |
| 5 | BE | `questions.service.ts`: RBAC + business logic + AI generate |
| 6 | BE | `questions.routes.ts`: standalone endpoints |
| 7 | BE | `lessons.routes.ts`: thêm nested `/questions` + `/randomize` routes |
| 8 | BE | `lessons.service.ts` + `lessons.repository.ts`: dùng `LessonQuestion` thay `Exercise` |
| 9 | FE | `questions.service.ts` (Angular) |
| 10 | FE | `exercise-editor.component`: split panel shell + drag-drop + randomize toggle |
| 11 | FE | `question-form.component`: dynamic form theo type |
| 12 | FE | `question-bank-picker.component`: modal multi-select |
| 13 | FE | Auto-generate dialog (inline trong shell) |
| 14 | FE | Route `/admin/lessons/:id/exercises` + nav link từ lesson detail |
| 15 | Verify | E2E: tạo câu hỏi → thêm vào bài → reorder → randomize toggle → student view |

---

## 8. Out of scope

- Student-facing: làm bài, chấm điểm tự động — phase sau
- Import từ Excel/CSV — phase sau
- Version history câu hỏi — phase sau
- Phân quyền sở hữu câu hỏi phức tạp (owner + admin là đủ)
