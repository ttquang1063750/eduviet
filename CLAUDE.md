# EduViet — Nền tảng ôn tập học thuật trực tuyến

Nền tảng học tập trực tuyến dành cho học sinh Việt Nam. Flat Illustration design. RBAC nhiều cấp. **Ưu tiên cao nhất: Bảo mật.**

## Tài liệu chi tiết

| File | Nội dung |
|------|----------|
| [`docs/tech-stack.md`](docs/tech-stack.md) | Angular 21, Fastify, PostgreSQL, Redis, MinIO |
| [`docs/architecture.md`](docs/architecture.md) | Sơ đồ hệ thống, module layout, folder structure |
| [`docs/coding-standards.md`](docs/coding-standards.md) | Angular, Fastify, Prisma, Testing, Git conventions |
| [`docs/rbac.md`](docs/rbac.md) | Roles, phân cấp địa lý, content workflow, chat RBAC |
| [`docs/features.md`](docs/features.md) | Mô tả tính năng + trạng thái implement |
| [`docs/dev-setup.md`](docs/dev-setup.md) | Setup local, env vars, ports, pnpm commands |
| [`docs/security.md`](docs/security.md) | Checklist PR, nguyên tắc bảo mật |
| [`docs/api-conventions.md`](docs/api-conventions.md) | Response format, error codes, Prisma conventions |
| [`.claude/PROGRESS.md`](.claude/PROGRESS.md) | Tracker tiến độ chi tiết + backlog |

---

## Trạng thái hiện tại (cập nhật 2026-05-11 — session 15)

### ✅ Đã hoàn thành

#### Backend modules (`apps/backend/src/modules/`)
| Module | Routes | Service | Repository | Tests |
|--------|--------|---------|------------|-------|
| `auth` | ✅ | ✅ | — | — |
| `users` | ✅ | ✅ | ✅ | ✅ |
| `lessons` | ✅ + question routes | ✅ + LessonQuestion methods | ✅ + LessonQuestion CRUD | ✅ |
| `questions` | ✅ | ✅ + AI generate | ✅ | — |
| `subjects` | ✅ | ✅ (CRUD + AI suggest) | — | — |
| `geo` | ✅ | ✅ | — | — |
| `schools` | ✅ | ✅ | ✅ | — |
| `classes` | ✅ | ✅ | ✅ | — |
| `blog` | ✅ + submit-review | ✅ + submitForReview() | ✅ | — |
| `notifications` | ✅ | ✅ (BullMQ) | — | — |
| `chat` | ✅ | ✅ | ✅ | ✅ |
| `storage` | ✅ | — | — | — |
| `reports` | ✅ + export | ✅ + export | ✅ | — |

#### Frontend features (`apps/frontend/src/app/features/`)
| Feature | List | Detail | Service | Routes |
|---------|------|--------|---------|--------|
| `auth` | ✅ login/register | — | ✅ | ✅ |
| `dashboard` | ✅ | — | — | ✅ |
| `lessons` | ✅ | ✅ + KaTeX + Konva | ✅ | ✅ |
| `classes` | ✅ | ✅ | ✅ | ✅ |
| `blog` | ✅ | ✅ | ✅ | ✅ |
| `admin/users` | ✅ CRUD complete | ✅ CRUD complete | ✅ | ✅ |
| `admin/schools` | ✅ | ✅ + danh sách lớp | — | ✅ |
| `admin/classes` | ✅ | ✅ + quản lý học sinh | — | ✅ |
| `admin/content` | ✅ | — | — | ✅ |
| `admin/subjects` | ✅ grid + modal CRUD + AI suggest | — | ✅ | ✅ |
| `admin/blog` | ✅ list + filter | ✅ Quill WYSIWYG + Draft/Review | ✅ | ✅ |
| `admin/questions` | ✅ list + filter | ✅ detail editor (page) | ✅ | ✅ |
| `reports` | ✅ + Xuất Excel/PDF | — | ✅ | ✅ |
| `chat` | ✅ widget (FAB) | ✅ room-list + message-thread | ✅ | — |

