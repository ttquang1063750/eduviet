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

## Trạng thái hiện tại (cập nhật 2026-05-07)

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
| `notifications` | ✅ | ✅ | — | — |

#### Frontend features (`apps/frontend/src/app/features/`)
| Feature | List | Detail | Service | Routes |
|---------|------|--------|---------|--------|
| `auth` | ✅ login/register | — | ✅ | ✅ |
| `dashboard` | ✅ | — | — | ✅ |
| `lessons` | ✅ | ✅ + KaTeX + Konva | ✅ | ✅ |
| `classes` | ✅ | ✅ | ✅ | ✅ |
| `blog` | ✅ | ✅ | ✅ | ✅ |
| `admin/users` | ✅ | — | — | ✅ |

#### Shared Components
- ✅ `breadcrumb/` — dynamic breadcrumb
- ✅ `drawing-canvas/` — Konva.js: freehand, line, rect, ellipse, eraser, undo/redo, background image, export PNG

#### Packages & Infrastructure
- ✅ `packages/shared-constants/` + `packages/shared-types/`
- ✅ `libs/prisma/` — schema (bao gồm ChatRoom/ChatMessage) + migrations + seed
- ✅ `docker-compose.yml` / `docker-compose.prod.yml`
- ✅ `docker/nginx/`, `docker/minio/`, `docker/postgres/`
- ✅ `dev-start.sh` — one-command dev setup

#### 🗺️ Live Chat — Design đã duyệt (chưa implement)
- Floating widget (FAB góc phải, badge unread)
- 3 loại room: `CLASS`, `TEACHER_PARENT`, `ONE_ON_ONE`
- Tính năng: typing indicator, read receipts, edit/delete message, file/image upload (MinIO)
- Socket.io attach vào `fastify.server`, Redis Adapter (`@socket.io/redis-adapter`)
- Files cần tạo: `socket.plugin.ts`, `chat.gateway.ts`, `chat.routes.ts`, `chat.service.ts`, `chat.repository.ts`, `ChatService` FE + `chat-widget` component tree

### 🚧 Còn lại (theo độ ưu tiên)
1. **Live Chat** — implement theo design đã duyệt (xem section trên)
2. **Storage module** — `libs/storage/` MinIO client wrapper
3. **BullMQ queues** — `libs/redis/` + email/SMS job queues
4. **packages/email-templates** — React Email templates
5. **Reports/Analytics** — Thống kê tiến độ, export PDF/Excel
6. **Admin UI** — CRUD Schools, Classes, Content
7. **GitHub Actions CI/CD**

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
