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

## Trạng thái hiện tại (cập nhật 2026-05-08 — session 2)

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
| `reports` | ✅ | ✅ | ✅ | — |

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
| `reports` | ✅ | — | ✅ | ✅ |
| `chat` | ✅ widget (FAB) | ✅ room-list + message-thread | ✅ | — |

#### Shared Components
- ✅ `breadcrumb/` — dynamic breadcrumb (fix duplicate route data inheritance)
- ✅ `drawing-canvas/` — Konva.js: freehand, line, rect, ellipse, eraser, undo/redo, background image, export PNG
- ✅ `shared/pipes/safe-html.pipe.ts` — DOMPurify + bypassSecurityTrustHtml cho blog content

#### Packages & Infrastructure
- ✅ `packages/shared-constants/` + `packages/shared-types/` (bao gồm `chat.types.ts`)
- ✅ `libs/prisma/` — schema (bao gồm ChatRoom/ChatMessage) + migrations + seed
- ✅ `docker-compose.yml` / `docker-compose.prod.yml`
- ✅ `docker/nginx/`, `docker/minio/`, `docker/postgres/`
- ✅ `dev-start.sh` — one-command dev setup (banner, cleanup trap, test accounts)
- ✅ `.claude/commands/` — plan-task, execute-step, check-point, resume, start-dev
- ✅ `AI_RULES.md` — session start protocol

#### Live Chat ✅ COMPLETED (2026-05-07)
- ✅ `socket.plugin.ts` — Socket.io v4, JWT auth middleware, Redis adapter
- ✅ `chat.gateway.ts` — 7 socket events (send, edit, delete, typing, mark_read)
- ✅ `chat.service.ts` — RBAC per room type (CLASS/TEACHER_PARENT/ONE_ON_ONE)
- ✅ `chat.repository.ts` — Prisma queries, cursor pagination
- ✅ `chat.routes.ts` — REST API (rooms, messages, upload)
- ✅ `chat-widget` component tree — FAB + room-list + message-thread
- ✅ `ChatService` — signals state, socket.io-client wrapper, eager-init

#### Storage Module ✅ COMPLETED (2026-05-07)
- ✅ `libs/storage/` — `StorageService`: upload, getPresignedUrl, delete, getPublicUrl
- ✅ `apps/backend/src/plugins/storage.plugin.ts` — `fastify.decorate('storage', ...)`
- ✅ `apps/backend/src/modules/storage/storage.routes.ts` — `POST /api/storage/upload` (MIME check, 10MB limit)

#### BullMQ Queues ✅ COMPLETED (2026-05-07)
- ✅ `libs/redis/` — Cấu hình ioredis (`maxRetriesPerRequest: null`) cho BullMQ
- ✅ `email.queue.ts` & `email.worker.ts` — Gửi email qua Nodemailer/MailHog
- ✅ `notification.queue.ts` & `notification.worker.ts` — Xử lý ghi thông báo vào DB
- ✅ `queues.plugin.ts` — Khởi tạo workers & quản lý lifecycle trong Fastify
- ✅ `notifications.service.ts` — Push job vào queue thay vì gọi Prisma trực tiếp

### ✅ Đã hoàn thành thêm (2026-05-08)
- ✅ `packages/email-templates/` — React Email: welcome, verify-email, reset-password
- ✅ `features/reports/` — Dashboard analytics với Chart.js
- ✅ `features/admin/schools/` + `admin/classes/` + `admin/content/`
- ✅ `.github/workflows/ci.yml` + `deploy.yml` — GitHub Actions CI/CD (GHCR + SSH deploy)

### ✅ Đã hoàn thành thêm (2026-05-08 — session 2)
- ✅ Refactor admin components (schools + classes + content) → 3 file riêng, OnPush, signals, @for/@if
- ✅ `optionalAuthenticate` middleware — blog GET routes public nhưng nhận biết role
- ✅ `AuditEntry.details` → `Prisma.InputJsonValue`, bỏ `as never` trong writeAuditLog
- ✅ `shared/utils/sanitize.ts` — sanitize-html cho blog content (BE)
- ✅ `shared/pipes/safe-html.pipe.ts` — DOMPurify pipe cho blog detail (FE)
- ✅ `@fastify/csrf-protection` — bảo vệ /refresh + /logout, thêm GET /auth/csrf-token
- ✅ Sidebar navigation đầy đủ: classes, blog, reports, admin/schools, admin/classes, admin/content
- ✅ Fix breadcrumb duplicate — Angular route data inheritance

### 🚧 Còn lại (theo độ ưu tiên)
1. **pgcrypto** cho PII fields (email, phone) trong DB — thấp ưu tiên
2. **Dependabot** `.github/dependabot.yml` — quét dependency vulnerabilities
3. **`optionalAuthenticate` tách file riêng** — hiện nằm chung `authenticate.ts`

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