#### Shared Components
- ✅ `breadcrumb/` — dynamic breadcrumb
- ✅ `drawing-canvas/` — Konva.js + `getInputValue()` typed helper
- ✅ `shared/pipes/safe-html.pipe.ts` — DOMPurify + bypassSecurityTrustHtml
- ✅ `shared/components/geo-tree/` — GeoTreeComponent: lazy-load Nations→Provinces→Districts, RBAC scoping, emits nodeSelected
- ✅ `core/utils/http-error.ts` — `getApiErrorMessage()` cho catch blocks

#### Admin UI Session 6 ✅ COMPLETED (2026-05-10)
- ✅ `shared/components/geo-tree/` — GeoTreeComponent: lazy-load Nations→Provinces→Districts, RBAC scoping, emits GeoNodeSelected
- ✅ `admin/schools/` sidebar — geo-tree filter theo districtId
- ✅ `admin/classes/` detail — school picker + HOMEROOM_TEACHER picker (filtered by schoolId)
- ✅ `admin/subjects/` — grid CRUD + modal + AI suggest + ConfirmService
- ✅ `admin/blog/` list + editor — Quill.js WYSIWYG, Draft→Review→Publish workflow
- ✅ `blog.service.ts` (BE+FE) — thêm `submitForReview()` + `POST /:id/submit-review`
- 🐛 **Fix**: 4 chỗ dùng `confirm()` browser → `ConfirmService.confirm()` (subjects, blog-list, blog-editor)

#### ESLint ✅ COMPLETED (2026-05-09)
- ✅ `apps/frontend/eslint.config.js` — ESLint 9 flat config, 0 lỗi trên toàn bộ src/
- ✅ Rules bắt buộc: `prefer-on-push` + `no-inline-declarations` + `no-explicit-any` + `prefer-control-flow`
- ✅ `angular.json` schematics — `ng generate component` mặc định tạo 3 file + OnPush
- ✅ `.claude/commands/execute-step.md` — Component Checklist 8 điểm

#### Reports Export ✅ COMPLETED (2026-05-09)
- ✅ `GET /api/reports/export/excel` — xuất Excel (exceljs), 2 sheets, styled
- ✅ `GET /api/reports/export/pdf` — xuất PDF (pdfkit)
- ✅ FE: nút "Xuất Excel" + "Xuất PDF" với loading state, ToastService

#### Docker Production Build ✅ COMPLETED (2026-05-11 session 13)
- ✅ `docker/backend/Dockerfile` — multi-stage, tsx runtime (giải quyết monorepo TS packages)
- ✅ `docker/frontend/Dockerfile` — Angular build + Nginx SPA serve
- ✅ `docker/nginx/nginx.spa.conf` — SPA fallback + static asset caching
- ✅ `.dockerignore` — loại trừ node_modules, dist, .env, docs
- ✅ `apps/backend/package.json` — `tsx` → dependencies; `build` copy assets; `start:prod`
- 🔧 Lý do tsx làm runtime: `@eduviet/redis` + `@eduviet/email-templates` là TypeScript source (`"main": "./src/index.ts"`), không thể load bằng `node` thuần mà không compile từng package

#### School → Class → Student Flow + UX Fixes ✅ COMPLETED (2026-05-11 session 14)
- ✅ `admin/schools/schools-admin-detail.*` — thêm danh sách lớp học, nút "Tạo lớp mới" (navigate đến `/admin/classes/new?schoolId=xxx`)
- ✅ `admin/classes/classes-admin-detail.*` — quản lý học sinh: xem danh sách, tìm kiếm + thêm mới, xóa khỏi lớp
- ✅ Student search: load 10 học sinh mặc định khi mở panel, infinite scroll tải thêm khi gần đáy
- ✅ `backUrl()` dynamic — về `/admin/schools/:id` nếu vào từ trang trường, về `/admin/classes` nếu vào thẳng
- ✅ `main-layout.component.html` — xóa link `/classes` (student-facing); giữ `/admin/classes` là "Lớp học" (🏫) dưới Quản trị
- 🐛 Fix `mat-hint` trong `@else` — Angular Material không content-project qua control flow; chuyển ra ngoài `@if/@else`
- 🐛 Fix `mat-select` dùng `[ngModel]`/`(ngModelChange)` — yêu cầu FormsModule; đổi sang `[value]` + `(selectionChange)`
- 🐛 Fix `exercise-editor.goBack()` — điều hướng nhầm về `/admin/content`; sửa thành `/admin/lessons/:lessonId/edit`

