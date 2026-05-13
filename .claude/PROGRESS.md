# EduViet — Progress Tracker

> Cập nhật lần cuối: 2026-05-12 (session 18 — Admin Refactor + Search Fix)
> Workflow: `/plan-task` → `/execute-step` (lặp) → `/check-point` → `/resume` → tiếp tục

---

## ✅ Đã hoàn thành

### Infrastructure & Shared

| File/Folder | Mô tả |
|-------------|-------|
| `docker-compose.yml` | Local dev: postgres, redis, minio, mailhog |
| `docker-compose.prod.yml` | Production: 2 API replicas, rolling update, resource limits |
| `docker/nginx/nginx.prod.conf` | SSL TLS 1.2/1.3, rate limit zones, SPA fallback |
| `docker/nginx/nginx.dev.conf` | Local dev proxy |
| `docker/minio/init-buckets.sh` | Tạo bucket + public-read `/public/` prefix |
| `docker/postgres/init.sql` | Khởi tạo DB |
| `dev-start.sh` | One-command dev setup |
| `libs/prisma/schema.prisma` | Full schema: User, Class, Lesson, Exercise, Blog, Chat, Notification, AuditLog |
| `libs/prisma/migrations/` | Initial migration |
| `libs/prisma/src/seed.ts` | Seed data mẫu |
| `packages/shared-types/src/` | lesson.types.ts, user.types.ts, auth.types.ts, common.types.ts, chat.types.ts, blog.types.ts, school.types.ts |
| `packages/shared-constants/src/` | roles.ts, content.ts, pagination.ts |
| `libs/redis/` | Redis (ioredis) wrapper, BullMQ queues (email, notification) |
| `libs/storage/` | StorageService: upload, getPresignedUrl, delete, getPublicUrl |
| `packages/email-templates/` | React Email templates: welcome.tsx, verify-email.tsx, reset-password.tsx |

### Backend (`apps/backend/src/`)

| File | Mô tả |
|------|-------|
| `main.ts` | Fastify bootstrap |
| `plugins/prisma.plugin.ts` | Prisma client plugin |
| `plugins/redis.plugin.ts` | Redis plugin |
| `plugins/socket.plugin.ts` | Socket.io v4, JWT auth, Redis adapter |
| `plugins/storage.plugin.ts` | fastify.decorate storage |
| `plugins/queues.plugin.ts` | BullMQ workers (email, notifications) |
| `shared/middleware/authenticate.ts` | JWT verify + authenticate + authorize() |
| `shared/middleware/optional-authenticate.ts` | optionalAuthenticate |
| `shared/utils/sanitize.ts` | sanitizeContent() + sanitizeText() |
| `shared/errors/app-error.ts` | AppError class |
| `shared/utils/audit.ts` | writeAuditLog() |
| `modules/auth/` | routes + service + schema |
| `modules/users/` | routes + service + repository + spec |
| `modules/lessons/` | routes + service + repository + spec |
| `modules/subjects/` | routes + service |
| `modules/schools/` | routes + service + repository |
| `modules/classes/` | routes + service + repository |
| `modules/blog/` | routes + service + repository |
| `modules/notifications/` | routes + service (BullMQ) |
| `modules/chat/` | routes + service + repository + gateway + spec |
| `modules/storage/storage.routes.ts` | POST /api/storage/upload |
| `assets/fonts/LiberationSans-*.ttf` | Font TTF nhúng PDF — 17/17 ký tự tiếng Việt |
| `plugins/storage.plugin.ts` | + `ensurePublicReadPolicy('public')` — tự set bucket policy khi start |
| `main.ts` | + `@fastify/multipart` register (file upload) |
| `modules/reports/` | routes + service + repository + **export Excel/PDF + font tiếng Việt (LiberationSans)** |
| `modules/blog/blog.service.ts` | `getBySlug()` fallback UUID → `findById()` |
| `modules/storage/storage.routes.ts` | key prefix `public/uploads/` (MinIO public read) |

