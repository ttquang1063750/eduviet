# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-11 (session 12 — Sidebar + Question Bank Admin Page)
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

## 🚧 Backlog (theo độ ưu tiên — cập nhật session 9)

### P1 — Multi-Role RBAC ← NEXT
User.roles Json[] + title, migrate authorize(), JWT payload, Admin UI multi-select.
Spec: docs/superpowers/specs/2026-05-10-question-bank-exercise-editor-design.md (Phase 0, steps 0-7)

### P2 — Question Bank & Exercise Editor
Model Question + LessonQuestion, SINGLE_CHOICE enum, /admin/lessons/:id/exercises split panel.
Spec: docs/superpowers/specs/2026-05-10-question-bank-exercise-editor-design.md (Phase 1, steps 8-21)

### P3 — Export reports PDF cải thiện font
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
| `User.roles Json[]` thay `role` đơn | Multi-role — một user có thể có nhiều vai trò đồng thời |
| `title String?` tách khỏi roles | Chức danh chỉ để hiển thị, không ảnh hưởng authorize() |
| `Question` + `LessonQuestion` thay `Exercise` | Tái sử dụng câu hỏi qua nhiều bài học (question bank per subject) |
| `Lesson.randomizeQuestions` toggle | Creator kiểm soát thứ tự câu hỏi per lesson — hỗ trợ bài có logic phụ thuộc |

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

---

## Session 9 — Multi-Role RBAC + Question Bank Design (2026-05-10)

### Spec đã viết

| File | Nội dung |
|------|---------|
| `docs/superpowers/specs/2026-05-10-question-bank-exercise-editor-design.md` | Question Bank + Exercise Editor split panel + Multi-Role RBAC |

### Thay đổi kiến trúc quan trọng

#### Multi-Role RBAC
- `User.role: UserRole` → `User.roles: Json` (mảng `UserRole[]`)
- `User.title: String?` — chức danh tự do, chỉ hiển thị, không ảnh hưởng phân quyền
- `authorize()` dùng OR logic — pass nếu user có ít nhất 1 role khớp
- JWT payload: `user.roles: UserRole[]` thay `user.role: UserRole`
- Callsite `authorize('ROLE1', 'ROLE2')` **không đổi**

#### Question Bank
- Model `Exercise` bị xoá — thay bằng `Question` + `LessonQuestion`
- `Question` scoped theo `subjectId` — tái sử dụng qua nhiều bài học
- `LessonQuestion` junction table — `orderIndex` cho fixed-order mode
- `Lesson.randomizeQuestions: Boolean @default(true)` — toggle per lesson
- `ExerciseType` thêm `SINGLE_CHOICE`

### Backlog cập nhật (theo độ ưu tiên)

**P1 — Multi-Role RBAC** ← NEXT
- Phase 0, steps 0–7 trong spec
- Schema migration `user_multi_roles`
- Update `authenticate.ts`, `auth.service.ts`, `users` module, Admin UI

**P2 — Question Bank & Exercise Editor**
- Phase 1, steps 8–21 trong spec
- Schema migration `replace_exercise_with_question_bank`
- Module `questions/`, `/admin/lessons/:id/exercises` split panel, `/admin/questions` CRUD

**P3 — Export reports PDF cải thiện font**
- PDFKit + font Inter/Roboto hỗ trợ tiếng Việt đầy đủ

### Docs cập nhật trong session 9

| File | Thay đổi |
|------|---------|
| `docs/rbac.md` | Thêm mục multi-role, cập nhật authorize() + JWT snippet |
| `docs/features.md` | Cập nhật tính năng 1 (Question Bank) + tính năng 2 (multi-role) |
| `docs/architecture.md` | Thêm module `questions/` + feature `exercises/`, `questions/` |
| `docs/coding-standards.md` | JWT snippet: `role` → `roles[]` |
| `CLAUDE.md` | JWT pattern, trạng thái còn lại, session 9 |

---

## Session 11+12 — Question Bank & Exercise Editor + Sidebar (2026-05-11)

> Task "Question Bank & Exercise Editor" — **COMPLETED**

### Backend (thêm mới)

| File | Mô tả |
|------|-------|
| `modules/questions/questions.repository.ts` | findMany (filter/paginate), findById, create, update, softDelete |
| `modules/questions/questions.service.ts` | RBAC + CRUD + AI generate (claude-haiku-4-5) |
| `modules/questions/questions.routes.ts` | GET/ POST/ GET/:id PATCH/:id DELETE/:id POST/generate |
| `modules/lessons/lessons.routes.ts` | + 5 nested routes: GET/POST /:id/questions, DELETE/:id/questions/:qId, PATCH reorder, PATCH randomize |
| `modules/lessons/lessons.service.ts` | + getLessonQuestions, addQuestion, removeQuestion, reorder, setRandomize, shuffle student response |
| `modules/lessons/lessons.repository.ts` | + findLessonQuestions, addQuestionToLesson, removeQuestionFromLesson, reorderLessonQuestions, setRandomize |
| `shared/utils/audit.ts` | + QUESTION_*/LESSON_QUESTION_*/SUBJECT_*/USER_ROLES_*/FILE_* audit actions |
| `modules/reports/reports.repository.ts` | Fix: countUsersByRole() dùng $queryRaw jsonb_array_elements_text (hỗ trợ multi-role) |

### Frontend (thêm mới)

| File/Folder | Mô tả |
|-------------|-------|
| `core/services/questions.service.ts` | 10 methods: getBank, create, update, delete, generate, getLessonQuestions, addToLesson, removeFromLesson, reorder, setRandomize |
| `features/admin/lessons/exercise-editor/` | Split panel 40/60, CDK DragDrop, randomize toggle, AI generate dialog |
| `features/admin/lessons/exercise-editor/question-form/` | Dynamic form per QuestionType (6 types) |
| `features/admin/lessons/exercise-editor/question-bank-picker/` | Modal, filter, pagination, multi-select |
| `features/admin/questions/questions-admin.component.*` | Ngân hàng câu hỏi admin page: filter/paginate, CRUD modal, subject picker |
| `app.routes.ts` | + /admin/lessons/:id/exercises + /admin/questions |
| `layout/main-layout.component.html` | + "🗂️ Ngân hàng câu hỏi" link (isAdmin || isContentRole) |

### Bugfixes trong session

| File | Fix |
|------|-----|
| `start-dev.sh` | migrate dev → migrate deploy (non-interactive); thêm prisma generate step |
| `users.repository.ts` | `\|\|` + `??` operator precedence (esbuild stricter than tsc) |
| `reports.service.ts` | absolute URL → relative `/api/reports` (bypass proxy fix) |
| `packages/shared-types/chat.types.ts` | `role` → `roles` (multi-role fix) |
| `features/lessons/lesson-detail.component.html` | `exercises` → `lessonQuestions[].question.*` |

### Còn lại
- **P3** — Export reports PDF cải thiện font tiếng Việt (PDFKit + NotoSans)
