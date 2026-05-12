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
  shared-types/      # TypeScript types dùng chung FE+BE (User, BlogPost, Question, Chat...)
  shared-constants/  # Enums, constants dùng chung
  email-templates/   # React Email templates ✅ (welcome, verify-email, reset-password)

libs/
  prisma/            # Prisma schema + migrations ✅
  redis/             # Redis client wrapper ✅
  storage/           # MinIO client wrapper (inline trong storage module)
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
│   │       ├── core/
│   │       │   ├── services/
│   │       │   │   ├── auth.service.ts
│   │       │   │   ├── blog.service.ts
│   │       │   │   ├── chat.service.ts
│   │       │   │   ├── push-notification.service.ts  # Browser Notification API
│   │       │   │   └── ...
│   │       │   ├── interceptors/
│   │       │   ├── guards/
│   │       │   └── utils/
│   │       ├── features/    # Feature modules (lazy loaded)
│   │       │   ├── auth/
│   │       │   ├── dashboard/
│   │       │   ├── student-dashboard/  # Dashboard cá nhân cho học sinh
│   │       │   ├── lessons/
│   │       │   ├── classes/
│   │       │   ├── chat/
│   │       │   ├── blog/               # BlogLayout, public access, no authGuard
│   │       │   ├── admin/
│   │       │   │   ├── exercises/      # exercise-editor (split panel)
│   │       │   │   ├── questions/      # question-bank list & detail editor
│   │       │   │   ├── blog/           # admin blog list + editor (admin endpoints)
│   │       │   │   ├── users/
│   │       │   │   ├── schools/
│   │       │   │   ├── classes/
│   │       │   │   └── subjects/
│   │       │   └── reports/
│   │       └── layout/
│   │           ├── main-layout/        # MainLayoutComponent (sidebar + breadcrumb, authGuard)
│   │           └── blog-layout/        # BlogLayoutComponent (sticky header, public, no sidebar)
│   └── backend/
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── lessons/       # + question nested routes
│           │   ├── questions/     # Question Bank
│           │   ├── schools/
│           │   ├── classes/
│           │   ├── blog/          # + admin/posts, top-viewed, related, viewCount
│           │   ├── notifications/
│           │   ├── chat/
│           │   ├── storage/       # MinIO upload
│           │   ├── reports/       # + export Excel/PDF
│           │   ├── subjects/
│           │   └── geo/
│           ├── plugins/     # prisma.plugin, redis.plugin, socket.plugin
│           └── shared/
│               ├── middleware/  # authenticate, authorize, optionalAuthenticate
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
