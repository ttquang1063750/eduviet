# Active Task: Mở rộng tính năng — 5 gợi ý từ session 15

## Mục tiêu
Triển khai 5 tính năng mở rộng theo thứ tự ưu tiên:
- **P1** — Student Dashboard (user-facing quan trọng nhất còn thiếu)
- **P2** — Upload file/ảnh trong Chat (hoàn thiện chat)
- **P3** — Read Receipts trong Chat (UX polish)
- **P4** — Browser Notification Push (khi có tin nhắn mới)
- **P5** — Test Coverage (questions, schools, classes modules)

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-12
Step hiện tại: 31 (DONE — tất cả steps hoàn thành)

---

## P1 — Student Dashboard

### Mục tiêu P1
Trang dashboard riêng cho học sinh: lịch học (danh sách lớp đang học), bài học cần làm, thống kê hoàn thành.
Route `/dashboard` hiện tại là admin stats — cần tách riêng cho STUDENT role.

### Context thiết kế P1
- Route `/dashboard` hiện có `dashboard.component` — giữ nguyên cho ADMIN/TEACHER
- Thêm route `/student` cho STUDENT role — guard bằng role
- BE: `GET /api/students/me/dashboard` — aggregate từ enrollments + lessons
- FE: 3 cards: "Lớp học của tôi", "Bài học sắp tới", "Tiến độ học tập"
- Không cần model DB mới — query từ ClassEnrollment + Lesson + LessonQuestion

### Steps P1

- [x] 1. [Types] `packages/shared-types/src/student.types.ts` — `StudentDashboard`, `StudentClass`, `StudentLesson` interfaces
- [x] 2. [BE] `modules/students/students.routes.ts` — `GET /api/students/me/dashboard` (authenticate, authorize STUDENT)
- [x] 3. [BE] `modules/students/students.service.ts` — `getMyDashboard(userId)`: lấy classes đang học + lessons active + completion count
- [x] 4. [BE] `main.ts` — register studentsRoutes tại `/api/students`
- [x] 5. [FE] `core/services/student-dashboard.service.ts` — `getMyDashboard()` API call
- [x] 6. [FE] `features/student-dashboard/student-dashboard.component.ts` — OnPush, signals, inject StudentDashboardService
- [x] 7. [FE] `features/student-dashboard/student-dashboard.component.html` — 3 section cards: Lớp học / Bài học / Tiến độ
- [x] 8. [FE] `features/student-dashboard/student-dashboard.component.scss` — layout grid, card styles
- [x] 9. [FE] `app.routes.ts` — thêm route `/student` → StudentDashboardComponent (lazy), guard STUDENT
- [x] 10. [FE] `layout/main-layout.component.html` — thêm nav "🎓 Trang của tôi" cho STUDENT role

---

## P2 — Upload file/ảnh trong Chat

### Mục tiêu P2
Cho phép gửi file/ảnh trong chat room. Route BE đã tồn tại (`POST /api/chat/rooms/:id/upload`) nhưng FE chưa có UI.

