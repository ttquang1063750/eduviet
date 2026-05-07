# Active Task: BullMQ Queues — P3

## Mục tiêu
Tạo Redis wrapper và BullMQ queues dùng chung. Tách việc gửi email/notification ra background jobs để không làm chậm request chính.

## Trạng thái: IN_PROGRESS
Bắt đầu: 2026-05-07
Step hiện tại: 1 — [BE] Tạo libs/redis/package.json + tsconfig.json

## Steps
- [ ] 1. [BE] Tạo `libs/redis/package.json` + `tsconfig.json` — Cấu trúc package mới
- [ ] 2. [BE] Tạo `libs/redis/src/redis.config.ts` — Connection options cho ioredis & BullMQ
- [ ] 3. [BE] Tạo `libs/redis/src/queues/email.queue.ts` — BullMQ Queue cho email
- [ ] 4. [BE] Tạo `libs/redis/src/workers/email.worker.ts` — BullMQ Worker xử lý gửi email (dùng nodemailer)
- [ ] 5. [BE] Tạo `libs/redis/src/queues/notification.queue.ts` — BullMQ Queue cho push notifications
- [ ] 6. [BE] Tạo `libs/redis/src/workers/notification.worker.ts` — BullMQ Worker xử lý notifications
- [ ] 7. [BE] Tạo `libs/redis/src/index.ts` — Re-export queues & workers
- [ ] 8. [BE] Cập nhật `apps/backend/package.json` — Add `@eduviet/redis` dependency
- [ ] 9. [BE] Tạo `apps/backend/src/plugins/queues.plugin.ts` — Khởi tạo workers khi start server
- [ ] 10. [BE] Kết nối `NotificationsService` — Thay việc gọi trực tiếp bằng `notificationQueue.add()`

## Context quan trọng
- BullMQ yêu cầu `maxRetriesPerRequest: null` hoặc `enableReadyCheck: false` cho connection của Worker.
- Worker nên chạy trong context của backend app hoặc một process riêng (ở đây sẽ chạy cùng backend qua plugin).
- Dùng `Nodemailer` với MailHog port 1025 cho local dev.

## Files đã tạo/sửa
- (Chưa có)

## Bước tiếp theo sau task này
→ P4: Email Templates (React Email)
