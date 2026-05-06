# EduViet — Nền tảng ôn tập học thuật trực tuyến

## Tổng quan dự án

Nền tảng học tập trực tuyến dành cho học sinh Việt Nam, tập trung vào môn Toán và mở rộng sang các môn khác. Thiết kế theo phong cách **Flat Illustration**. Hỗ trợ bài học tương tác, quản lý lớp học, live chat, hệ thống tin tức/blog, phân quyền RBAC nhiều cấp và quản lý trường học theo phân cấp địa lý.

**Ưu tiên cao nhất: Bảo mật hệ thống.**

---

## Tech Stack

### Frontend
- **Angular 19+** (latest stable)
  - Standalone components (mặc định)
  - Signals & Signal-based forms
  - Control Flow (`@if`, `@for`, `@switch`, `@defer`)
  - OnPush ChangeDetectionStrategy trên toàn bộ component
  - Angular Material + Custom Flat Illustration Design System
  - RxJS (chỉ dùng khi Signals không đủ)
  - Socket.io client (live chat)
  - Konva.js (vẽ hình tương tác)

### Backend
- **Node.js 22 LTS + TypeScript**
  - Fastify (thay vì Express — nhanh hơn, type-safe hơn)
  - Prisma ORM (type-safe, migrations, seeding)
  - Socket.io (WebSocket server cho live chat)
  - BullMQ + Redis (job queues: email, SMS, notification)
  - Passport.js + JWT (authentication)
  - Zod (validation)

### Database
- **PostgreSQL 16** — database chính (relational, ACID, full-text search)
- **Redis 7** — cache, session store, pub/sub cho live chat, job queues
- **MinIO** — object storage cho ảnh, file upload (S3-compatible, self-hosted)

> PostgreSQL được chọn vì: JSONB cho nội dung bài học linh hoạt, full-text search tiếng Việt, row-level security (RLS) cho RBAC, pgcrypto cho bảo mật.

### Infrastructure
- **Docker + Docker Compose** — toàn bộ stack chạy local và production
- **Nginx** — reverse proxy, rate limiting, SSL termination
- **GitHub Actions** — CI/CD pipeline

### Testing
- Frontend: **Jest + Testing Library + Cypress** (E2E)
- Backend: **Vitest + Supertest** (unit + integration)
- Contract testing: **Pact**

### Code Quality
- **ESLint** (Angular ESLint + TypeScript ESLint)
- **Prettier**
- **Husky + lint-staged** (pre-commit hooks)
- **Commitlint** (conventional commits)

---

## Kiến trúc hệ thống

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

### Modules kiến trúc

```
apps/
  frontend/          # Angular app
  backend/           # Fastify API server

packages/
  shared-types/      # TypeScript types dùng chung FE+BE
  shared-constants/  # Enums, constants dùng chung
  email-templates/   # React Email templates

libs/
  prisma/            # Prisma schema + migrations
  redis/             # Redis client wrapper
  storage/           # MinIO client wrapper
```

---

## Cấu trúc thư mục

```
eduviet/
├── .claude/
│   ├── settings.json
│   ├── agents/
│   │   ├── feature-builder.md
│   │   ├── security-auditor.md
│   │   ├── db-migrator.md
│   │   ├── test-writer.md
│   │   └── content-seeder.md
│   └── workflows/
│       ├── new-feature.md
│       ├── hotfix.md
│       └── content-publish.md
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/          # Auth, interceptors, guards
│   │   │   │   ├── shared/        # UI components, pipes, directives
│   │   │   │   ├── features/      # Feature modules (lazy loaded)
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── lessons/
│   │   │   │   │   ├── classes/
│   │   │   │   │   ├── chat/
│   │   │   │   │   ├── blog/
│   │   │   │   │   ├── news/
│   │   │   │   │   ├── admin/
│   │   │   │   │   └── reports/
│   │   │   │   └── layout/
│   │   │   ├── environments/
│   │   │   └── styles/            # Design tokens, flat illustration styles
│   │   ├── angular.json
│   │   ├── eslint.config.js
│   │   ├── jest.config.ts
│   │   └── cypress/
│   └── backend/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── schools/
│       │   │   ├── classes/
│       │   │   ├── lessons/
│       │   │   ├── content/
│       │   │   ├── chat/
│       │   │   ├── blog/
│       │   │   ├── news/
│       │   │   ├── notifications/
│       │   │   ├── email/
│       │   │   ├── sms/
│       │   │   └── storage/
│       │   ├── shared/
│       │   │   ├── guards/
│       │   │   ├── decorators/
│       │   │   ├── middleware/
│       │   │   └── pipes/
│       │   └── main.ts
│       └── vitest.config.ts
├── packages/
│   ├── shared-types/
│   ├── shared-constants/
│   └── email-templates/
├── libs/
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── postgres/
│   │   └── init.sql
│   └── minio/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .prettierrc
├── .commitlintrc.json
└── CLAUDE.md
```

