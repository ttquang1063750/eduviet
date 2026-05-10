# EduViet — Local Development Setup

## Prerequisites
- Docker Desktop
- Node.js 22 LTS
- pnpm 9+

## Khởi động nhanh (one command)

```bash
bash ~/Desktop/eduviet/dev-start.sh
```

Script tự động: kiểm tra pnpm → `pnpm install` → khởi Docker → chờ PostgreSQL → copy `.env` → migrate DB → seed data → mở browser → `pnpm dev`

## Khởi động thủ công

```bash
git clone <repo> && cd eduviet
cp .env.example .env

docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev          # FE :4200 + BE :3000 song song
```

## Ports

| Service | Port |
|---------|------|
| Angular Dev Server | 4200 |
| Fastify API | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| MailHog (dev email) | 8025 |
| Nginx | 80/443 |

## Các lệnh hay dùng

```bash
# Development
pnpm dev           # FE + BE song song
pnpm dev:fe        # Chỉ FE
pnpm dev:be        # Chỉ BE

# Testing
pnpm test          # Toàn bộ
pnpm test:fe       # Frontend (Jest)
pnpm test:be       # Backend (Vitest)
pnpm test:e2e      # Cypress E2E

# Database
pnpm db:migrate          # Chạy pending migrations
pnpm db:migrate:create   # Tạo migration mới
pnpm db:seed             # Seed dữ liệu mẫu
pnpm db:reset            # Reset + reseed (dev only!)
pnpm db:studio           # Mở Prisma Studio

# Code quality
pnpm lint          # ESLint toàn bộ
pnpm format        # Prettier format
pnpm typecheck     # TypeScript check

# Docker
pnpm docker:up     # docker compose up -d
pnpm docker:down   # docker compose down
pnpm docker:logs   # Xem logs
pnpm docker:reset  # Reset volumes (NGUY HIỂM!)
```

## Environment Variables (.env.example)

```bash
# Database
DATABASE_URL=postgresql://eduviet:secret@localhost:5432/eduviet_dev
SHADOW_DATABASE_URL=postgresql://eduviet:secret@localhost:5432/eduviet_shadow

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=eduviet

# Auth
JWT_SECRET=change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=no-reply@eduviet.vn

# App
NODE_ENV=development
API_PORT=3000
FRONTEND_URL=http://localhost:4200
API_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:4200
```
