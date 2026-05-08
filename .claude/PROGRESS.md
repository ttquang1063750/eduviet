# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-08 (session 2 — security + sidebar + breadcrumb fix)
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
| `libs/prisma/schema.prisma` | Full schema: User, Class, Lesson, Exercise, Blog, Chat, Notification, AuditLog |
| `libs/prisma/migrations/` | Initial migration |
| `libs/prisma/src/seed.ts` | Seed data mẫu |
| `packages/shared-types/src/` | lesson.types.ts, user.types.ts, auth.types.ts, common.types.ts, chat.types.ts, blog.types.ts, school.types.ts |
| `packages/shared-constants/src/` | roles.ts, content.ts, pagination.ts |
| `libs/redis/` | Redis (ioredis) wrapper, BullMQ queues (email, notification) |
| `libs/storage/` | StorageService: upload, getPresignedUrl, delete, getPublicUrl |
| `packages/email-templates/` | React Email templates: welcome.tsx, verify-email.tsx, reset-password.tsx |

### Backend (`apps/backend/src/`)

| File | Mô tả |
|------|-------|
| `main.ts` | Fastify bootstrap, đăng ký tất cả modules |
| `plugins/prisma.plugin.ts` | Prisma client plugin |
| `plugins/redis.plugin.ts` | Redis (ioredis) plugin |
| `plugins/socket.plugin.ts` | Socket.io v4, JWT auth, Redis adapter |
| `plugins/storage.plugin.ts` | fastify.decorate storage, ensureBucket on startup |
| `plugins/queues.plugin.ts` | BullMQ workers setup (email, notifications) |
| `shared/middleware/authenticate.ts` | JWT verify + `authenticate` + `optionalAuthenticate` + `authorize()` |
| `shared/utils/sanitize.ts` | `sanitizeContent()` + `sanitizeText()` — sanitize-html, bảo vệ XSS trước khi lưu DB |
| `shared/errors/app-error.ts` | AppError class |
| `shared/utils/audit.ts` | writeAuditLog() — `Prisma.InputJsonValue`, explicit mapping, no `as never` |
| `modules/auth/` | routes + service + schema (login, register, refresh, logout) |
| `modules/users/` | routes + service + repository + spec |
| `modules/lessons/` | routes + service + repository + spec |
| `modules/subjects/` | routes + service |
| `modules/schools/` | routes + service + repository |
| `modules/classes/` | routes + service + repository |
| `modules/blog/` | routes + service + repository |
| `modules/notifications/` | routes + service (BullMQ queue) |
| `modules/chat/` | routes + service + repository + gateway + spec |
| `modules/storage/storage.routes.ts` | POST /api/storage/upload — MIME whitelist, 10MB limit, audit log |
| `modules/reports/` | routes + service + repository (analytics, _count, _sum, groupBy) |

### Frontend (`apps/frontend/src/app/`)

| File/Folder | Mô tả |
|-------------|-------|
| `app.config.ts` | zoneless, provideMarkdown(SecurityContext.NONE), markedKatex |
| `app.routes.ts` | Lazy routes cho tất cả features |
| `core/guards/auth.guard.ts` | — |
| `core/interceptors/auth.interceptor.ts` | — |
| `core/services/auth.service.ts` | — |
| `core/services/lessons.service.ts` | — |
| `core/services/classes.service.ts` | — |
| `core/services/blog.service.ts` | — |
| `layout/main-layout.component.*` | Shell layout — sidebar đầy đủ 9 routes theo role |
| `shared/components/breadcrumb/` | Dynamic breadcrumb (fix duplicate route data inheritance) |
| `shared/pipes/safe-html.pipe.ts` | DOMPurify + bypassSecurityTrustHtml — render blog content an toàn |
| `shared/components/drawing-canvas/` | Konva.js: freehand/line/rect/ellipse/eraser/undo/redo/export |
| `features/auth/` | login component (3 files) |
| `features/dashboard/` | Stats cards (3 files) |
| `features/lessons/` | list + detail (KaTeX + Konva DRAWING type) |
| `features/classes/` | list + detail |
| `features/blog/` | list + detail + nested comments |
| `features/chat/` | ChatService (signals), chat-widget FAB, room-list, message-thread |
| `features/reports/` | Dashboard reports (Chart.js), reports.service.ts, routes |
| `features/admin/users/` | CRUD đầy đủ (list, search, filter, modal create, detail edit) |
| `features/admin/schools/` | Schools CRUD — refactored: 3 file, OnPush, signals, @for/@if |
| `features/admin/classes/` | Classes CRUD — refactored: 3 file, OnPush, signals, @for/@if |
| `features/admin/content/` | Content moderation — refactored: 3 file, OnPush, signals, fix prompt() |