---

## Phân quyền RBAC

### Roles hệ thống

| Role | Mô tả |
|------|--------|
| `SUPER_ADMIN` | Quản trị toàn quốc |
| `PROVINCE_ADMIN` | Quản trị cấp tỉnh |
| `DISTRICT_ADMIN` | Quản trị cấp huyện/khu vực |
| `SCHOOL_ADMIN` | Quản trị cấp trường |
| `CONTENT_CREATOR` | Người soạn thảo bài học/tin tức |
| `CONTENT_REVIEWER` | Người review nội dung |
| `CONTENT_APPROVER` | Người duyệt và publish |
| `GRADER` | Người chấm điểm |
| `HOMEROOM_TEACHER` | Giáo viên chủ nhiệm |
| `SUBJECT_TEACHER` | Giáo viên bộ môn |
| `STUDENT` | Học sinh |
| `PARENT` | Phụ huynh |

### Phân cấp địa lý trường học

```
Nation (Quốc gia)
  └── Province (Tỉnh/Thành phố)
        └── District (Quận/Huyện)
              └── School (Trường)
                    └── Class (Lớp)
                          └── Student (Học sinh)
```

### Content workflow

```
DRAFT → REVIEW → APPROVED → PUBLISHED
         ↓                    ↓
       REJECTED            ARCHIVED
```

---

## Các tính năng chính

### 1. Quản lý bài học (Lesson Management)
- Tạo bài thủ công hoặc tự động theo cấp độ (dễ/trung bình/khó)
- Hỗ trợ nhiều loại câu hỏi: trắc nghiệm, điền vào chỗ trống, vẽ hình
- Canvas tương tác (Konva.js) cho bài tập hình học
- LaTeX rendering cho công thức toán (KaTeX)
- Review trước khi publish theo workflow

### 2. Quản lý người dùng & Phân quyền
- Đăng nhập theo role, chỉ hiển thị nội dung phù hợp quyền
- JWT Access Token (15 phút) + Refresh Token (7 ngày, httpOnly cookie)
- Row-Level Security trong PostgreSQL
- Audit log mọi hành động nhạy cảm

### 3. Quản lý lớp học
- Quản lý học sinh, phụ huynh, giáo viên bộ môn, giáo viên chủ nhiệm
- Lịch học, thời khóa biểu
- Điểm danh và theo dõi tiến độ

### 4. Live Chat
- Real-time via Socket.io
- Channels: lớp, nhóm giáo viên-phụ huynh, 1-1
- Lưu lịch sử chat vào PostgreSQL
- Phân quyền theo role (học sinh không chat với người ngoài lớp)

### 5. Blog & Tin tức
- Editor rich text (Quill hoặc TipTap)
- Upload ảnh lên MinIO
- Comment & reply có nested threading
- Moderator có thể ẩn/xóa comment

### 6. Thông báo
- Email (Nodemailer + template React Email)
- SMS (Twilio hoặc ESMS.vn cho thị trường Việt Nam)
- Push notification (in-app)
- Queue bất đồng bộ với BullMQ

### 7. Báo cáo & Phân tích
- Thống kê tiến độ học sinh
- Tỷ lệ hoàn thành bài tập
- Điểm số theo môn, theo lớp
- Export PDF/Excel

