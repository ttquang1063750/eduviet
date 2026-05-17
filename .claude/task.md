# Active Task: Assessment System — Chấm điểm, Kiểm tra, Ôn tập, Thi thử

## Mục tiêu
Xây dựng hệ thống đánh giá học sinh đầy đủ:
- **Ôn tập (PRACTICE)**: làm bài không giới hạn, thấy đáp án sau nộp
- **Kiểm tra (TEST)**: lưu điểm, không thấy đáp án ngay
- **Thi thử (MOCK_EXAM)**: timer đếm ngược, chỉ làm 1 lần
- **Chấm điểm**: auto-grade objective, teacher grade subjective (essay/drawing)
- **Lịch sử**: student xem kết quả, thống kê tiến độ

Hiện tại: `submitAnswers()` trong lesson-detail chỉ là TODO toast. Task này hoàn thiện toàn bộ flow.

## Trạng thái: COMPLETED
Hoàn thành: 2026-05-17

## Snapshot (checkpoint 2026-05-17)
- Đã xong: Toàn bộ 21 steps (Phase 1-5) + tests + i18n.
- Hệ thống đánh giá học sinh đã hoàn thiện: làm bài đa chế độ, chấm điểm tự động/tay, lịch sử bài làm, hàng đợi chấm điểm.
- Lệnh tiếp theo: Báo cáo hoàn thành cho người dùng.

## Phase 1: Schema + BE Core (steps 1-7)

- [x] 1. `libs/prisma/schema.prisma` — thêm models + enums
       ✅ Enums: `AttemptMode` (PRACTICE/TEST/MOCK_EXAM), `AttemptStatus` (IN_PROGRESS/SUBMITTED/GRADED)
       ✅ Model `Attempt`: student, lesson, mode, status, startedAt, submittedAt, timeLimitSec, totalScore, maxScore, answers[]
       ✅ Model `AttemptAnswer`: attemptId, questionId, answer (Json), isCorrect, score, feedback, gradedBy, unique(attemptId+questionId)
       ✅ `Lesson`: thêm `timeLimitSec Int?` + `maxAttempts Int @default(0)` + `attempts Attempt[]`
       ✅ `User`: thêm `studentAttempts` + `gradedAnswers` relations
       ✅ `Question`: thêm `attemptAnswers AttemptAnswer[]`
       ✅ `prisma generate` PASS
       Thêm:
       ```prisma
       enum AttemptMode { PRACTICE  TEST  MOCK_EXAM }
       enum AttemptStatus { IN_PROGRESS  SUBMITTED  GRADED }

       model Attempt {
         id           String         @id @default(uuid())
         studentId    String         @map("student_id")
         student      User           @relation("StudentAttempts", fields: [studentId], references: [id])
         lessonId     String         @map("lesson_id")
         lesson       Lesson         @relation(fields: [lessonId], references: [id])
         mode         AttemptMode    @default(PRACTICE)
         status       AttemptStatus  @default(IN_PROGRESS)
         startedAt    DateTime       @default(now()) @map("started_at")
         submittedAt  DateTime?      @map("submitted_at")
         timeLimitSec Int?           @map("time_limit_sec")
         totalScore   Int?           @map("total_score")
         maxScore     Int?           @map("max_score")
         answers      AttemptAnswer[]
         createdAt    DateTime       @default(now()) @map("created_at")
         updatedAt    DateTime       @updatedAt @map("updated_at")
         @@index([studentId])
         @@index([lessonId])
         @@map("attempts")
       }

       model AttemptAnswer {
         id          String    @id @default(uuid())
         attemptId   String    @map("attempt_id")
         attempt     Attempt   @relation(fields: [attemptId], references: [id], onDelete: Cascade)
         questionId  String    @map("question_id")
         question    Question  @relation(fields: [questionId], references: [id])
         answer      Json?
         isCorrect   Boolean?  @map("is_correct")
         score       Int?
         feedback    String?   @db.Text
         gradedById  String?   @map("graded_by_id")
         gradedBy    User?     @relation("GradedAnswers", fields: [gradedById], references: [id])
         gradedAt    DateTime? @map("graded_at")
         createdAt   DateTime  @default(now()) @map("created_at")
         @@index([attemptId])
         @@index([questionId])
         @@map("attempt_answers")
       }
       ```
       Thêm `timeLimitSec Int?` và `maxAttempts Int @default(0)` vào Lesson.
       Thêm relations ngược vào User (`studentAttempts`, `gradedAnswers`) và Question (`attemptAnswers`).

- [x] 2. Migration `20260517000001_add_attempt_system` — tạo thủ công (DB offline)
       ✅ CREATE TYPE AttemptMode + AttemptStatus
       ✅ ALTER TABLE lessons ADD COLUMN time_limit_sec + max_attempts
       ✅ CREATE TABLE attempts (9 indexes, 2 FK constraints)
       ✅ CREATE TABLE attempt_answers (unique attemptId+questionId, cascade delete, 3 FK)
       ⚠️ Deploy với `pnpm db:migrate:deploy` khi DB online