### Frontend (`apps/frontend/src/app/`)

| File/Folder | Mô tả |
|-------------|-------|
| `app.config.ts` | zoneless, provideMarkdown, markedKatex |
| `app.routes.ts` | Lazy routes |
| `core/guards/auth.guard.ts` | — |
| `core/interceptors/auth.interceptor.ts` | — |
| `core/services/auth.service.ts` | — |
| `core/utils/http-error.ts` | `getApiErrorMessage()` helper cho catch blocks |
| `layout/main-layout.component.*` | Shell layout — sidebar 9 routes |
| `shared/components/breadcrumb/` | Dynamic breadcrumb |
| `shared/pipes/safe-html.pipe.ts` | DOMPurify + bypassSecurityTrustHtml |
| `shared/components/drawing-canvas/` | Konva.js canvas + `getInputValue()` helper |
| `features/auth/` | login (3 files) |
| `features/dashboard/` | Stats cards (3 files) |
| `features/lessons/` | list + detail (KaTeX + Konva) + `getInputValue()` helper |
| `features/classes/` | list + detail |
| `features/blog/` | list + detail + nested comments |
| `features/chat/` | ChatService (signals), chat-widget FAB, room-list, message-thread |
| `features/reports/` | Dashboard reports (Chart.js) + **nút Xuất Excel/PDF** (3 files, OnPush) |
| `features/admin/users/` | CRUD đầy đủ |
| `features/admin/schools/` | Schools CRUD (3 file, OnPush) |
| `features/admin/classes/` | Classes CRUD (3 file, OnPush) |
| `features/admin/content/` | Content moderation (3 file, OnPush) |

### ESLint ✅ COMPLETED (2026-05-09)

| File | Mô tả |
|------|-------|
| `apps/frontend/eslint.config.js` | ESLint 9 flat config — enforce OnPush, no-inline, no-any, prefer-control-flow |
| `apps/frontend/angular.json` | schematics mặc định: 3 file + OnPush; thêm lint target |
| `apps/frontend/package.json` | thêm `@angular-eslint/template-parser`, `@eslint/js` |
| `.claude/commands/execute-step.md` | Component Checklist 8 điểm bắt buộc |

### CI/CD ✅

| File | Mô tả |
|------|-------|
| `.github/workflows/ci.yml` | CI: lint + test + build |
| `.github/workflows/deploy.yml` | CD: GHCR + SSH deploy |

---

## Session 18 — Schools & Classes Admin Refactor: mat-table + nested routes (2026-05-12)

### Phase 1–7: Full Admin UI Refactor ✅

| File | Thay đổi |
|------|----------|
| `schools-admin-list.component.*` | mat-table, geo filter, 3 action buttons |
| `schools-admin-detail.component.*` | Edit school form only, navigation to classes |
| `school-classes-list.component.*` | mat-table classes per school, breadcrumb navigation |
| `school-class-detail.component.*` | Edit/create class form, school-scoped |
| `school-class-students.component.*` | mat-table students, add/remove panel with infinite scroll |
| `classes-admin-list.component.*` | mat-table global list, navigation to school-scoped detail |
| `schools-admin.routes.ts` | Nested routes structure |
| `classes.repository.ts` (BE) | **Fix**: Thêm hỗ trợ `search` filter cho Class list |
| `classes.routes.ts` (BE) | **Fix**: Update list schema to allow `search` |

### Route structure mới

```
/admin/schools                                  ← mat-table (edit/classes/delete)
/admin/schools/new                              ← create school
/admin/schools/:id                              ← edit school only
/admin/schools/:id/classes                      ← mat-table classes của trường
/admin/schools/:id/classes/new                  ← create class (schoolId auto)
/admin/schools/:id/classes/:classId             ← edit class only
/admin/schools/:id/classes/:classId/students    ← mat-table học sinh + add panel
```

### ✅ Tất cả P1–P7 đã hoàn thành (session 18)
Refactor Schools/Classes Admin to mat-table + nested routes.
Fix Class Search bug in BE+FE.

