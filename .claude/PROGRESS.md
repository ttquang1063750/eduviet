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
| `packages/email-templates/` | React Email templates (Welcome, Verify, Reset Password) |

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
| `modules/reports/` | Reports/Analytics module với _count, _sum, groupBy |

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
| `features/reports/` | Dashboard reports dùng Chart.js |
| `features/admin/schools/` | Schools CRUD UI |
| `features/admin/classes/` | Classes CRUD UI |
| `features/admin/content/` | Content moderation UI |

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
### ~~P2 — Storage Module~~ ✅ COMPLETED
### ~~P3 — BullMQ Queues~~ ✅ COMPLETED
### ~~P4 — Email Templates~~ ✅ COMPLETED
### ~~P5 — Reports/Analytics~~ ✅ COMPLETED
### ~~P6 — Admin UI~~ ✅ COMPLETED

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