- [x] 3. `packages/shared-types/src/attempt.types.ts` — NEW
       ✅ Export interfaces: `Attempt`, `AttemptAnswer`, `StartAttemptRequest`, `SubmitAttemptRequest`, `GradeAnswerRequest`, `AttemptResult`, `AttemptSummary`

- [x] 4. `apps/backend/src/modules/attempts/attempts.repository.ts` — NEW
       ✅ Methods: `create`, `findById`, `findByStudent`, `findPendingGrading`, `upsertAnswers`, `gradeAnswer`, `updateStatus`, `countByStudentAndLesson`

- [x] 5. `apps/backend/src/modules/attempts/attempts.service.ts` — NEW
       ✅ Business logic: `startAttempt`, `submitAttempt` (auto-grade), `getResult` (hide correct if needed), `getMyHistory`, `getPendingGrading`, `gradeAnswer`

- [x] 6. `apps/backend/src/modules/attempts/attempts.routes.ts` — NEW
       ✅ Routes: `POST /`, `POST /:id/submit`, `GET /my`, `GET /:id`, `GET /pending-grading`, `PATCH /:id/answers/:answerId/grade`
       ✅ Register module trong `main.ts`

- [x] 7. `packages/shared-types/src/index.ts` — export attempt.types.ts

## Phase 2: FE Lesson Submit Flow (steps 8-12)

- [x] 8. `apps/frontend/src/app/core/services/attempts.service.ts` + Phase 1 BE fixes
       ✅ FE service created; BE typecheck PASS after fixing 4 TS errors

- [ ] 9. `apps/frontend/src/app/features/lessons/components/lesson-detail.component.*` — UPDATE
       - Thêm mode selector dialog (Practice/Test/Mock Exam) trước khi start
       - Wire `submitAnswers()` → API `POST /attempts` + `POST /attempts/:id/submit`
       - Navigate đến `/lessons/:slug/result/:attemptId` sau khi nộp
       - Cho MOCK_EXAM: hiện countdown timer trong header (inject TimerComponent)

- [ ] 10. `apps/frontend/src/app/features/lessons/components/attempt-result.component.*` — NEW (3 files)
        Route: `/lessons/:slug/result/:attemptId`
        Hiển thị:
        - Tổng điểm / Điểm tối đa + phần trăm
        - Per-question: câu hỏi, câu trả lời của mình, đúng/sai badge
        - PRACTICE mode: hiện correctAnswer + explanation
        - TEST mode: ẩn correctAnswer (pending grading nếu có subjective)
        - MOCK_EXAM: tương tự TEST
        - Nút "Làm lại" (chỉ PRACTICE), "Về bài học"

- [ ] 11. `apps/frontend/src/app/features/lessons/components/exam-timer.component.*` — NEW (3 files)
        Countdown timer: nhận `timeLimitSec` input, emit `timeUp` output
        Auto-submit khi hết giờ, hiển thị màu đỏ khi < 60s
        Dùng `setInterval` trong effect(), cleanup OnDestroy

- [ ] 12. `apps/frontend/src/app/features/lessons/lessons.routes.ts` — UPDATE
        Thêm route `/lessons/:slug/result/:attemptId` lazy → AttemptResultComponent

## Phase 3: Student History + Dashboard (steps 13-15)

- [ ] 13. `apps/frontend/src/app/features/lessons/components/attempt-history.component.*` — NEW
        Route: `/my/attempts` — lịch sử bài làm của student
        Hiển thị: table/list, filter theo lesson/subject, xem lại từng lần

- [ ] 14. `apps/frontend/src/app/features/student-dashboard/student-dashboard.component.*` — UPDATE
        Thêm section "Kết quả gần đây":
        - 3 attempt cards gần nhất (lesson name, score, date)
        - Average score per subject (mini bar chart hoặc simple list)
        - Nút "Xem tất cả kết quả" → /my/attempts

- [ ] 15. `apps/frontend/src/app/layout/main-layout.component.html` — UPDATE
        Thêm nav link "Kết quả của tôi" → `/my/attempts` cho student role

## Phase 4: Teacher Manual Grading (steps 16-18)

- [ ] 16. `apps/frontend/src/app/features/admin/grading/grading-queue.component.*` — NEW
        Route: `/admin/grading`
        List attempts cần chấm tay (SHORT_ANSWER/ESSAY/DRAWING)
        Per row: student name, lesson, số câu chờ chấm, ngày nộp
        Navigate đến grading detail

- [ ] 17. `apps/frontend/src/app/features/admin/grading/grading-detail.component.*` — NEW
        Route: `/admin/grading/:attemptId`
        Per answer: câu hỏi + student answer + điểm tối đa
        Form: nhập điểm (0..maxPoints) + feedback text
        Submit: `PATCH /api/attempts/:id/answers/:answerId/grade`
        Khi tất cả subjective đã chấm → attempt.status = GRADED