### 8. Bảo mật (Security — Ưu tiên cao nhất)
- HTTPS bắt buộc (Nginx SSL)
- Helmet.js (security headers)
- CSRF protection
- Rate limiting per IP và per user
- Input sanitization (DOMPurify cho FE, sanitize-html cho BE)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention
- Audit trail đầy đủ
- Mã hóa dữ liệu nhạy cảm (bcrypt cho password, pgcrypto cho PII)
- CORS cấu hình chặt chẽ
- Dependency scanning (npm audit, Dependabot)

---

## Coding Standards

### Angular Frontend

```typescript
// Mỗi component PHẢI có 3 file riêng biệt:
//   lesson-card.component.ts   — class logic
//   lesson-card.component.html — template
//   lesson-card.component.scss — styles
@Component({
  selector: 'app-lesson-card',
  standalone: true,
  imports: [RouterLink],                               // import cụ thể, không dùng CommonModule
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-card.component.html',         // KHÔNG dùng template: `...` inline
  styleUrl: './lesson-card.component.scss',            // KHÔNG dùng styles: [...] inline
})
export class LessonCardComponent {
  private lessonService = inject(LessonService);       // inject() thay vì constructor

  lesson = input.required<Lesson>();
  isLoading = signal(false);
  lessonTitle = computed(() => this.lesson().title);
}
```

**Quy tắc bắt buộc:**
- **Tách file bắt buộc:** `templateUrl` + `styleUrl` — KHÔNG dùng `template:` hay `styles:` inline
- **SCSS cho styles** — không dùng CSS thuần trong component
- `OnPush` trên mọi component
- `inject()` thay vì constructor injection
- Signals cho local state, `toSignal()` khi convert Observable
- Control flow syntax (`@if`, `@for`) — không dùng `*ngIf`, `*ngFor`
- `@defer` cho lazy loading content
- Không dùng `any` type
- Không import `CommonModule` — import trực tiếp pipe cần dùng (vd: `DatePipe`)
- File tối đa 300 dòng, tách nhỏ nếu vượt quá

**Angular 21 Zoneless — bắt buộc:**
- `provideZonelessChangeDetection()` thay `provideZoneChangeDetection()` (không có zone.js)
- `provideBrowserGlobalErrorListeners()` trong appConfig

### Backend (Fastify + TypeScript)

```typescript
// Route handler pattern
export const lessonRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/lessons/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: { 200: LessonSchema },
      },
      preHandler: [authenticate, authorize('STUDENT', 'TEACHER')],
    },
    async (request, reply) => {
      const lesson = await lessonService.findById(request.params.id);
      return reply.send(lesson);
    }
  );
};
```

**Quy tắc bắt buộc:**
- Zod schema cho mọi request/response
- Không dùng `any` type
- Error handling tập trung tại error handler của Fastify
- Service layer tách biệt với route handler
- Repository pattern cho database access

### Database (Prisma)

- Migrations phải có tên mô tả rõ ràng
- Không bao giờ xóa column trực tiếp — dùng deprecation + migration từng bước
- Index cho mọi foreign key và field thường query
- Soft delete (`deletedAt`) cho dữ liệu quan trọng
- UUID cho primary key (không dùng auto-increment integer)

### Testing

- Coverage tối thiểu: **80%** (unit), **60%** (integration)
- Test file đặt cạnh source file (`*.spec.ts`)
- E2E test cho happy path của mọi tính năng chính
- Mock ở boundary (HTTP calls, DB), không mock internal logic

### Git Conventions

```
feat(lessons): add interactive drawing canvas
fix(auth): resolve JWT refresh race condition
test(chat): add unit tests for message service
docs(rbac): update role permission matrix
chore(deps): update angular to 19.2.0
```

---

## Skills (Claude Code)

### `/new-feature`
Tạo feature mới theo kiến trúc chuẩn của dự án.

**Dùng khi:** Thêm module mới (FE + BE + tests + migration)