---

## 🚧 Backlog (theo độ ưu tiên)

- **Không còn backlog kỹ thuật tồn đọng.**

---

## 🐛 Known Issues / Tech Debt

1. **Vitest ARM64** — `@rollup/rollup-linux-arm64-gnu` missing trên Linux ARM64. CI dùng `ubuntu-latest` (x86).
2. **PDF font Vietnamese** — PDFKit dùng font mặc định, nội dung export bỏ dấu tiếng Việt.
3. **`authorize` không phải file riêng** — nằm chung `authenticate.ts`. Chấp nhận.
4. **Backend Type Errors** — `AppError.validation` và `AuditAction` mismatch phát hiện trong session 18.
5. **ESM/CJS conflict** — `import.meta` error in `reports.service.ts`.

---

## Session 19 — Bug Fix: Angular Material content projection (2026-05-13)

### 🐛 Fix: `@if` inside Material buttons → `[style.display]`

| File | Thay đổi |
|------|----------|
| `school-class-students.component.html` | Thay `@if` bên trong `<button mat-stroked-button>` và `<button mat-icon-button>` bằng `[style.display]` — fix Angular compiler warning `controlFlowPreventingContentProjection` |

**Root cause:** Angular Material dùng content projection để render icon/spinner bên trong button. Control flow `@if` chặn projection này, gây warning và có thể render sai.  
**Fix pattern:** Render cả hai element, dùng `[style.display]="condition ? '' : 'none'"` để ẩn/hiện.

---

## 🚧 Backlog mới (2026-05-13)

### P1 — UI Refactor: Breadcrumb + Shared SCSS + Angular Material

#### Vấn đề
- `BreadcrumbService` dùng `child.snapshot.data['breadcrumb']` → Angular kế thừa data từ route cha xuống mọi child route → sub-route `/admin/schools/:id/classes` tự inherit label 'Trường học' → sinh entry trùng trên main breadcrumb → các component con phải tự làm inline `<nav class="breadcrumb">` riêng để bù (xuất hiện 2 navigation cùng lúc).
- `.admin-card`, `.toolbar`, `.count-badge`, `.table-wrapper`, `.no-data-cell`, `.pagination`, `.form-card`, `.form-grid` bị copy-paste qua 5+ component SCSS.
- Nhiều element HTML thuần (`<div>`, `<nav>`, `<span>`) nên được thay bằng Angular Material component tương đương.

#### Steps (12 steps)

**Phase 1 — Fix BreadcrumbService**
- [ ] 1. `breadcrumb.service.ts` — đổi sang `child.snapshot.routeConfig?.data?.['breadcrumb']` (không kế thừa từ cha); cập nhật `getIcon()` map đủ routes trong `breadcrumb.component.ts`

**Phase 2 — Thêm breadcrumb data vào routes**
- [ ] 2. `schools-admin.routes.ts` — thêm `data: { breadcrumb: '...' }` cho tất cả 7 routes

**Phase 3 — Xóa inline nav, dùng BreadcrumbService.setLabel() cho dynamic labels**
- [ ] 3. `school-classes-list` (ts + html + scss) — inject BreadcrumbService, `setLabel('/admin/schools/:id', schoolName)` sau khi load; xóa `<nav class="breadcrumb">`
- [ ] 4. `school-class-detail` (ts + html + scss) — tương tự, setLabel school + class
- [ ] 5. `school-class-students` (ts + html + scss) — tương tự

**Phase 4 — Shared SCSS partial**
- [ ] 6. Tạo `src/app/styles/_admin-shared.scss` — extract: `.admin-card`, `.toolbar`, `.toolbar__*`, `.count-badge`, `.table-wrapper`, `.no-data-cell`, `.pagination`, `.form-card`, `.form-grid`
- [ ] 7. `schools-admin-list.component.scss` — `@use` partial, xóa duplicates
- [ ] 8. `school-classes-list.component.scss` — `@use` partial, xóa duplicates
- [ ] 9. `school-class-students.component.scss` — `@use` partial, xóa duplicates
- [ ] 10. `school-class-detail.component.scss` — `@use` partial, xóa duplicates
- [ ] 11. `classes-admin-list.component.scss` — `@use` partial, xóa duplicates
- [ ] 12. `schools-admin-detail.component.scss` — `@use` partial, xóa duplicates