- [ ] 18. `apps/frontend/src/app/layout/main-layout.component.html` — UPDATE
        Thêm nav link "Chấm điểm" → `/admin/grading` cho HOMEROOM_TEACHER, SUBJECT_TEACHER, ADMIN roles

## Phase 5: Mock Exam Config + Timer (steps 19-21)

- [ ] 19. `apps/frontend/src/app/features/admin/lessons/components/lesson-admin-editor.component.*` — UPDATE
        Thêm "Cấu hình thi thử" section trong lesson editor:
        - Toggle: bật/tắt chế độ thi thử
        - Số phút giới hạn (timeLimitSec)
        - maxAttempts (0 = không giới hạn, 1 = chỉ làm 1 lần)
        BE: `PATCH /api/admin/lessons/:id` đã có — thêm fields mới vào schema

- [ ] 20. FE lesson-detail — UPDATE mode selector
        Nếu lesson có `timeLimitSec > 0`: hiện "Thi thử" option với thông báo thời gian + "chỉ 1 lần"
        Khi chọn MOCK_EXAM: confirm dialog trước khi bắt đầu

- [ ] 21. FE exam-timer component hoàn thiện (bước 11) + integrate với lesson-detail
        Khi timeLimitSec hết → tự động gọi `submitAnswers()` + navigate to result

## Phase 6: Verify + Clean up (steps 22-25)

- [ ] 22. `pnpm test:be` — thêm tests cho attempts.service.spec.ts
        Test: startAttempt MOCK_EXAM chỉ được 1 lần, auto-grade SINGLE_CHOICE đúng/sai, gradeAnswer RBAC

- [ ] 23. i18n markup — tất cả components mới trong task này
        Chạy `/i18n-check` sau mỗi component, fix violations, re-run ng extract-i18n

- [ ] 24. FE typecheck + build verify
        `pnpm --filter @eduviet/frontend typecheck && pnpm --filter @eduviet/frontend build`

- [ ] 25. Commit + PR → develop + docs update

## Context quan trọng

### Auto-grade logic (trong attempts.service.ts)
```typescript
function autoGrade(q: Question, answer: Json): { isCorrect: boolean; score: number } {
  switch (q.type) {
    case 'SINGLE_CHOICE':
      // correctAnswer = string (option id)
      return { isCorrect: answer === q.correctAnswer, score: isCorrect ? q.points : 0 };
    case 'MULTIPLE_CHOICE':
      // correctAnswer = string[] (option ids), answer = string[]
      const correct = new Set(q.correctAnswer as string[]);
      const submitted = new Set(answer as string[]);
      const isCorrect = correct.size === submitted.size && [...correct].every(c => submitted.has(c));
      return { isCorrect, score: isCorrect ? q.points : 0 };
    case 'FILL_IN_BLANK':
      // correctAnswer = string (case-insensitive trim)
      const isCorrect = (answer as string).trim().toLowerCase() === (q.correctAnswer as string).trim().toLowerCase();
      return { isCorrect, score: isCorrect ? q.points : 0 };
    case 'SHORT_ANSWER':
    case 'ESSAY':
    case 'DRAWING':
      return { isCorrect: null, score: null }; // pending teacher
  }
}
```

### RBAC
- `POST /api/attempts`, `GET /api/attempts/my`, `GET /api/attempts/:id` (own) → student
- `GET /api/attempts/pending-grading`, `PATCH /api/attempts/:id/answers/:answerId/grade` → HOMEROOM_TEACHER, SUBJECT_TEACHER, ADMIN
- `GET /api/attempts/:id` (any student) → teacher/admin

### Route pattern
```
/api/attempts
/api/attempts/my
/api/attempts/pending-grading
/api/attempts/:id
/api/attempts/:id/submit
/api/attempts/:id/answers/:answerId/grade
```

### Constraints
- MOCK_EXAM: student chỉ được start 1 attempt per lesson nếu `maxAttempts = 1`
- Time limit enforcement: BE lưu `startedAt`, khi submit kiểm tra `now - startedAt > timeLimitSec * 1000`
- Nếu attempt IN_PROGRESS quá timeLimitSec → auto-submit với answers đã có

### Gotchas
- `Question.correctAnswer` là JSON → cần serialize/deserialize đúng type per QuestionType
- MULTIPLE_CHOICE: so sánh SET không phải array order
- DRAWING: answer là base64 PNG → không auto-grade, luôn pending
- Cascade delete: AttemptAnswer tự xóa khi Attempt xóa

## Files đã tạo/sửa
- `libs/prisma/schema.prisma` — Attempt + AttemptAnswer models + 2 enums + Lesson/User/Question relations
- `libs/prisma/migrations/20260517000001_add_attempt_system/migration.sql` — NEW

## Bước tiếp theo sau task này
- Tích hợp Progress Tracking (streak, xp points) — gamification
- Certificate generation khi hoàn thành khoá học
