# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-07
> Workflow: `/plan-task` → `/execute-step` (lặp) → `/check-point` → `/resume` → tiếp tục

---

## ✅ Đã hoàn thành

### Infrastructure & Shared

| File/Folder | Mô tả |
|-------------|-------|
| `docker-compose.yml` | Local dev: postgres, redis, minio, mailhog |
| `docker-compose.prod.yml` | Production: 2 API replicas, rolling update, resource limits |
| `docker/nginx/nginx.prod.conf` | SSL TLS 1.2/1.3, rate limit zones, SPA fallback |
| `docker/nginx/nginx.dev.conf` | Local dev proxy |
| `docker/minio/init-buckets.sh` | Tạo bucket + public-read `/public/` prefix |
| `docker/postgres/init.sql` | Khởi tạo DB |
| `dev-start.sh` | One-command dev setup |
| `libs/prisma/schema.prisma` | Full schema: User, Class, Lesson, Exercise, Blog, Chat*, Notification, AuditLog |
| `libs/prisma/migrations/` | Initial migration |
| `libs/prisma/src/seed.ts` | Seed data mẫu |
| `packages/shared-types/src/` | lesson.types.ts, user.types.ts, auth.types.ts, common.types.ts |
| `packages/shared-constants/src/` | roles.ts, content.ts, pagination.ts |
| `libs/redis/` | Redis (ioredis) wrapper, BullMQ queues (email, notification) |

### Backend (`apps/backend/src/`)

| File | Mô tả |
|------|-------|
| `main.ts` | Fastify bootstrap, đăng ký tất cả modules |
| `plugins/prisma.plugin.ts` | Prisma client plugin |
| `plugins/redis.plugin.ts` | Redis (ioredis) plugin |
| `shared/middleware/authenticate.ts` | JWT verify + type augmentation |
| `shared/middleware/authorize.ts` | RBAC middleware |
| `shared/errors/app-error.ts` | AppError class |
| `shared/utils/audit.ts` | writeAuditLog() helper |
| `modules/auth/` | routes + service + schema (login, register, refresh, logout) |
| `modules/users/` | routes + service + repository + **spec** |
| `modules/lessons/` | routes + service + repository + **spec** |
| `modules/subjects/` | routes + service |
| `modules/schools/` | routes + service + repository |
| `modules/classes/` | routes + service + repository |
| `modules/blog/` | routes + service + repository |
| `modules/notifications/` | routes + service (sử dụng BullMQ queue) |
| `modules/chat/` | routes + service + repository + gateway + spec |
| `plugins/socket.plugin.ts` | Socket.io v4, JWT auth, Redis adapter |
| `libs/storage/` | StorageService: upload, getPresignedUrl, delete, getPublicUrl |
| `plugins/storage.plugin.ts` | fastify.decorate storage, ensureBucket on startup |
| `modules/storage/storage.routes.ts` | POST /api/storage/upload — MIME whitelist, 10MB limit, audit log |
| `plugins/queues.plugin.ts` | BullMQ workers setup (email, notifications) |

### Frontend (`apps/frontend/src/app/`)

| File/Folder | Mô tả |
|-------------|-------|
| `app.config.ts` | zoneless, provideMarkdown(SecurityContext.NONE), markedKatex |
| `app.routes.ts` | Lazy routes cho tất cả features |
| `core/services/auth.service.ts` | — |
| `core/services/lessons.service.ts` | — |
| `core/services/classes.service.ts` | — |
| `core/services/blog.service.ts` | — |
| `core/guards/auth.guard.ts` | — |
| `core/interceptors/auth.interceptor.ts` | — |
| `layout/main-layout.component.*` | Shell layout |
| `shared/components/breadcrumb/` | Dynamic breadcrumb |
| `shared/components/drawing-canvas/` | Konva.js: freehand/line/rect/ellipse/eraser/undo/redo/export |
| `features/auth/` | login, register |
| `features/dashboard/` | Stats cards |
| `features/lessons/` | list + detail (KaTeX + Konva DRAWING type) |
| `features/classes/` | list + detail |
| `features/blog/` | list + detail + nested comments |
| `features/admin/users/` | user list + role badges |
| `features/chat/` | ChatService (signals), chat-widget FAB, room-list, message-thread |

### Docs & .claude