#### Theme + Chat Polish ✅ COMPLETED (2026-05-11 session 15)
- ✅ `angular.json` — xóa `indigo-pink.css` prebuilt theme (đây là nguyên nhân density không có tác dụng)
- ✅ `material-theme.scss` — `mat.theme()` M3 API đúng, density hoạt động sau khi xóa prebuilt theme
- 🐛 Fix `[(ngModel)]="signal"` trong message-thread → `[ngModel]="sig()" (ngModelChange)="sig.set($event)"`
- ✅ Chat real-time fix: `socket.join('user:<userId>')` on connect + `room_invited` event → recipient tự join room mới
- ✅ Tạo cuộc hội thoại mới: nút ✏️ + search user + `getOrCreateOneOnOne()`
- ✅ Xoá chat room: `DELETE /rooms/:id` BE cascade + FE nút 🗑 hover + socket `room_deleted` broadcast
- ✅ Search error handling: `catchError` trong switchMap → không pending vô tận khi 401/403

#### Các module lớn trước đó
- ✅ Live Chat (Socket.io v4, Redis adapter, RBAC per room)
- ✅ Storage Module (MinIO)
- ✅ BullMQ Queues (email + notification workers)
- ✅ Email Templates (React Email)
- ✅ CI/CD (GitHub Actions, GHCR)
- ✅ CSRF Protection + XSS Defense in depth
- ✅ Admin UI (Users/Schools/Classes/Content CRUD)

#### Multi-Role RBAC ✅ COMPLETED (2026-05-10 session 10)
- ✅ `libs/prisma/schema.prisma` — `role Role enum` → `roles Json @default("[\"STUDENT\"]")` + `title String?`
- ✅ Migration `20260510000001_user_multi_roles` — backfill + drop old enum
- ✅ `packages/shared-types` — `User.roles`, `AuthUser.roles`, `JwtPayload.roles`, `CreateUserRequest.roles`
- ✅ `authenticate.ts` + `optional-authenticate.ts` — OR logic, `request.user.roles[]`
- ✅ `auth.service.ts` (BE) — sign JWT với `roles[]`, register default `['STUDENT']`
- ✅ `users.repository.ts` — `parseRoles()`, JSONB `@>` filter, SELECT/INSERT/UPDATE roles
- ✅ `users.service.ts` + `users.routes.ts` — multi-role params, `PATCH /:id/roles`
- ✅ `blog.service.ts` + `blog.routes.ts` — `userRoles[]` cho list/getBySlug/hideComment/deleteComment
- ✅ `lessons.service.ts` + `lessons.routes.ts` — `userRoles[]` cho list/getBySlug
- ✅ `socket.plugin.ts` — `SocketUser.roles[]`
- ✅ `users.service.spec.ts` — test calls updated to roles arrays
- ✅ `auth.service.ts` (FE) — `currentRoles`, `hasRole()` OR logic, `currentRole` kept for display
- ✅ `users.service.ts` (FE) — `changeRoles()` → `PATCH /:id/roles`
- ✅ `users-admin-detail.component` — multi-select `<select multiple>` + `title` field, `isSuperAdmin` computed
- ✅ `users-admin.component` — multi-select roles in create modal, table shows multiple badges
- ✅ `class-detail.component` — `e.user.roles?.includes('STUDENT')`
- ✅ `main-layout.component` — `roleLabel` prioritizes `user.title` over `roles[0]`

