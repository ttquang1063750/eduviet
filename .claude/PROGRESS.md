# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-10 (session 7 — PDF Font tiếng Việt)
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
| `modules/reports/` | routes + service + repository + **export Excel/PDF + font tiếng Việt (LiberationSans)** |

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

---

## 📋 Specs đã viết

| File | Nội dung |
|------|---------|
| `docs/superpowers/specs/2026-05-09-admin-ui-tree-subjects-blog-design.md` | Admin UI: Geo Tree + Schools/Classes enhancement + Subjects + Blog editor |

### Backlog mới từ spec (thêm vào sau P4)

**P5 — Admin UI: Geographic Tree + Schools/Classes Enhancement**
- Shared `<app-geo-tree>` component
- `/admin/schools` thêm sidebar cây
- `/admin/classes` thêm school picker + teacher picker (HOMEROOM_TEACHER filtered by school)

**P6 — Admin UI: Subjects Admin**
- CRUD + AI auto-suggest (ngx-quill không cần ở đây)
- BE: POST/PUT/DELETE/suggest routes

**P7 — Admin UI: Blog Editor**
- WYSIWYG editor với Quill.js (ngx-quill)
- Draft → Review workflow

---

## Session 5 — Admin UI: Geo Tree + Subjects + Blog (2026-05-09)

### Backend (thêm mới)

| File | Mô tả |
|------|-------|
| `modules/geo/geo.routes.ts` | GET /api/geo/nations, /provinces?nationId=, /districts?provinceId= |
| `modules/geo/geo.service.ts` | GeoService: getNations/getProvinces/getDistricts |
| `modules/subjects/subjects.routes.ts` | CRUD routes + AI suggest (SUPER_ADMIN only) |
| `modules/subjects/subjects.service.ts` | create/update/delete + suggest() Anthropic API |
| `modules/users/users.routes.ts` | Thêm `schoolId` vào paginationSchema |
| `main.ts` | Register geoRoutes tại `/api/geo` |

### Frontend (thêm mới)

| File/Folder | Mô tả |
|-------------|-------|
| `core/services/geo.service.ts` | getNations/getProvinces/getDistricts() |
| `core/services/subjects.service.ts` | CRUD + suggest() |
| `core/services/blog.service.ts` | Mở rộng: create/update/publish/delete admin methods |
| `shared/components/geo-tree/` | GeoTreeComponent (3 file, OnPush, lazy-load, RBAC scoping) |
| `features/admin/schools/` | schools-admin-list: thêm geo-tree sidebar + districtId filter |
| `features/admin/classes/` | classes-admin-detail: school picker + HOMEROOM_TEACHER picker |
| `features/admin/subjects/` | SubjectsAdminComponent + routes (grid view, modal CRUD, AI suggest) |
| `features/admin/blog/` | BlogAdminListComponent + BlogAdminEditorComponent + routes |
| `app.routes.ts` | Thêm lazy routes: /admin/subjects, /admin/blog |
| `app.config.ts` | provideQuillConfig |
| `layout/main-layout.component.html` | Thêm nav links: Môn học, Blog (quản trị) |
| `angular.json` | Thêm quill.snow.css vào styles |
| `apps/frontend/package.json` | Thêm ngx-quill@^27.0.0, quill@^2.0.3, @types/quill |

### Cần chạy sau session này

```bash
pnpm install   # cài ngx-quill + quill + @types/quill
```

---

## Session 6 — Admin UI: Verify + Fix + Blog Review Flow (2026-05-10)

> Task "Admin UI — Geo Tree + Subjects + Blog Editor" — **COMPLETED**

### Verified (đã tồn tại từ session 5, verified đúng chuẩn)

| File/Folder | Kết quả |
|-------------|---------|
| `shared/components/geo-tree/` | ✅ 3 file, OnPush, signals, lazy-load, RBAC |
| `features/admin/schools/schools-admin-list.*` | ✅ geo-tree sidebar, districtId filter |
| `features/admin/classes/classes-admin-detail.*` | ✅ school picker + HOMEROOM_TEACHER picker |
| `features/admin/subjects/subjects-admin.*` | ✅ grid + modal CRUD + AI suggest |
| `features/admin/blog/blog-admin-list.*` | ✅ list + filter status |
| `features/admin/blog/blog-admin-editor.*` | ✅ Quill.js WYSIWYG |
| `app.routes.ts` | ✅ /admin/subjects + /admin/blog routes |
| `layout/main-layout.component.html` | ✅ sidebar links Môn học + Blog quản trị |

### Thêm mới trong session 6

| File | Mô tả |
|------|-------|
| `apps/backend/src/modules/blog/blog.routes.ts` | Thêm `POST /:id/submit-review` |
| `apps/backend/src/modules/blog/blog.service.ts` | Thêm `submitForReview()` + audit log |
| `apps/frontend/src/app/core/services/blog.service.ts` | Thêm `submitForReview()` |
| `features/admin/blog/blog-admin-editor.component.ts` | `onSubmitForReview()`, `canPublish`/`canSubmitReview` computed, ConfirmService |
| `features/admin/blog/blog-admin-editor.component.html` | Nút "Gửi duyệt" + gate "Xuất bản" theo role |
| `features/admin/blog/blog-admin-editor.component.scss` | `.btn-review` style |

### Bugfixes (vi phạm rules phát hiện khi review)

| File | Fix |
|------|-----|
| `subjects-admin.component.ts` | `confirm()` → `ConfirmService.confirm()` (onDelete) |
| `blog-admin-list.component.ts` | `confirm()` → `ConfirmService.confirm()` (onPublish + onDelete) |
| `blog-admin-editor.component.ts` | `confirm()` → `ConfirmService.confirm()` (onPublish) |

### Backlog tiếp theo (P1 ← NEXT)

**P1 — pgcrypto cho PII fields**
Mã hóa `email`, `phone` at-rest trong PostgreSQL bằng pgcrypto.

### ✅ Discovered completed (session 6 audit)

| Item | Trạng thái |
|------|-----------|
| P1 — pgcrypto PII fields | ✅ DONE — schema `Bytes`, migration `encrypt_pii_fields`, `pii-crypto.ts`, `users.repository.ts` dùng `pgp_sym_encrypt/decrypt` + `hashPII` |
| P2 — Dependabot | ✅ DONE — `.github/dependabot.yml` có npm + github-actions + docker |