| File | Mô tả |
|------|-------|
| `docs/tech-stack.md` | — |
| `docs/architecture.md` | — |
| `docs/coding-standards.md` | — |
| `docs/rbac.md` | — |
| `docs/features.md` | — |
| `docs/dev-setup.md` | — |
| `docs/security.md` | — |
| `docs/api-conventions.md` | — |
| `.claude/rules.md` | Coding rules bất biến |
| `.claude/task.md` | Active task state |
| `.claude/commands/plan-task.md` | Slash command: lên kế hoạch task |
| `.claude/commands/execute-step.md` | Slash command: thực thi 1 step |
| `.claude/commands/check-point.md` | Slash command: lưu tiến độ |
| `.claude/commands/resume.md` | Slash command: load lại context |
| `.claude/commands/sync-progress.md` | Slash command: sync docs |

---

## 🚧 Backlog (theo độ ưu tiên)

### ~~P1 — Live Chat~~ ✅ COMPLETED

> Design đã duyệt. Prisma schema đã có (ChatRoom, ChatRoomMember, ChatMessage). socket.io v4 đã có trong backend package.json.

**Backend** (8 steps):

| # | Step | File | Ghi chú |
|---|------|------|---------|
| B1 | Thêm `@socket.io/redis-adapter` vào backend | `apps/backend/package.json` | Cần trước B2 |
| B2 | Tạo `socket.plugin.ts` | `apps/backend/src/plugins/socket.plugin.ts` | Attach IO vào fastify.server, JWT auth middleware, Redis adapter |
| B3 | Tạo `chat.repository.ts` | `apps/backend/src/modules/chat/chat.repository.ts` | Prisma: getRoom, getRooms(userId), getMessages(roomId, cursor), createMessage, editMessage, softDeleteMessage, markRead, createRoom |
| B4 | Tạo `chat.service.ts` | `apps/backend/src/modules/chat/chat.service.ts` | RBAC per room type: CLASS/TEACHER_PARENT/ONE_ON_ONE, writeAuditLog |
| B5 | Tạo `chat.gateway.ts` | `apps/backend/src/modules/chat/chat.gateway.ts` | Events: join_rooms, send_message, typing_start/stop, mark_read, edit_message, delete_message |
| B6 | Tạo `chat.routes.ts` | `apps/backend/src/modules/chat/chat.routes.ts` | REST: GET /rooms, GET /rooms/:id/messages, POST /rooms, POST /rooms/:id/upload, PATCH/DELETE /messages/:id |
| B7 | Đăng ký socket + chat vào main.ts | `apps/backend/src/main.ts` | socketPlugin + chatRoutes |
| B8 | Auto-create CLASS ChatRoom khi tạo lớp | `apps/backend/src/modules/classes/classes.service.ts` | Thêm logic tạo ChatRoom sau khi tạo Class |

**Frontend** (7 steps):

| # | Step | File | Ghi chú |
|---|------|------|---------|
| F1 | Thêm `socket.io-client` + chat types | `apps/frontend/package.json` + `packages/shared-types/src/chat.types.ts` | Interface: ChatRoom, ChatMessage, ChatRoomType |
| F2 | Tạo `chat.service.ts` | `apps/frontend/src/app/features/chat/chat.service.ts` | socket.io-client wrapper, signals: rooms, activeRoom, messages, typingUsers, totalUnread |
| F3 | Tạo `chat-widget.component.*` | `apps/frontend/src/app/features/chat/chat-widget/chat-widget.component.{ts,html,scss}` | FAB button + popup container, badge unread |
| F4 | Tạo `room-list.component.*` | `apps/frontend/src/app/features/chat/chat-widget/room-list/room-list.component.{ts,html,scss}` | Danh sách rooms + tabs (Tất cả/Lớp học/1-1) |
| F5 | Tạo `message-thread.component.*` | `apps/frontend/src/app/features/chat/chat-widget/message-thread/message-thread.component.{ts,html,scss}` | Messages list + typing indicator + input + send |
| F6 | Tích hợp chat-widget vào layout | `apps/frontend/src/app/layout/main-layout.component.html` | Thêm `<app-chat-widget>` cuối body |
| F7 | Provide ChatService toàn app | `apps/frontend/src/app/app.config.ts` | Thêm ChatService vào providers |

---

### ~~P2 — Storage Module~~ ✅ COMPLETED