**Workflow:**
1. Tạo Prisma migration nếu cần
2. Tạo backend module (route, service, repository)
3. Tạo Zod schemas
4. Tạo Angular feature module (component, service, store)
5. Viết unit tests + integration tests
6. Cập nhật API types trong `shared-types`

### `/security-review`
Review bảo mật toàn diện cho thay đổi đang pending.

**Kiểm tra:**
- Authentication & authorization
- Input validation và sanitization
- SQL injection / XSS / CSRF vectors
- Exposed sensitive data trong response
- Rate limiting coverage
- Audit log coverage

### `/db-migrate`
Tạo và review Prisma migration an toàn.

**Dùng khi:** Cần thay đổi schema database

**Quy tắc:**
- Không breaking change trong một migration
- Luôn có rollback strategy
- Test migration trên seed data trước

### `/content-workflow`
Quản lý workflow soạn thảo → review → publish nội dung.

**Dùng khi:** Thêm loại nội dung mới hoặc thay đổi workflow

### `/test-coverage`
Phân tích và bổ sung test còn thiếu.

**Dùng khi:** Trước khi merge PR, kiểm tra coverage

### `/docker-check`
Kiểm tra docker-compose setup và môi trường local.

**Dùng khi:** Onboard thành viên mới, debug môi trường

---

## Agents

### `feature-builder` agent
**Mục đích:** Xây dựng feature end-to-end từ yêu cầu nghiệp vụ

**Input:** Mô tả tính năng bằng tiếng Việt hoặc tiếng Anh

**Output:**
- Prisma migration files
- Backend: route + service + repository + Zod schemas
- Frontend: component + service + route config
- Test files (unit + integration)
- API contract types

**Constraints:**
- Tuân thủ RBAC — mọi route đều có `preHandler: [authenticate, authorize(...)]`
- Tuân thủ OnPush + Signals pattern
- Không tạo `any` type

### `security-auditor` agent
**Mục đích:** Audit bảo mật tự động

**Triggers:**
- Trước mọi PR merge vào `main`
- Khi thêm route mới
- Khi thay đổi authentication logic

**Kiểm tra:**
- OWASP Top 10
- JWT implementation
- RBAC enforcement
- Data exposure trong API responses
- Dependency vulnerabilities

### `db-migrator` agent
**Mục đích:** Tạo migrations an toàn, không gây downtime

**Workflow:**
1. Phân tích schema change
2. Tạo migration file
3. Verify rollback strategy
4. Generate seed data update nếu cần

### `test-writer` agent
**Mục đích:** Viết tests tự động cho code hiện có

**Strategy:**
- Phân tích function/component
- Identify edge cases và error paths
- Viết tests theo AAA pattern (Arrange, Act, Assert)
- Đảm bảo >80% coverage

### `content-seeder` agent
**Mục đích:** Tạo bài học mẫu cho từng môn/cấp độ

**Input:** Môn học, lớp, chủ đề, số lượng bài

**Output:** Seed data SQL hoặc Prisma seed script

---

## Workflows

### `new-feature` workflow
```
1. Tạo branch: feat/<module>/<feature-name>
2. Chạy agent `feature-builder` với mô tả tính năng
3. Review generated code
4. Chạy `/security-review`
5. Chạy `/test-coverage`
6. Commit theo conventional commits
7. Tạo PR với template chuẩn
8. CI pipeline: lint → test → build → security scan
9. Code review bởi ít nhất 1 người
10. Merge vào `develop`
```

### `hotfix` workflow
```
1. Tạo branch: hotfix/<issue-description> từ `main`
2. Fix issue
3. Chạy `/security-review` nếu liên quan auth/data
4. Test tự động pass
5. Merge vào cả `main` và `develop`
6. Tag release
```

### `content-publish` workflow
```
1. CONTENT_CREATOR tạo draft
2. Hệ thống notify CONTENT_REVIEWER
3. CONTENT_REVIEWER review và comment/approve
4. Nếu approved → notify CONTENT_APPROVER
5. CONTENT_APPROVER publish hoặc schedule
6. Notify subscribers (email/in-app)
```

