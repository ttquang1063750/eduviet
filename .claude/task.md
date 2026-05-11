# Active Task: Question Bank & Exercise Editor

## Mục tiêu
Thay thế model `Exercise` bằng hệ thống ngân hàng câu hỏi tái sử dụng per-subject.
Xây dựng admin UI split-panel để tạo và quản lý câu hỏi cho từng bài học.

Spec: `docs/superpowers/specs/2026-05-10-question-bank-exercise-editor-design.md`

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-10
Step hiện tại: 15

## Steps

- [x] 1. [DB] `libs/prisma/schema.prisma` — rename enum `ExerciseType` → `QuestionType` + thêm `SINGLE_CHOICE`; xoá model `Exercise`; thêm model `Question` + `LessonQuestion`; cập nhật `Lesson` (thêm `randomizeQuestions`, xoá `exercises`, thêm `lessonQuestions`); cập nhật `Subject` (thêm `questions`)
- [x] 2. [DB] Migration `20260510000002_question_bank` — SQL: CREATE TYPE QuestionType; CREATE TABLE questions; CREATE TABLE lesson_questions; migrate data từ exercises; ADD COLUMN randomize_questions; DROP TABLE exercises; DROP TYPE ExerciseType
- [x] 3. [Types] `packages/shared-types/src/question.types.ts` — `QuestionType`, `QuestionOption`, `Question`, `LessonQuestion`, `CreateQuestionRequest`, `UpdateQuestionRequest`, `GenerateQuestionsRequest`; export từ `index.ts`
- [x] 4. [BE] `apps/backend/src/modules/questions/questions.repository.ts` — `findMany()` (filter subjectId/type/difficulty/search/pagination), `findById()`, `create()`, `update()`, `softDelete()`
- [x] 5. [BE] `apps/backend/src/modules/questions/questions.service.ts` — RBAC checks + `create()`, `update()`, `delete()`, `list()`, `getById()`; `generate()` gọi AI (cùng pattern subjects AI suggest)
- [x] 6. [BE] `apps/backend/src/modules/questions/questions.routes.ts` — `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `POST /generate`
- [x] 7. [BE] `apps/backend/src/modules/lessons/lessons.routes.ts` — thêm nested routes: `GET /:id/questions`, `POST /:id/questions`, `DELETE /:id/questions/:questionId`, `PATCH /:id/questions/reorder`, `PATCH /:id/randomize`; thêm service methods tương ứng (inline hoặc trong LessonsService)
- [x] 8. [BE] `apps/backend/src/modules/lessons/lessons.service.ts` + `lessons.repository.ts` — cập nhật `getBySlug()` / `findBySlug()` join `lessonQuestions + question` thay `exercises`; shuffle khi `randomizeQuestions=true` (student-facing); ẩn `correctAnswer` trong student response
- [x] 9. [FE] `apps/frontend/src/app/core/services/questions.service.ts` — tất cả API calls: `getBank()`, `create()`, `update()`, `delete()`, `generate()`, `getLessonQuestions()`, `addToLesson()`, `removeFromLesson()`, `reorder()`, `setRandomize()`
- [x] 10. [FE] `exercise-editor.component.ts/html/scss` — shell split panel 40/60; signals: `lesson`, `lessonQs`, `selectedQ`, `showPicker`, `showGenerate`, `loading`, `isSaving`; load data on init; CDK DragDrop reorder (disabled khi randomize=true); randomize toggle; action buttons (Tạo mới / Từ ngân hàng / Tự động tạo)
- [x] 11. [FE] `question-form/question-form.component.ts/html/scss` — dynamic form theo `type`; sections chung: content + KaTeX preview + points + difficulty + tags + explanation + hints; sections riêng per type; Output `(saved)` + `(cancelled)`
- [x] 12. [FE] `question-bank-picker/question-bank-picker.component.ts/html/scss` — modal, filter bar (search + type + difficulty, subjectId locked), paginated list, multi-select checkbox, "Thêm N câu hỏi" button
- [x] 13. [FE] Auto-generate dialog — inline trong `exercise-editor.component`: keyword + count (1–10) + type; gọi `generate()`; hiện draft list có checkbox; "Thêm N câu đã chọn vào bài" → lưu + gắn
- [x] 14. [FE] Route + navigation — thêm `/admin/lessons/:id/exercises` vào `app.routes.ts` (lazy); thêm link "Câu hỏi" vào lesson detail admin view
- [x] 15. [Verify] Kiểm tra end-to-end: tạo câu hỏi → thêm vào bài → reorder → bật randomize → student API trả về shuffled + ẩn correctAnswer; TypeScript không lỗi

## Context quan trọng

### Schema
- `Exercise` bị xoá hoàn toàn — không còn relation nào với `Exercise`
- `QuestionType` enum 6 giá trị: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `FILL_IN_BLANK`, `SHORT_ANSWER`, `ESSAY`, `DRAWING`
- `Question.options` là `Json?` — shape: `[{id: string, text: string}]` (chỉ SINGLE/MULTIPLE_CHOICE)
- `Question.correctAnswer` là `Json` — kiểu thực tế tùy `type`:
  - SINGLE_CHOICE: `string` (option id)
  - MULTIPLE_CHOICE: `string[]` (option ids)
  - FILL_IN_BLANK: `string[]` (1 answer per blank)
  - SHORT_ANSWER / ESSAY / DRAWING: `string`
- `LessonQuestion` là junction — `UNIQUE(lessonId, questionId)`
- `Lesson.randomizeQuestions Boolean @default(false)` — shuffle ở service layer (student endpoint only)

### Migration thứ tự
1. CREATE TYPE QuestionType
2. CREATE TABLE questions (dùng QuestionType)
3. CREATE TABLE lesson_questions
4. INSERT INTO questions FROM exercises (map fields)
5. INSERT INTO lesson_questions FROM exercises (lesson_id + id as question_id)
6. ALTER TABLE lessons ADD randomize_questions
7. DROP TABLE exercises
8. DROP TYPE ExerciseType

### Backend patterns
- Route → Service → Repository (không bỏ bước)
- `writeAuditLog()` sau mỗi mutation trong service
- Roles được phép tạo/sửa question: `CONTENT_CREATOR`, `SUBJECT_TEACHER`, `HOMEROOM_TEACHER`, `SCHOOL_ADMIN`, `SUPER_ADMIN`
- `POST /generate` trả về 200 + draft array (không lưu DB, không 201)
- AI generate: cùng pattern `subjects.service.ts` — đọc file đó trước ở step 5

### Frontend patterns
- Mọi component: 3 file, OnPush, `inject()`, signals, `@if/@for`, không `CommonModule`
- `getApiErrorMessage()` trong catch blocks
- CDK DragDrop: `import { DragDropModule } from '@angular/cdk/drag-drop'`
- Shuffle disabled trong drag list khi `randomizeQuestions=true`

### Lessons update (Step 8)
- `findBySlug()` include `lessonQuestions { question }` thay `exercises`
- Student endpoint: map ra bỏ `correctAnswer`, sau đó nếu `randomizeQuestions` thì shuffle
- Admin endpoint: trả đầy đủ kể cả `correctAnswer` và `orderIndex`

## Files sẽ tạo/sửa
- `libs/prisma/schema.prisma`
- `libs/prisma/migrations/20260510000002_question_bank/migration.sql`
- `packages/shared-types/src/question.types.ts`
- `packages/shared-types/src/index.ts`
- `apps/backend/src/modules/questions/questions.repository.ts`
- `apps/backend/src/modules/questions/questions.service.ts`
- `apps/backend/src/modules/questions/questions.routes.ts`
- `apps/backend/src/modules/lessons/lessons.routes.ts`
- `apps/backend/src/modules/lessons/lessons.service.ts`
- `apps/backend/src/modules/lessons/lessons.repository.ts`
- `apps/backend/src/main.ts` (register questions routes)
- `apps/frontend/src/app/core/services/questions.service.ts`
- `apps/frontend/src/app/features/admin/lessons/exercise-editor/exercise-editor.component.ts/html/scss`
- `apps/frontend/src/app/features/admin/lessons/exercise-editor/question-form/question-form.component.ts/html/scss`
- `apps/frontend/src/app/features/admin/lessons/exercise-editor/question-bank-picker/question-bank-picker.component.ts/html/scss`
- `apps/frontend/src/app/app.routes.ts`

## Bước tiếp theo sau task này
P3 — Export reports PDF cải thiện font tiếng Việt (PDFKit + NotoSans)