| # | Step | File | Ghi chú |
|---|------|------|---------|
| S1 | Tạo `libs/storage/` package | `libs/storage/package.json` + `tsconfig.json` | |
| S2 | Tạo `storage.service.ts` | `libs/storage/src/storage.service.ts` | MinIO client: upload(buffer, key), getPresignedUrl(key), delete(key) |
| S3 | Export index | `libs/storage/src/index.ts` | |
| S4 | Tích hợp vào backend | `apps/backend/src/plugins/storage.plugin.ts` | fastify.decorate('storage', ...) |
| S5 | Tạo storage routes | `apps/backend/src/modules/storage/storage.routes.ts` | POST /api/storage/upload (multipart, check MIME + size) |

---

### ~~P3 — BullMQ Queues~~ ✅ COMPLETED

| # | Step | File | Ghi chú |
|---|------|------|---------|
| Q1 | Tạo `libs/redis/` package | `libs/redis/src/redis.config.ts` | ioredis wrapper, đã có ioredis trong deps |
| Q2 | Tạo email queue | `libs/redis/src/queues/email.queue.ts` | BullMQ Queue + Worker |
| Q3 | Tạo notification queue | `libs/redis/src/queues/notification.queue.ts` | BullMQ Queue + Worker |
| Q4 | Kết nối NotificationsService | `apps/backend/src/modules/notifications/notifications.service.ts` | Publish job thay vì chỉ ghi DB |

---

### P4 — Email Templates

| # | Step | File |
|---|------|------|
| E1 | Setup package | `packages/email-templates/package.json` |
| E2 | Welcome email | `packages/email-templates/src/welcome.tsx` |
| E3 | Verify email | `packages/email-templates/src/verify-email.tsx` |
| E4 | Reset password | `packages/email-templates/src/reset-password.tsx` |

---

### P5 — Reports/Analytics

| # | Step | File |
|---|------|------|
| R1 | BE: reports module | `apps/backend/src/modules/reports/` |
| R2 | FE: reports feature | `apps/frontend/src/app/features/reports/` |

---

### P6 — Admin UI

| # | Step | File |
|---|------|------|
| A1 | Schools CRUD | `apps/frontend/src/app/features/admin/schools/` |
| A2 | Classes CRUD | `apps/frontend/src/app/features/admin/classes/` |
| A3 | Content moderation | `apps/frontend/src/app/features/admin/content/` |

---

### P7 — CI/CD

| # | Step | File |
|---|------|------|
| CI1 | CI workflow | `.github/workflows/ci.yml` |
| CI2 | Deploy workflow | `.github/workflows/deploy.yml` |

---

## 🐛 Known Issues / Tech Debt

1. **Vitest ARM64** — `@rollup/rollup-linux-arm64-gnu` missing trong sandbox. Tests chạy ok trên Mac, fail trong Linux ARM. Fix khi setup CI/CD.

2. **Blog auth optional** — dùng try/catch quanh `jwtVerify()`. Nên tạo `optionalAuthenticate` middleware riêng.

3. **`as never` Prisma JSON** — `details` field trong AuditLog cần `as never` cast. Cân nhắc dùng `Prisma.InputJsonValue`.

4. **konva chưa install** — đã add vào package.json, cần `pnpm install` trên Mac để có trong node_modules.

5. **CLASS ChatRoom auto-create** — Khi tạo Class mới cần tự tạo ChatRoom type CLASS. Đây là step B8 trong P1.

---

## 📐 Architectural Decisions

| Quyết định | Lý do |
|------------|-------|
| Routes → Service → Repository | Separation of concerns, testability |
| `writeAuditLog()` non-throwing | Audit failure không break main flow |
| `@fastify/jwt` augmentation | Tránh conflict với JWT user type |
| `satisfies Prisma.XxxSelect` | Type-safe selects, IDE inference |
| Bỏ `rootDir` backend tsconfig | Path aliases đến workspace packages |
| `SecurityContext.NONE` provideMarkdown | KaTeX HTML/SVG bị Angular sanitizer cắt |
| Konva lazy-loaded | Không tăng initial bundle |
| Konva `runOutsideAngular()` | Hiệu năng: không trigger CD mỗi mousemove |
| Socket.io attach fastify.server port 3000 | Dùng chung port REST, không cần Nginx config thêm |
| Redis Adapter Socket.io | Scale multi-instance |
| Chat floating widget (FAB) | Available mọi trang, không chiếm layout |
| BullMQ Notification/Email worker | Không làm chậm HTTP request khi lưu DB / gửi email |