---

## Local Development Setup

### Prerequisites
- Docker Desktop
- Node.js 22 LTS
- pnpm 9+

### Khởi động môi trường

```bash
# Clone và setup
git clone <repo>
cd eduviet
cp .env.example .env

# Khởi động tất cả services
docker compose up -d

# Cài dependencies
pnpm install

# Run migrations + seed
pnpm db:migrate
pnpm db:seed

# Chạy dev servers
pnpm dev  # Chạy cả FE và BE song song
```

### Environment Variables (.env.example)

```bash
# Database
DATABASE_URL=postgresql://eduviet:secret@localhost:5432/eduviet_dev
SHADOW_DATABASE_URL=postgresql://eduviet:secret@localhost:5432/eduviet_shadow

# Redis
REDIS_URL=redis://localhost:6379

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

# SMS (ESMS.vn)
ESMS_API_KEY=
ESMS_SECRET_KEY=
ESMS_BRANDNAME=EduViet

# App
NODE_ENV=development
API_PORT=3000
FRONTEND_URL=http://localhost:4200
API_URL=http://localhost:3000
```

### Ports

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

### Các lệnh hay dùng

```bash
# Development
pnpm dev                    # Chạy FE + BE
pnpm dev:fe                 # Chỉ FE
pnpm dev:be                 # Chỉ BE

# Testing
pnpm test                   # Toàn bộ tests
pnpm test:fe                # Frontend tests
pnpm test:be                # Backend tests
pnpm test:e2e               # Cypress E2E

# Database
pnpm db:migrate             # Run pending migrations
pnpm db:migrate:create      # Tạo migration mới
pnpm db:seed                # Seed dữ liệu mẫu
pnpm db:reset               # Reset + reseed (dev only)
pnpm db:studio              # Mở Prisma Studio

# Code quality
pnpm lint                   # ESLint toàn bộ
pnpm format                 # Prettier format
pnpm typecheck              # TypeScript check

# Docker
pnpm docker:up              # docker compose up -d
pnpm docker:down            # docker compose down
pnpm docker:logs            # Xem logs
pnpm docker:reset           # Reset volumes (nguy hiểm!)
```

---

## Prisma Schema Conventions

```prisma
// Mỗi model phải có:
model ExampleModel {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")  // soft delete

  // Tên bảng snake_case
  @@map("example_models")
}
```

---

## API Response Format

```typescript
// Success
{
  "data": { ... },
  "meta": {               // cho list endpoints
    "total": 100,
    "page": 1,
    "perPage": 20,
    "totalPages": 5
  }
}

// Error
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bạn không có quyền truy cập tài nguyên này",
    "details": []         // validation errors nếu có
  }
}
```

---

## Bảo mật — Checklist bắt buộc

Trước mỗi PR merge, đảm bảo:

- [ ] Mọi route có `authenticate` middleware
- [ ] Mọi route có `authorize(roles)` decorator phù hợp
- [ ] Input validation bằng Zod schema
- [ ] Không log thông tin nhạy cảm (password, token, PII)
- [ ] Không expose internal error details cho client
- [ ] Rate limiting áp dụng cho auth endpoints
- [ ] File upload có kiểm tra MIME type và kích thước
- [ ] SQL queries dùng parameterized (Prisma đảm bảo)
- [ ] Audit log cho hành động CRUD trên dữ liệu nhạy cảm
- [ ] CORS chỉ cho phép origin đã whitelist

---

## Nguyên tắc phát triển

1. **Security first** — Mọi feature đều phải qua security review
2. **Type safety** — Không dùng `any`, shared types giữa FE và BE
3. **Test-driven** — Viết test trước hoặc song song với code
4. **Performance** — OnPush + Signals trên FE, index đúng trên DB
5. **Accessibility** — WCAG 2.1 AA cho UI components
6. **Flat design** — Tuân thủ design system Flat Illustration
7. **Vietnamese UX** — UI tiếng Việt, xử lý đúng UTF-8, locale VN
8. **Mobile first** — Responsive từ 320px trở lên