**Phase 5 — Force replace elements bằng Angular Material**
- [ ] 13. Scan toàn bộ `features/admin/` — thay `<button>` thuần bằng `mat-button/mat-icon-button`, `<input>` bằng `<mat-form-field>+matInput`, `<select>` bằng `<mat-select>`, badge/chip bằng `mat-chip`/`mat-badge`, tooltip bằng `matTooltip`, progress bằng `mat-progress-bar`/`mat-spinner`
- [ ] 14. Scan `features/` (non-admin) — cùng pattern, ưu tiên form controls và action buttons

---

### P2 — Sidebar Collapsible: icon-only mode

#### Mô tả
Sidebar hiện tại luôn full-width. Cần thêm toggle:
- **Expanded** (default): width hiện tại, hiện đầy đủ icon + label + user info
- **Collapsed/min**: width = 80px, chỉ hiện icon của từng nav item, user avatar + chữ viết tắt tên (vd: "Nguyễn Văn A" → "NVA"), tooltip khi hover để xem full label
- Toggle button (hamburger/chevron) ở header sidebar
- State lưu vào `localStorage` để giữ qua reload

#### Files cần sửa
- `layout/main-layout.component.ts` — signal `sidebarCollapsed`, logic tạo initials từ fullName
- `layout/main-layout.component.html` — bind `[class.collapsed]`, ẩn/hiện label text, hiện initials thay username
- `layout/main-layout.component.scss` — `.sidebar` width transition, `.collapsed` overrides (width 80px, hide text, center icons)
- `core/utils/name-initials.ts` (mới) — pure function `getInitials(fullName: string): string` ("Nguyễn Văn A" → "NVA")

---

## Session 20 — UI Refactor: Breadcrumb + Shared SCSS (2026-05-13)

### Phase 1–4: Breadcrumb fix + SCSS de-duplication ✅

| File | Thay đổi |
|------|----------|
| `breadcrumb.service.ts` | Fix inheritance bug: `snapshot.data` → `routeConfig?.data` |
| `breadcrumb.component.ts` | Cập nhật `getIcon()` map đủ tất cả routes |
| `schools-admin.routes.ts` | Thêm `data: { breadcrumb }` cho 6 routes |
| `school-classes-list` (html+scss) | Xóa inline `<nav class="breadcrumb">`, thêm toolbar subtitle |
| `school-class-detail` (html+scss) | Xóa inline nav |
| `school-class-students` (html+scss) | Xóa inline nav, thêm toolbar subtitle "Lớp · Trường" |
| `styles/_admin-shared.scss` | Tạo mới — 10 pattern dùng chung (181 dòng) |
| `styles.scss` | Thêm global `.mat-mdc-header-cell` + `.mat-mdc-row:hover` |
| `schools-admin-list.component.scss` | `@use` partial, 172→65 dòng |
| `school-classes-list.component.scss` | `@use` partial, 173→52 dòng |
| `school-class-students.component.scss` | `@use` partial, 236→113 dòng |
| `school-class-detail.component.scss` | `@use` partial, 72→12 dòng |
| `classes-admin-list.component.scss` | `@use` partial, 189→87 dòng |
| `schools-admin-detail.component.scss` | `@use` partial, 65→7 dòng |

**Tổng:** ~550 dòng CSS duplicate đã xóa. Breadcrumb giờ hiện đúng context từ route data, không còn dual navigation.

### 🚧 Còn lại (Phase 5 — chưa làm)
- Step 13: `main-layout.component` → `mat-sidenav-container` + `mat-nav-list` + `mat-icon` (thay emoji)
- Step 14: Scan admin features, replace HTML element thuần bằng Angular Material
