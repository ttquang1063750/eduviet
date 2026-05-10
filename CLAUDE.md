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

## Trạng thái hiện tại (cập nhật 2026-05-10 — session 9)

### ✅ Đã hoàn thành

#### Backend modules (`apps/backend/src/modules/`)
| Module | Routes | Service | Repository | Tests |
|--------|--------|---------|------------|-------|
| `auth` | ✅ | ✅ | — | — |
| `users` | ✅ | ✅ | ✅ | ✅ |
| `lessons` | ✅ | ✅ | ✅ | ✅ |
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
| `admin/schools` | ✅ | ✅ | — | ✅ |
| `admin/classes` | ✅ | ✅ | — | ✅ |
| `admin/content` | ✅ | — | — | ✅ |
| `admin/subjects` | ✅ grid + modal CRUD + AI suggest | — | ✅ | ✅ |
| `admin/blog` | ✅ list + filter | ✅ Quill WYSIWYG + Draft/Review | ✅ | ✅ |
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

#### Các module lớn trước đó
- ✅ Live Chat (Socket.io v4, Redis adapter, RBAC per room)
- ✅ Storage Module (MinIO)
- ✅ BullMQ Queues (email + notification workers)
- ✅ Email Templates (React Email)
- ✅ CI/CD (GitHub Actions, GHCR)
- ✅ CSRF Protection + XSS Defense in depth
- ✅ Admin UI (Users/Schools/Classes/Content CRUD)

### 🚧 Còn lại (theo độ ưu tiên)
1. **Multi-Role RBAC** — `User.roles Json[]` + `title`, migrate `authorize()`, JWT payload, Admin UI multi-select
2. **Question Bank & Exercise Editor** — model `Question` + `LessonQuestion`, `/admin/lessons/:id/exercises` split panel
3. **Export reports PDF cải thiện font**: PDFKit tiếng Việt (P3)

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
