# EduViet — Kiến trúc hệ thống

## Sơ đồ tổng thể

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (reverse proxy)             │
│              Rate limiting + SSL termination         │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  Angular    │        │  API Server  │
    │  Frontend   │        │  (Fastify)   │
    │  :4200      │        │  :3000       │
    └─────────────┘        └──────┬───────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
        ┌──────▼──────┐  ┌────────▼───┐  ┌──────────▼──┐
        │ PostgreSQL  │  │   Redis    │  │    MinIO     │
        │ :5432       │  │   :6379    │  │    :9000     │
        └─────────────┘  └────────────┘  └─────────────┘
```

## Module layout

```
apps/
  frontend/          # Angular app
  backend/           # Fastify API server

packages/
  shared-types/      # TypeScript types dùng chung FE+BE
  shared-constants/  # Enums, constants dùng chung
  email-templates/   # React Email templates (chưa implement)

libs/
  prisma/            # Prisma schema + migrations
  redis/             # Redis client wrapper (chưa implement)
  storage/           # MinIO client wrapper (chưa implement)
```

## Cấu trúc thư mục chi tiết

```
eduviet/
├── .claude/
│   ├── settings.json
│   ├── PROGRESS.md          # Tracker tiến độ chi tiết
│   ├── agents/              # Claude agent definitions
│   ├── commands/            # Slash commands
│   └── workflows/           # Dev workflows
├── apps/
│   ├── frontend/
│   │   └── src/app/
│   │       ├── core/        # Auth, interceptors, guards, breadcrumb service
│   │       ├── shared/      # UI components dùng chung (breadcrumb, drawing-canvas)
│   │       ├── features/    # Feature modules (lazy loaded)
│   │       │   ├── auth/
│   │       │   ├── dashboard/
│   │       │   ├── lessons/
│   │       │   ├── classes/
│   │       │   ├── chat/    # (đang implement)
│   │       │   ├── blog/
│   │       │   ├── admin/
│   │       │   └── reports/ # (chưa implement)
│   │       └── layout/      # MainLayoutComponent
│   └── backend/
│       └── src/
│           ├── modules/     # auth, users, lessons, schools, classes, blog, notifications, chat
│           ├── plugins/     # prisma.plugin, redis.plugin, socket.plugin (đang implement)
│           └── shared/
│               ├── middleware/  # authenticate, authorize
│               ├── errors/      # AppError class
│               └── utils/       # writeAuditLog
├── packages/
│   ├── shared-types/
│   └── shared-constants/
├── libs/
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── docker/
│   ├── nginx/
│   ├── minio/
│   └── postgres/
├── docker-compose.yml
├── docker-compose.prod.yml
├── dev-start.sh             # One-command dev setup
└── docs/                    # Tài liệu dự án (thư mục này)
```

## Backend — Service/Repository Pattern

```
Route handler → Service → Repository → Prisma
```

- **Routes**: không có business logic, chỉ validate input (Zod) và gọi service
- **Service**: RBAC checks, business rules, gọi `writeAuditLog()`
- **Repository**: chỉ giao tiếp với Prisma, typed selects dùng `satisfies Prisma.XxxSelect`
