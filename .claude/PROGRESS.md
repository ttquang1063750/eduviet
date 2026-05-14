# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-14 (session 23 — Bug fixes + Deprecated API cleanup)
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
| `packages/shared-types/src/` | lesson.types.ts, user.types.ts, auth.types.ts, common.types.ts, chat.types.ts, blog.types.ts, school.types.ts, question.types.ts |
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
| `plugins/storage.plugin.ts` | fastify.decorate storage + ensurePublicReadPolicy |
| `plugins/queues.plugin.ts` | BullMQ workers (email, notifications) |
| `shared/middleware/authenticate.ts` | JWT verify + authenticate + authorize() |
| `shared/middleware/optional-authenticate.ts` | optionalAuthenticate |
| `shared/utils/sanitize.ts` | sanitizeContent() + sanitizeText() |
| `shared/errors/app-error.ts` | AppError: unauthorized/forbidden/notFound/conflict/badRequest/validation/internal |
| `shared/utils/audit.ts` | writeAuditLog() |
| `modules/auth/` | routes + service + schema |
| `modules/users/` | routes + service + repository + spec |
| `modules/lessons/` | routes + service + repository + spec |
| `modules/subjects/` | routes + service |
| `modules/schools/` | routes + service + repository + spec |
| `modules/classes/` | routes + service + repository + spec |
| `modules/blog/` | routes + service + repository |
| `modules/notifications/` | routes + service (BullMQ) |
| `modules/chat/` | routes + service + repository + spec |
| `modules/storage/storage.routes.ts` | POST /api/storage/upload |
| `modules/reports/` | routes + service + repository + Excel/PDF export + LiberationSans font |
| `assets/fonts/LiberationSans-*.ttf` | Font TTF nhúng PDF — hỗ trợ tiếng Việt đầy đủ dấu |

### Frontend (`apps/frontend/src/app/`)

| File/Folder | Mô tả |
|-------------|-------|
| `app.config.ts` | zoneless, provideMarkdown, markedKatex — không còn deprecated symbols |
| `app.routes.ts` | Lazy routes |
| `core/guards/auth.guard.ts` | — |
| `core/interceptors/auth.interceptor.ts` | — |
| `core/services/auth.service.ts` | — |
| `core/utils/http-error.ts` | getApiErrorMessage() |
| `core/utils/name-initials.ts` | getInitials() — NVA initials |
| `layout/main-layout.component.*` | Sidebar collapsible 260px↔80px, Material theme colors, icon centering |
| `shared/components/breadcrumb/` | Dynamic breadcrumb |
| `shared/pipes/safe-html.pipe.ts` | DOMPurify + bypassSecurityTrustHtml |
| `shared/components/drawing-canvas/` | Konva.js canvas + viewChild() signal |
| `shared/components/geo-tree/` | GeoTreeComponent: lazy-load, RBAC scoping |
| `styles/_admin-shared.scss` | 10 shared patterns dùng chung |
| `features/auth/` | login/register |
| `features/dashboard/` | Stats cards |
| `features/lessons/` | list + detail (KaTeX + Konva) |
| `features/classes/` | list + detail |
| `features/blog/` | list + detail + comments + top-viewed sidebar |
| `features/chat/` | ChatService (signals), widget FAB, room-list, message-thread, read receipts |
| `features/reports/` | Dashboard + Xuất Excel/PDF |
| `features/student-dashboard/` | Student dashboard |
| `features/admin/users/` | CRUD + multi-role |
| `features/admin/schools/` | mat-table + nested routes |
| `features/admin/classes/` | mat-table + student management |
| `features/admin/content/` | Content moderation |
| `features/admin/subjects/` | grid + modal CRUD + AI suggest |
| `features/admin/blog/` | Quill WYSIWYG + Draft→Review→Publish |
| `features/admin/questions/` | Question Bank list + editor + question-form (signal inputs) |
| `features/admin/lessons/` | list + editor + exercise-editor (CDK DragDrop) |

---

## Session 23 — Bug fixes + Deprecated API cleanup (2026-05-14)

### Bug fixes ✅

| File | Thay đổi |
|------|----------|
| `shared/errors/app-error.ts` | Thêm `static validation()` → HTTP 422 — fix `AppError.validation is not a function` |
| `modules/reports/reports.service.ts` | Xóa `import.meta.url` (ESM-only) → dùng CJS built-in `__dirname` — fix ESM/CJS conflict + PDF font path |
| `packages/shared-types/src/lesson.types.ts` | Thêm `reviewerId: string \| null` vào `Lesson` interface |

### Deprecated API cleanup ✅

| File | Thay đổi |
|------|----------|
| `app.config.ts` | `APP_INITIALIZER` → `provideAppInitializer()`, `ENVIRONMENT_INITIALIZER` → `provideEnvironmentInitializer()`, remove `provideAnimations*` |
| 13 service/component files | `from 'rxjs/operators'` → `from 'rxjs'` (RxJS 7+ direct import) |
| 3 component files | Remove `CommonModule` import (không cần trong standalone) |
| `drawing-canvas.component.ts` | `@ViewChild` → `viewChild.required()` signal |
| `question-form.component.ts` | `@Input/@Output` → `input()/output()` signals + fix template `question()` |
| `question-bank-picker.component.ts` | `@Input/@Output` → `input()/output()` signals |
| `lesson-detail.component.html` | `$any()` → `!` non-null assertion |

### Lint fixes ✅

| File | Thay đổi |
|------|----------|
| `lesson-admin-editor.component.ts` | `(lesson as any).reviewerId` → `lesson.reviewerId ?? null` |
| `lesson-admin-list.component.ts` | Remove unused `MatIconButton` import |
| `questions-admin.component.ts` | Remove unused `MatIconButton` import |
| `question-editor.component.ts` | `onSaved(q)` → `onSaved(_q)` |
| `blog-detail.component.ts` | Remove unused `forkJoin`, `of` imports |

### Sidebar polish ✅

| File | Thay đổi |
|------|----------|
| `main-layout.component.scss` | Sidebar bg `var(--mat-sys-primary)`, remove border-radius, icon left-align token |
| `styles.scss` | Collapsed centering: `mdc-list-item__content { flex: 0; width: 0 }` — fix icon alignment |

---

## 🚧 Backlog

**Không còn backlog kỹ thuật tồn đọng.**

---

## 🐛 Known Issues đã xử lý hết

| Issue | Trạng thái |
|-------|-----------|
| Vitest ARM64 | ✅ N/A — CI dùng ubuntu-latest (x86) |
| PDF font tiếng Việt mất dấu | ✅ Fixed session 23 — root cause: ESM/CJS crash → font path sai |
| `AppError.validation` không tồn tại | ✅ Fixed session 23 |
| ESM/CJS conflict `import.meta` | ✅ Fixed session 23 |