#### Question Bank & Exercise Editor ✅ COMPLETED (2026-05-11 session 11)
- ✅ `libs/prisma/schema.prisma` — `QuestionType` enum (6 values), `Question` model, `LessonQuestion` junction, `Lesson.randomizeQuestions`
- ✅ Migration `20260510000002_question_bank` — CREATE tables, migrate from exercises, DROP exercises
- ✅ `packages/shared-types/src/question.types.ts` — `Question`, `LessonQuestion`, `CreateQuestionRequest`, `GenerateQuestionsRequest`, `QuestionFilter`
- ✅ `apps/backend/src/modules/questions/` — repository + service (RBAC + AI generate) + routes (6 endpoints)
- ✅ `apps/backend/src/modules/lessons/` — nested routes (5 endpoints) + service methods + repository LessonQuestion CRUD
- ✅ `shared/utils/audit.ts` — extended `AuditAction` + `AuditResourceType` for QUESTION/SUBJECT/FILE/USER roles
- ✅ `apps/frontend/src/app/core/services/questions.service.ts` — full API client
- ✅ `exercise-editor/` — split panel 40/60, CDK DragDrop, randomize toggle, AI generate dialog
- ✅ `exercise-editor/question-form/` — dynamic form per QuestionType (6 types), all fields
- ✅ `exercise-editor/question-bank-picker/` — modal, filter, pagination, multi-select
- ✅ `/admin/lessons/:id/exercises` route added (lazy loaded)
- ✅ `lesson-detail.component.html` — updated to use `lessonQuestions[].question`
- ✅ `main-layout.component.html` — thêm "🗂️ Ngân hàng câu hỏi" link (isAdmin || isContentRole)
- ✅ `features/admin/questions/questions-admin.component` — Question Bank admin page (filter, paginate, CRUD modal)
- ✅ `chat.types.ts` — `role` → `roles` (multi-role fix)

### 🚧 Còn lại (theo độ ưu tiên)
- **Không còn backlog kỹ thuật tồn đọng.** Tất cả P1–P3 đã hoàn thành.

#### Blog UX & Cleanup session 8 ✅ COMPLETED (2026-05-10)
- ✅ **Blog UX**: Tag autocomplete (Material Chips), Slug auto-gen, Slug preview.
- ✅ **Feature Removal**: SMS notifications (ESMS.vn) — removed from BE, schema, and docs.
- ✅ `[ngx-markdown] katex warning` — bỏ `[katex]="true"` (markedKatex extension đã xử lý)
- ✅ `global:scripts.js require is not defined` — xóa scripts CommonJS thừa khỏi angular.json (đã import qua main.ts)
- ✅ `classes/new` không tạo được — `[value]="g"` → `[ngValue]="g"` trên grade select (giữ kiểu number)
- ✅ Blog editor cursor nhảy về đầu — bỏ `(onContentChanged)` + `onContentChange()` (formControlName CVA đã tự sync)
- ✅ Blog editor không hiện content khi edit — `getBySlug()` BE fallback UUID → `findById()`
- ✅ Blog public hiện post chưa publish — `getAll()` FE hardcode `status: 'PUBLISHED'`
- ✅ Blog image upload 413 Payload Too Large — Quill image handler → upload MinIO thay vì base64
- ✅ Blog image upload 415 Unsupported Media Type — register `@fastify/multipart` trong main.ts
- ✅ Blog image không hiển thị — `ensurePublicReadPolicy('public')` tự set bucket policy khi app start; key prefix `public/uploads/`
- ✅ Blog publish không lưu ảnh mới — `onPublish()` auto-save content trước khi đổi status

> ✅ pgcrypto PII fields — DONE (schema Bytes + migration + pii-crypto.ts)
> ✅ Dependabot — DONE (.github/dependabot.yml)

---

## Patterns bắt buộc (PHẢI tuân thủ)

### Backend — Service/Repository

```
Route handler → Service → Repository → Prisma
```
- Routes: chỉ validate (Zod) + gọi service, không có business logic
- Service: RBAC checks, business rules, gọi `writeAuditLog()`
- Repository: chỉ giao tiếp Prisma, dùng `satisfies Prisma.XxxSelect`

### JWT type augmentation

```typescript
// ĐÚNG — augment @fastify/jwt, KHÔNG augment fastify
// user.roles là MẢNG — KHÔNG dùng user.role (multi-role)
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: { id: string; email: string; roles: UserRole[]; };
  }
}
```

### Audit log (không throw)

```typescript
await writeAuditLog(this.prisma, {
  userId: actorId,
  action: 'LESSON_CREATED',
  resourceType: 'LESSON',
  resourceId: lesson.id,
});
```

### Angular — bắt buộc
- 3 file riêng: `templateUrl` + `styleUrl` (KHÔNG inline)
- `OnPush` trên mọi component
- `inject()` thay constructor injection
- Signals cho state, control flow `@if`/`@for`, không `*ngIf`/`*ngFor`
- `provideZonelessChangeDetection()` (Angular 21 zoneless)
- Catch blocks: `catch (error: unknown)` + `getApiErrorMessage()` từ `core/utils/http-error.ts`
- Template event value: `getInputValue($event)` thay `$any($event.target).value`