### Context thiết kế P2
- BE route `POST /api/chat/rooms/:id/upload` → MinIO → trả về `{ url }` (đã có, cần verify)
- Giới hạn: 10MB, accept image/*, application/pdf, .docx, .xlsx
- FE: nút 📎 trong message-thread → file input hidden → upload → gửi message với `attachmentUrl`
- Convention nội dung: text bình thường hoặc prefix `[FILE]:url` cho file attachment

### Steps P2

- [x] 11. [Verify] Đọc `chat.routes.ts` + `chat.service.ts` (BE) — xác nhận route upload tồn tại, đúng chuẩn MIME/size
- [x] 12. [BE] `chat.service.ts` — nếu thiếu: thêm `uploadFile(roomId, userId, file)` + MIME/size validation
- [x] 13. [FE] `features/chat/chat.service.ts` — thêm `uploadFile(roomId, file): Observable<{url: string}>`
- [x] 14. [FE] `message-thread.component.ts` — thêm `attachFile()`, `uploadProgress` signal, gọi `uploadFile()` → gửi message với URL
- [x] 15. [FE] `message-thread.component.html` — nút 📎, hidden file input, progress bar, preview ảnh trong bubble
- [x] 16. [FE] `message-thread.component.scss` — styles: attach-btn, progress-bar, image-bubble, file-bubble

---

## P3 — Read Receipts (double tick)

### Mục tiêu P3
Double tick xác nhận tin nhắn đã được đọc. Mark-as-read khi mở message thread.

### Context thiết kế P3
- BE: thêm `readBy: Json @default("[]")` vào `ChatMessage` (mảng userId)
- Migration: `20260512000001_message_read_by`
- Socket event `mark_read` (client → server) + `messages_read` (server → room broadcast)
- FE: khi mở thread → emit `mark_read(roomId)` → BE update readBy → broadcast
- UI: ✓ (sent) vs ✓✓ xanh (đã đọc)

### Steps P3

- [x] 17. [DB] `libs/prisma/schema.prisma` — thêm `readBy Json @default("[]")` vào model `ChatMessage`
- [x] 18. [DB] Migration `20260512000001_message_read_by` — `ALTER TABLE chat_messages ADD COLUMN read_by JSONB DEFAULT '[]'`
- [x] 19. [BE] `chat.repository.ts` — thêm `markMessagesRead(roomId, userId)` + `findUnreadCount(roomId, userId)`
- [x] 20. [BE] `chat.service.ts` — thêm `markAsRead(roomId, userId)` + audit log
- [x] 21. [BE] `chat.gateway.ts` — listener `mark_read` event → gọi service → emit `messages_read` tới room
- [x] 22. [Types] `packages/shared-types/src/chat.types.ts` — thêm `readBy: string[]` vào `ChatMessage` type
- [x] 23. [FE] `features/chat/chat.service.ts` — emit `mark_read` khi mở thread, listener `messages_read` update signal
- [x] 24. [FE] `message-thread.component.html` — double tick UI: ✓ (sent) / ✓✓ (read) per message bubble
- [x] 25. [FE] `message-thread.component.scss` — `.tick-sent`, `.tick-read` styles (màu primary khi read)

---

## P4 — Browser Notification Push

### Mục tiêu P4
Hiển thị browser notification khi có tin nhắn mới và tab không được focus.

### Context thiết kế P4
- Web Notification API (không cần service worker — chỉ khi app đang mở)
- Request permission lần đầu sau khi login thành công
- Listen Socket.io `new_message` (đã có) → nếu `document.hidden` → show Notification
- Click notification → focus tab + navigate đến room

### Steps P4

- [x] 26. [FE] `core/services/push-notification.service.ts` — `requestPermission()`, `showNotification(title, body, roomId)`
- [x] 27. [FE] `core/services/chat.service.ts` — inject PushNotificationService; trong `new_message` listener: gọi `showNotification` nếu `document.hidden`
- [x] 28. [FE] `core/services/auth.service.ts` — sau login thành công: gọi `pushNotificationService.requestPermission()`

---

## P5 — Test Coverage

### Mục tiêu P5
Nâng test coverage cho 3 modules chưa có tests. Target: 80% unit coverage.

### Context thiết kế P5
- Pattern AAA: Arrange → Act → Assert
- Mock ở boundary: `vi.mock('../questions/questions.repository')`, `vi.mock('../../shared/utils/audit')`
- File đặt cạnh source: `*.service.spec.ts`

### Steps P5

- [x] 29. [Test] `modules/questions/questions.service.spec.ts` — test: create, findMany (filter), generate (mock AI), RBAC throw
- [x] 30. [Test] `modules/schools/schools.service.spec.ts` — test: create, update, findById, RBAC
- [x] 31. [Test] `modules/classes/classes.service.spec.ts` — test: create, enroll student, unenroll, findBySchool

---

## Context quan trọng chung
- `user.roles` là MẢNG (multi-role) — `authorize()` dùng OR logic
- Angular: 3 file riêng, OnPush, inject(), signals, @if/@for, không any
- Backend: Route → Service → Repository → Prisma
- Không dùng alert/confirm/prompt — dùng ToastService/ConfirmService
- Audit log sau mỗi mutation nhạy cảm

## Files đã tạo/sửa
- `packages/shared-types/src/student.types.ts` — StudentDashboard, StudentClass, StudentLesson, StudentProgress
- `packages/shared-types/src/index.ts` — thêm export student.types

## Bước tiếp theo sau task này
Không còn backlog kỹ thuật — chuyển sang feature requests mới từ stakeholders.

---

## Snapshot (checkpoint 2026-05-12)
- **Đã xong: 31/31 steps** — tất cả P1–P5 hoàn thành
- Task COMPLETED: Student Dashboard + Chat Upload + Read Receipts + Push Notifications + Test Coverage
- Blog Overhaul (session 17): BlogLayout, viewCount, related posts, top-viewed sidebar, admin endpoint fix
- Docs updated: CLAUDE.md, PROGRESS.md, docs/features.md, docs/architecture.md
- **Bước tiếp theo:** `/plan-task` khi có feature mới từ stakeholders
