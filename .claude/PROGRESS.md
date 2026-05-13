# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-12 (session 18 — Admin Refactor + Search Fix)
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
| `assets/fonts/LiberationSans-*.ttf` | Font TTF nhúng PDF — 17/17 ký tự tiếng Việt |
| `plugins/storage.plugin.ts` | + `ensurePublicReadPolicy('public')` — tự set bucket policy khi start |
| `main.ts` | + `@fastify/multipart` register (file upload) |
| `modules/reports/` | routes + service + repository + **export Excel/PDF + font tiếng Việt (LiberationSans)** |
| `modules/blog/blog.service.ts` | `getBySlug()` fallback UUID → `findById()` |
| `modules/storage/storage.routes.ts` | key prefix `public/uploads/` (MinIO public read) |

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

## Session 18 — Schools & Classes Admin Refactor: mat-table + nested routes (2026-05-12)

### Phase 1–7: Full Admin UI Refactor ✅

| File | Thay đổi |
|------|----------|
| `schools-admin-list.component.*` | mat-table, geo filter, 3 action buttons |
| `schools-admin-detail.component.*` | Edit school form only, navigation to classes |
| `school-classes-list.component.*` | mat-table classes per school, breadcrumb navigation |
| `school-class-detail.component.*` | Edit/create class form, school-scoped |
| `school-class-students.component.*` | mat-table students, add/remove panel with infinite scroll |
| `classes-admin-list.component.*` | mat-table global list, navigation to school-scoped detail |
| `schools-admin.routes.ts` | Nested routes structure |
| `classes.repository.ts` (BE) | **Fix**: Thêm hỗ trợ `search` filter cho Class list |
| `classes.routes.ts` (BE) | **Fix**: Update list schema to allow `search` |

### Route structure mới

```
/admin/schools                                  ← mat-table (edit/classes/delete)
/admin/schools/new                              ← create school
/admin/schools/:id                              ← edit school only
/admin/schools/:id/classes                      ← mat-table classes của trường
/admin/schools/:id/classes/new                  ← create class (schoolId auto)
/admin/schools/:id/classes/:classId             ← edit class only
/admin/schools/:id/classes/:classId/students    ← mat-table học sinh + add panel
```

### ✅ Tất cả P1–P7 đã hoàn thành (session 18)
Refactor Schools/Classes Admin to mat-table + nested routes.
Fix Class Search bug in BE+FE.

---

## 🚧 Backlog (theo độ ưu tiên)

- **Không còn backlog kỹ thuật tồn đọng.**

---

## 🐛 Known Issues / Tech Debt

1. **Vitest ARM64** — `@rollup/rollup-linux-arm64-gnu` missing trên Linux ARM64. CI dùng `ubuntu-latest` (x86).
2. **PDF font Vietnamese** — PDFKit dùng font mặc định, nội dung export bỏ dấu tiếng Việt.
3. **`authorize` không phải file riêng** — nằm chung `authenticate.ts`. Chấp nhận.
4. **Backend Type Errors** — `AppError.validation` và `AuditAction` mismatch phát hiện trong session 18.
5. **ESM/CJS conflict** — `import.meta` error in `reports.service.ts`.

---

## Session 19 — Bug Fix: Angular Material content projection (2026-05-13)

### 🐛 Fix: `@if` inside Material buttons → `[style.display]`

| File | Thay đổi |
|------|----------|
| `school-class-students.component.html` | Thay `@if` bên trong `<button mat-stroked-button>` và `<button mat-icon-button>` bằng `[style.display]` — fix Angular compiler warning `controlFlowPreventingContentProjection` |

**Root cause:** Angular Material dùng content projection để render icon/spinner bên trong button. Control flow `@if` chặn projection này, gây warning và có thể render sai.  
**Fix pattern:** Render cả hai element, dùng `[style.display]="condition ? '' : 'none'"` để ẩn/hiện.
