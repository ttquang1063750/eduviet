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

## Trạng thái hiện tại (cập nhật 2026-05-09 — session 4)

> ⚠️ Cần chạy `pnpm install` nếu chưa: thêm `@angular-eslint/template-parser`, `@eslint/js` vào package.json trong session 4.

### ✅ Đã hoàn thành

#### Backend modules (`apps/backend/src/modules/`)
| Module | Routes | Service | Repository | Tests |
|--------|--------|---------|------------|-------|
| `auth` | ✅ | ✅ | — | — |
| `users` | ✅ | ✅ | ✅ | ✅ |
| `lessons` | ✅ | ✅ | ✅ | ✅ |
| `subjects` | ✅ | ✅ | — | — |
| `schools` | ✅ | ✅ | ✅ | — |
| `classes` | ✅ | ✅ | ✅ | — |
| `blog` | ✅ | ✅ | ✅ | — |
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
| `reports` | ✅ + Xuất Excel/PDF | — | ✅ | ✅ |
| `chat` | ✅ widget (FAB) | ✅ room-list + message-thread | ✅ | — |

#### Shared Components
- ✅ `breadcrumb/` — dynamic breadcrumb
- ✅ `drawing-canvas/` — Konva.js + `getInputValue()` typed helper
- ✅ `shared/pipes/safe-html.pipe.ts` — DOMPurify + bypassSecurityTrustHtml
- ✅ `core/utils/http-error.ts` — `getApiErrorMessage()` cho catch blocks

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
1. **pgcrypto** cho PII fields (email, phone) trong DB
2. **Dependabot** `.github/dependabot.yml`
3. **PDF font tiếng Việt** — PDFKit không hỗ trợ dấu, cần nhúng font hoặc dùng Puppeteer
4. **SMS notifications** (ESMS.vn)

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
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: { id: string; email: string; role: UserRole; };
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
