# EduViet — Tech Stack

## Frontend
- **Angular 21** (zoneless, standalone components)
  - Signals & Signal-based forms
  - Control Flow (`@if`, `@for`, `@switch`, `@defer`)
  - OnPush ChangeDetectionStrategy trên toàn bộ component
  - Angular Material + Custom Flat Illustration Design System
  - RxJS (chỉ dùng khi Signals không đủ)
  - Socket.io client (live chat)
  - Konva.js (vẽ hình tương tác)
  - KaTeX via ngx-markdown + marked-katex-extension

## Backend
- **Node.js 22 LTS + TypeScript**
  - Fastify (type-safe, nhanh hơn Express)
  - Prisma ORM (type-safe, migrations, seeding)
  - Socket.io v4 (WebSocket server cho live chat)
  - BullMQ + Redis (job queues: email, notification)
  - JWT (`@fastify/jwt`) — Access Token 15m + Refresh Token 7d
  - Zod (validation schema cho mọi request/response)

## Database
- **PostgreSQL 16** — database chính
  - JSONB cho nội dung bài học linh hoạt
  - Full-text search tiếng Việt
  - Row-level security (RLS) cho RBAC
  - pgcrypto cho bảo mật
- **Redis 7** — cache, session store, pub/sub cho live chat, BullMQ queues
- **MinIO** — object storage cho ảnh, file upload (S3-compatible, self-hosted)

## Infrastructure
- **Docker + Docker Compose** — toàn bộ stack local và production
- **Nginx** — reverse proxy, rate limiting, SSL termination
- **GitHub Actions** — CI/CD pipeline

## Testing
- Frontend: **Jest + Testing Library + Cypress** (E2E)
- Backend: **Vitest + Supertest** (unit + integration)
- Contract testing: **Pact**

## Code Quality
- **ESLint** (Angular ESLint + TypeScript ESLint)
- **Prettier**
- **Husky + lint-staged** (pre-commit hooks)
- **Commitlint** (conventional commits)
