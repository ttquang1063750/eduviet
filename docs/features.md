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

## 4. Live Chat 🚧 (đang thiết kế/implement)
- Real-time via Socket.io
- 3 loại phòng: CLASS, TEACHER_PARENT, ONE_ON_ONE
- Floating widget (FAB góc phải màn hình)
- Tính năng: typing indicator, read receipts, sửa/xóa tin nhắn, upload file/ảnh (MinIO)
- Lưu lịch sử chat vào PostgreSQL
- Phân quyền theo role (học sinh không chat với người ngoài lớp)

## 5. Blog & Tin tức ✅
- Danh sách bài viết + chi tiết
- Comment & reply có nested threading
- Moderator có thể ẩn/xóa comment
- Phân quyền: CONTENT_CREATOR viết, CONTENT_APPROVER duyệt

## 6. Thông báo ✅ (in-app) / 🚧 (email/SMS)
- In-app notifications với unread count
- Email (Nodemailer + React Email templates) — chưa implement
- SMS (ESMS.vn) — chưa implement
- Queue bất đồng bộ với BullMQ — chưa implement

## 7. Báo cáo & Phân tích ❌ (chưa implement)
- Thống kê tiến độ học sinh
- Tỷ lệ hoàn thành bài tập
- Điểm số theo môn, theo lớp
- Export PDF/Excel

## 8. Admin UI ❌ (chưa implement)
- CRUD giao diện cho Schools, Classes management
- Content moderation dashboard
- User management với role assignment
