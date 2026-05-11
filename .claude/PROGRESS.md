# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-11 (session 14 — School→Class→Student Flow + Angular Bugfixes)
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
| `features/admin/questions/` | Ngân hàng câu hỏi: list + filter/paginate + **trang soạn thảo chi tiết** (3 file, OnPush) |
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

---

## Session 13 — Docker Production Build + Font Verify (2026-05-11)

### Vấn đề phát hiện khi verify
1. **Font không copy sang dist/**: `tsc` chỉ compile `.ts`, không copy `.ttf` → `node dist/main.js` crash khi load font
2. **Dockerfile thiếu**: `deploy.yml` reference `./docker/backend/Dockerfile` + `./docker/frontend/Dockerfile` nhưng chưa tồn tại
3. **tsx trong devDependencies**: Production Docker không install devDep → `start:prod` không có tsx

### Root cause quan trọng
`@eduviet/redis` và `@eduviet/email-templates` có `"main": "./src/index.ts"` (TypeScript source).  
Khi backend compiled chạy bằng `node dist/main.js`, Node.js không load được TypeScript workspace packages.  
→ Quyết định: dùng `tsx` làm runtime trong production (common pattern, no performance issue cho API server).

### Files thêm/sửa

| File | Mô tả |
|------|-------|
| `apps/backend/package.json` | `tsx` → dependencies; `build` + `cp -r src/assets dist/`; thêm `start:prod` script |
| `docker/backend/Dockerfile` | Multi-stage: deps layer cache + runner với tsx |
| `docker/frontend/Dockerfile` | Angular build (ng build) + Nginx SPA serve |
| `docker/nginx/nginx.spa.conf` | SPA fallback + static asset cache headers |
| `.dockerignore` | Loại trừ node_modules, dist, .env, docs |

### Backlog còn lại
- Không còn backlog kỹ thuật tồn đọng.

---

## Session 14 — School→Class→Student Flow + Angular Bugfixes (2026-05-11)

### Frontend — Thêm mới / Cập nhật

| File | Mô tả |
|------|-------|
| `features/admin/schools/schools-admin-detail.component.ts` | Inject `ClassesService` + `ToastService`; thêm `schoolClasses`, `loadingClasses` signals; `loadClasses(schoolId)`; `goToCreateClass()` |
| `features/admin/schools/schools-admin-detail.component.html` | Thêm section danh sách lớp học (edit mode): header + count badge, nút "Tạo lớp mới", loading/empty state, list lớp (tên, khối, năm học, GVCN chip, số HS, chevron) |
| `features/admin/schools/schools-admin-detail.component.scss` | Thêm `.classes-section`: header, count-badge, loading-row, empty-state, class-list, class-row hover |
| `features/admin/classes/classes-admin-detail.component.ts` | Thêm `fromSchoolId` signal + `backUrl()` dynamic; `enrollments`, `enrolledIds` (computed Set); student search pagination (`studentPage`, `STUDENT_PER_PAGE=10`, `fetchStudents(term, append)`, `onStudentListScroll()`); `enroll()`, `unenroll()` (optimistic update + ConfirmService); `toggleAddStudent()` load 10 mặc định |
| `features/admin/classes/classes-admin-detail.component.html` | Back/Cancel dùng `backUrl()`; thêm student card (edit mode): search panel + infinite scroll + load-more spinner + end-of-list; danh sách enrollment hiện tại với avatar, name, email, nút xóa |
| `features/admin/classes/classes-admin-detail.component.scss` | Thêm `.students-card`, `.students-header`, `.add-student-panel`, `.search-results` (max-h 280px + thin scrollbar), `.load-more-spinner`, `.end-of-list` |
| `layout/main-layout.component.html` | Xóa link `/classes` (student-facing nav); đổi tên "Lớp (quản trị)" → "Lớp học" (🏫) cho `/admin/classes` |

### Bugfixes (Angular compile errors)

| File | Lỗi | Fix |
|------|-----|-----|
| `subjects-admin.component.html` | `mat-hint` bên trong `@else` — Material không content-project qua control flow | Chuyển `<mat-hint>` ra ngoài `@if/@else`, dùng ternary expression cho nội dung |
| `blog-admin-list.component.html` | `[ngModel]`/`(ngModelChange)` trên `mat-select` — yêu cầu FormsModule chưa import | Thay bằng `[value]` + `(selectionChange)` (Angular Material API thuần) |
| `exercise-editor.component.ts` | `goBack()` navigate nhầm về `/admin/content` (trang blog moderation) | Sửa thành `navigate(['/admin/lessons', this.lessonId(), 'edit'])` |

### UX / Navigation Decisions

| Quyết định | Lý do |
|------------|-------|
| School detail → list lớp + "Tạo lớp mới" | Workflow tự nhiên: quản trị viên tạo trường → thêm lớp ngay trong trang trường |
| Class detail → quản lý học sinh (add/remove) | Không cần trang riêng; enrollment gắn với lớp cụ thể |
| `?schoolId` queryParam khi tạo lớp từ trang trường | Pre-fill school; `backUrl()` trả về đúng trang gốc sau khi lưu |
| Load 10 HS mặc định khi mở panel | Tránh panel trống; người dùng có ngay danh sách chọn |
| Infinite scroll (threshold 60px) thay nút "Tải thêm" | UX mượt hơn cho danh sách dài |
| Xóa `/classes` khỏi sidebar; giữ `/admin/classes` | `/classes` dành cho học sinh — không phù hợp trong khu vực quản trị |

### Backlog còn lại
- Không còn backlog kỹ thuật tồn đọng.

---

## Session 15 — Theme Fix + Chat Hoàn chỉnh (2026-05-11)

### Angular Material Theme Fix

| File | Thay đổi |
|------|---------|
| `apps/frontend/angular.json` | Xóa `indigo-pink.css` prebuilt theme khỏi styles[] — đây là nguyên nhân override toàn bộ CSS custom properties của `mat.theme`, khiến density không có tác dụng |
| `apps/frontend/src/app/styles/material-theme.scss` | Giữ `@include mat.theme(...)` (đúng M3 API); density điều chỉnh về giá trị phù hợp |
| `features/admin/schools/schools-admin-list.component.scss` | `.search-field { max-width: 440px }` — tránh flex:1 kéo full width khi không có sidebar |

> **Root cause:** `indigo-pink.css` load sau `styles.scss`, override hết CSS variables do `mat.theme` tạo ra → density, color tokens không có tác dụng.
> **Key insight:** `mat.theme()` mixin là đúng (M3 API). `mat.define-theme()` là cũ. density -5 = form-field 36px, -3 = 44px (càng âm càng nhỏ).

### Chat — Sửa toàn bộ luồng hoạt động

#### Bug fixes

| Bug | Nguyên nhân | Fix |
|-----|-------------|-----|
| Input tin nhắn không gõ được | `[(ngModel)]="messageContent"` với WritableSignal — ngModel không ghi vào signal | Đổi thành `[ngModel]="messageContent()" (ngModelChange)="messageContent.set($event)"` |
| Người nhận không thấy tin nhắn | Socket của recipient không join room khi room mới tạo sau khi login | Mỗi socket tự join `user:<userId>` khi connect; backend emit `room_invited` → client tự join socket room |
| Không thể tìm kiếm người chat — pending vô tận | `catchError` thiếu trong switchMap → observable die khi 401/403 | Thêm `catchError` trong switchMap, set `userSearchError`, reset `searchingUsers` |

#### Tính năng mới

| Feature | Files |
|---------|-------|
| Tạo cuộc hội thoại mới | `room-list.component`: nút ✏️, search panel debounce 300ms, user results list, gọi `getOrCreateOneOnOne()` |
| Xoá chat room | BE: `repo.deleteRoom()` cascade; `service.deleteRoom()` RBAC; `DELETE /rooms/:id` emit `room_deleted`; FE: nút 🗑 hover, `chatService.deleteRoom()`, socket `room_deleted` listener |
| Real-time room invite | BE gateway: `socket.join('user:<userId>')` on connect; routes emit `room_invited` sau khi tạo ONE_ON_ONE; FE: listener thêm room + emit `join_rooms` |

#### Files thay đổi

| File | Mô tả |
|------|-------|
| `chat/chat.gateway.ts` | + `socket.join('user:<userId>')` on connect |
| `chat/chat.routes.ts` | + `DELETE /rooms/:id`; `POST /rooms/one-on-one` emit `room_invited` tới members |
| `chat/chat.service.ts` (BE) | + `deleteRoom(roomId, userId)` — RBAC + cascade + audit |
| `chat/chat.repository.ts` | + `deleteRoom(roomId)` — deleteMany members + messages + delete room |
| `chat/chat.service.ts` (FE) | + `deleteRoom()`; + listeners `room_invited`, `room_deleted` |
| `chat-widget/room-list.component.ts` | + `showNewChat`, user search + error handling, `deleteRoom()`, `deletingRoomId` |
| `chat-widget/room-list.component.html` | + panel tạo chat mới, nút 🗑 xoá room, hiển thị lỗi search |
| `chat-widget/room-list.component.scss` | + `.btn-new-chat`, `.new-chat-panel`, `.user-result-row`, `.btn-delete-room` |
| `chat-widget/message-thread.component.html` | Fix `[(ngModel)]` → `[ngModel]` + `(ngModelChange)` cho signal |

### Architectural Decisions thêm mới

| Quyết định | Lý do |
|------------|-------|
| Private socket room `user:<userId>` | Standard pattern để push event tới user cụ thể qua Redis adapter (multi-instance safe) |
| `room_invited` event khi tạo ONE_ON_ONE | Đảm bảo recipient tự join socket room mà không cần poll; không cần WebRTC signaling phức tạp |
| Cascade delete room (members → messages → room) | Tránh FK constraint violation; không dùng soft-delete cho room vì không cần audit trail lịch sử room |
