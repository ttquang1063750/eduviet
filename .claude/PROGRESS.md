# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-09 (session 4 — hotfix)
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
| `main.ts` | Fastify bootstrap |
| `plugins/prisma.plugin.ts` | Prisma client plugin |
| `plugins/redis.plugin.ts` | Redis plugin |
| `plugins/socket.plugin.ts` | Socket.io v4, JWT auth, Redis adapter |
| `plugins/storage.plugin.ts` | fastify.decorate storage |
| `plugins/queues.plugin.ts` | BullMQ workers (email, notifications) |
| `shared/middleware/authenticate.ts` | JWT verify + authenticate + authorize() |
| `shared/middleware/optional-authenticate.ts` | optionalAuthenticate |
| `shared/utils/sanitize.ts` | sanitizeContent() + sanitizeText() |
| `shared/errors/app-error.ts` | AppError class |
| `shared/utils/audit.ts` | writeAuditLog() |
| `modules/auth/` | routes + service + schema |
| `modules/users/` | routes + service + repository + spec |
| `modules/lessons/` | routes + service + repository + spec |
| `modules/subjects/` | routes + service |
| `modules/schools/` | routes + service + repository |
| `modules/classes/` | routes + service + repository |
| `modules/blog/` | routes + service + repository |
| `modules/notifications/` | routes + service (BullMQ) |
| `modules/chat/` | routes + service + repository + gateway + spec |
| `modules/storage/storage.routes.ts` | POST /api/storage/upload |
| `modules/reports/` | routes + service + repository + **export Excel/PDF** |

### Frontend (`apps/frontend/src/app/`)

| File/Folder | Mô tả |
|-------------|-------|
| `app.config.ts` | zoneless, provideMarkdown, markedKatex |
| `app.routes.ts` | Lazy routes |
| `core/guards/auth.guard.ts` | — |
| `core/interceptors/auth.interceptor.ts` | — |
| `core/services/auth.service.ts` | — |
| `core/utils/http-error.ts` | `getApiErrorMessage()` helper cho catch blocks |
| `layout/main-layout.component.*` | Shell layout — sidebar 9 routes |
| `shared/components/breadcrumb/` | Dynamic breadcrumb |
| `shared/pipes/safe-html.pipe.ts` | DOMPurify + bypassSecurityTrustHtml |
| `shared/components/drawing-canvas/` | Konva.js canvas + `getInputValue()` helper |
| `features/auth/` | login (3 files) |
| `features/dashboard/` | Stats cards (3 files) |
| `features/lessons/` | list + detail (KaTeX + Konva) + `getInputValue()` helper |
| `features/classes/` | list + detail |
| `features/blog/` | list + detail + nested comments |
| `features/chat/` | ChatService (signals), chat-widget FAB, room-list, message-thread |
| `features/reports/` | Dashboard reports (Chart.js) + **nút Xuất Excel/PDF** (3 files, OnPush) |
| `features/admin/users/` | CRUD đầy đủ |
| `features/admin/schools/` | Schools CRUD (3 file, OnPush) |
| `features/admin/classes/` | Classes CRUD (3 file, OnPush) |
| `features/admin/content/` | Content moderation (3 file, OnPush) |

### ESLint ✅ COMPLETED (2026-05-09)

| File | Mô tả |
|------|-------|
| `apps/frontend/eslint.config.js` | ESLint 9 flat config — enforce OnPush, no-inline, no-any, prefer-control-flow |
| `apps/frontend/angular.json` | schematics mặc định: 3 file + OnPush; thêm lint target |
| `apps/frontend/package.json` | thêm `@angular-eslint/template-parser`, `@eslint/js` |
| `.claude/commands/execute-step.md` | Component Checklist 8 điểm bắt buộc |

### CI/CD ✅

| File | Mô tả |
|------|-------|
| `.github/workflows/ci.yml` | CI: lint + test + build |
| `.github/workflows/deploy.yml` | CD: GHCR + SSH deploy |

---

## 🚧 Backlog (theo độ ưu tiên)

### P1 — pgcrypto cho PII fields
Mã hóa `email`, `phone` at-rest trong PostgreSQL bằng pgcrypto. Cần migration + update Prisma queries.

### P2 — Dependabot
Tạo `.github/dependabot.yml` để tự động quét dependency vulnerabilities.

### P3 — SMS notifications (ESMS.vn)
Tích hợp ESMS.vn vào notification queue. Pattern tương tự email.queue.ts.

### P4 — Export reports PDF cải thiện font
PDFKit mặc định không hỗ trợ tiếng Việt. Cần nhúng font (VD: Roboto) hoặc dùng Puppeteer để render HTML → PDF.

---

## 🐛 Known Issues / Tech Debt

1. **Vitest ARM64** — `@rollup/rollup-linux-arm64-gnu` missing trên Linux ARM64. CI dùng `ubuntu-latest` (x86).
2. **PDF font Vietnamese** — PDFKit dùng font mặc định, nội dung export bỏ dấu tiếng Việt.
3. **`authorize` không phải file riêng** — nằm chung `authenticate.ts`. Chấp nhận.

---

## 📐 Architectural Decisions

| Quyết định | Lý do |
|------------|-------|
| Routes → Service → Repository | Separation of concerns, testability |
| `writeAuditLog()` non-throwing | Audit failure không break main flow |
| `@fastify/jwt` augmentation | Tránh conflict với JWT user type |
| `satisfies Prisma.XxxSelect` | Type-safe selects |
| `SecurityContext.NONE` provideMarkdown | KaTeX HTML/SVG bị Angular sanitizer cắt |
| Konva lazy-loaded + runOutsideAngular | Không tăng initial bundle |
| Socket.io attach fastify.server port 3000 | Dùng chung port REST |
| Redis Adapter Socket.io | Scale multi-instance |
| BullMQ Notification/Email worker | Không làm chậm HTTP request |
| GHCR cho Docker registry | Free với GitHub repo |
| `optionalAuthenticate` middleware | Blog public nhưng cần biết role |
| DOMPurify + sanitize-html 2 lớp | Defense in depth |
| `@fastify/csrf-protection` chỉ trên cookie endpoints | JWT Bearer tự miễn nhiễm |
| ESLint flat config (v9) | Enforce Angular rules tự động — không phụ thuộc AI nhớ rules |
| `getApiErrorMessage()` util | Xử lý `catch (error: unknown)` an toàn, tái sử dụng |
| `getInputValue()` helper | Thay `$any($event.target).value` trong template — type-safe |

### Hotfixes (2026-05-09)
- `docker-compose.yml` — MinIO tag `RELEASE.2024-05-01T01-10-10Z` → `RELEASE.2025-04-22T22-12-26Z`
- `apps/frontend/src/main.ts` — `window as Window & Record<string,unknown>` → `Object.assign(window, {...})`