### CI/CD ✅ COMPLETED (2026-05-07)

| File | Mô tả |
|------|-------|
| `.github/workflows/ci.yml` | CI: lint + test (BE+FE) + build — trigger push/PR to main |
| `.github/workflows/deploy.yml` | CD: build & push Docker images (GHCR) + deploy via SSH |

### Docs & .claude

| File | Mô tả |
|------|-------|
| `docs/tech-stack.md` + `docs/architecture.md` + `docs/coding-standards.md` | — |
| `docs/rbac.md` + `docs/features.md` + `docs/dev-setup.md` | — |
| `docs/security.md` + `docs/api-conventions.md` | — |
| `.claude/rules.md` | Coding rules bất biến |
| `.claude/commands/` | plan-task, execute-step, check-point, resume, sync-progress |

---

## 🚧 Backlog (theo độ ưu tiên)

### ~~P1 — Live Chat~~ ✅ COMPLETED
### ~~P2 — Storage Module~~ ✅ COMPLETED
### ~~P3 — BullMQ Queues~~ ✅ COMPLETED
### ~~P4 — Email Templates~~ ✅ COMPLETED
### ~~P5 — Reports/Analytics~~ ✅ COMPLETED
### ~~P6 — Admin UI (Schools/Classes/Content)~~ ✅ COMPLETED
### ~~P7 — CI/CD~~ ✅ COMPLETED
### ~~P8 — Admin Users CRUD~~ ✅ COMPLETED (2026-05-08)

---

## 🚧 Backlog (theo độ ưu tiên)

### ~~P1 — Refactor admin components~~ ✅ COMPLETED (2026-05-08)
schools-admin + classes-admin + content-admin: 3 file riêng, OnPush, signals, @for/@if, bỏ CommonModule, fix prompt().

### ~~P2 — Class ChatRoom auto-create~~ ✅ ALREADY DONE
Đã implement trong `classes.service.ts`: create() tạo ChatRoom CLASS, enroll()/unenroll() sync members tự động.

---

## 🐛 Known Issues / Tech Debt

1. **Vitest ARM64** — `@rollup/rollup-linux-arm64-gnu` missing trên Linux ARM64. CI đã dùng `ubuntu-latest` (x86) để tránh. Tests chạy ok trên Mac.

2. ~~**Blog auth optional**~~ — ✅ Đã tạo `optionalAuthenticate` middleware, refactor blog.routes.ts.

3. ~~**`as never` Prisma JSON**~~ — ✅ `AuditEntry.details` đổi sang `Prisma.InputJsonValue`, explicit mapping trong writeAuditLog.

4. ~~**CLASS ChatRoom auto-create**~~ — ✅ Đã implement đầy đủ trong classes.service.ts (create + enroll + unenroll).

5. **`authorize` không phải file riêng** — `authorize()` nằm trong `authenticate.ts`. Chấp nhận — cùng file với `authenticate` là hợp lý.

6. ~~**schools-admin components**~~ — ✅ Đã refactor: 3 file riêng, OnPush, signals, @for/@if (2026-05-08).

---

## 📐 Architectural Decisions

| Quyết định | Lý do |
|------------|-------|
| Routes → Service → Repository | Separation of concerns, testability |
| `writeAuditLog()` non-throwing | Audit failure không break main flow |
| `@fastify/jwt` augmentation | Tránh conflict với JWT user type |
| `satisfies Prisma.XxxSelect` | Type-safe selects, IDE inference |
| `SecurityContext.NONE` provideMarkdown | KaTeX HTML/SVG bị Angular sanitizer cắt |
| Konva lazy-loaded + runOutsideAngular | Không tăng initial bundle, không trigger CD mỗi mousemove |
| Socket.io attach fastify.server port 3000 | Dùng chung port REST, không cần Nginx config thêm |
| Redis Adapter Socket.io | Scale multi-instance |
| Chat floating widget (FAB) | Available mọi trang, không chiếm layout |
| BullMQ Notification/Email worker | Không làm chậm HTTP request khi lưu DB / gửi email |
| GHCR cho Docker registry | Free với GitHub repo, tích hợp sẵn secrets GITHUB_TOKEN |
| `optionalAuthenticate` middleware | Blog public nhưng cần biết role để filter DRAFT/REVIEW |
| DOMPurify + sanitize-html 2 lớp | BE strip trước khi lưu, FE strip trước khi render — defense in depth |
| `@fastify/csrf-protection` chỉ trên cookie endpoints | JWT Bearer routes tự miễn nhiễm CSRF |
| Breadcrumb dedup theo fullUrl | Angular kế thừa route data → child path:'' nhận breadcrumb của cha |
