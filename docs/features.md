# EduViet — Các tính năng chính

## 1. Quản lý bài học (Lesson Management) ✅
- Tạo bài thủ công hoặc tự động theo cấp độ (dễ/trung bình/khó)
- Hỗ trợ nhiều loại câu hỏi: trắc nghiệm (`MULTIPLE_CHOICE`), điền vào chỗ trống (`FILL_IN_BLANK`), tự luận (`SHORT_ANSWER`, `ESSAY`), vẽ hình (`DRAWING`)
- Canvas tương tác (Konva.js) cho bài tập hình học — freehand, line, rect, ellipse, eraser, undo/redo
- LaTeX rendering cho công thức toán (KaTeX) — inline `$...$` và block `$$...$$`
- Review trước khi publish theo content workflow

## 2. Quản lý người dùng & Phân quyền ✅
- Đăng nhập theo role, chỉ hiển thị nội dung phù hợp quyền
- JWT Access Token (15 phút) + Refresh Token (7 ngày, httpOnly cookie)
- Row-Level Security trong PostgreSQL
- Audit log mọi hành động nhạy cảm

## 3. Quản lý lớp học ✅
- Quản lý học sinh, phụ huynh, giáo viên bộ môn, giáo viên chủ nhiệm
- Enroll/unenroll students
- Theo dõi danh sách lớp

## 4. Live Chat ✅ (hoàn thành 2026-05-07)
- Real-time via Socket.io v4, Redis Adapter (multi-instance)
- 3 loại phòng: CLASS, TEACHER_PARENT, ONE_ON_ONE — phân quyền theo từng loại
- Floating widget (FAB góc phải màn hình) — có mặt mọi trang
- Tính năng: typing indicator, read receipts, sửa/xóa tin nhắn, upload file/ảnh (MinIO)
- Lưu lịch sử chat vào PostgreSQL, cursor pagination
- ChatRoom CLASS tự tạo khi tạo lớp; member tự sync khi enroll/unenroll

## 5. Blog & Tin tức ✅
- Danh sách bài viết + chi tiết
- Comment & reply có nested threading
- Moderator có thể ẩn/xóa comment
- Phân quyền: CONTENT_CREATOR viết, CONTENT_APPROVER duyệt

## 6. Thông báo ✅ (in-app + email) / 🚧 (SMS)
- In-app notifications với unread count
- Email: Nodemailer + React Email templates (welcome, verify-email, reset-password) — ✅ hoàn thành
- Queue bất đồng bộ với BullMQ (email.queue + notification.queue + workers) — ✅ hoàn thành
- Email tự động khi register: welcome email + verify-email — ✅ hoàn thành
- SMS (ESMS.vn) — chưa implement

## 7. Báo cáo & Phân tích ✅ (hoàn thành 2026-05-08)
- Dashboard analytics: thống kê users, lessons, classes, blog posts
- Chart.js: biểu đồ bài học theo môn, lesson status breakdown
- `reports.service.ts` — Prisma `_count`, `_sum`, `groupBy`
- Export PDF/Excel — chưa implement

## 8. Admin UI ✅ (hoàn thành 2026-05-08)
- Users CRUD — list + search/filter + modal create + detail edit + role assignment
- Schools CRUD — list + detail edit (refactored: 3 file, OnPush, signals)
- Classes CRUD — list + detail edit (refactored: 3 file, OnPush, signals)
- Content moderation — PENDING/REVIEW lessons, approve/reject workflow (refactored: 3 file, OnPush, signals)

## 9. Bảo mật ✅ (hoàn thành 2026-05-08)
- CSRF protection — `@fastify/csrf-protection` cho cookie endpoints
- XSS defense in depth — `sanitize-html` (BE) + `DOMPurify` pipe (FE)
- `optionalAuthenticate` middleware — blog public nhưng nhận biết role
- `@fastify/csrf-protection` GET /auth/csrf-token endpoint cho FE
