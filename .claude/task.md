# Active Task: Fix CI/CD trên GitHub — Prisma generate missing

## Mục tiêu
CI hiện đang FAIL trên main + tất cả PR dependabot. Root cause: **`prisma generate` không chạy trong CI** → Prisma client types (`Prisma.XxxSelect`, `Prisma.Sql`, `SubjectCode` enum...) không tồn tại → ~50 lỗi TypeScript trong `pnpm build` job.

Phụ: 1 lỗi nhỏ `'LESSON_REVIEWER_ASSIGNED'` thiếu trong `AuditAction` enum.

## Trạng thái: IN_PROGRESS
Bắt đầu: 2026-05-16
Step hiện tại: 6 — Commit + push, trigger CI

## Steps

- [x] 1. `package.json` (root) — thêm `"postinstall": "pnpm --filter @eduviet/prisma generate"`
       Lý do: chạy tự động sau `pnpm install` ở cả local + CI + Docker build, DRY hơn là sửa từng workflow.

- [x] 2. `apps/backend/src/shared/utils/audit.ts` — thêm `'LESSON_REVIEWER_ASSIGNED'` vào union `AuditAction`
       Đặt sau `'LESSON_REJECTED'` trong nhóm "Lesson lifecycle".

- [x] 3. Local verify — chạy `pnpm install && pnpm typecheck`
       ✅ `pnpm install` chạy postinstall → Prisma Client generated
       ✅ ~50 lỗi từ Prisma types biến mất
       ⚠️ Phát hiện 4 lỗi còn sót (không phải do Prisma):
         - `users.routes.ts:131` — `title: string | null` không assignable cho `UpdateUserData.title: string | undefined`
         - 3× email-templates `.tsx` files — BE tsconfig thiếu `"jsx"` setting → `TS6142: '--jsx' is not set`

- [x] 4. Fix 4 lỗi còn sót:
       ✅ `users.service.ts` — `UpdateUserData.title: string | null` (cho phép clear field bằng null)
       ✅ `apps/backend/tsconfig.json` — thêm `"jsx": "preserve"` để tsc không fail khi follow .tsx import
       ✅ `pnpm typecheck` PASS, `pnpm build` PASS

- [x] 5. `.github/workflows/ci.yml` — review xem có cần explicit `prisma generate` step
       Kết luận: KHÔNG cần. Lý do:
       - `pnpm install` mặc định chạy lifecycle scripts (incl. postinstall) — chỉ `--ignore-scripts` mới skip, CI không dùng
       - `cache: pnpm` ở setup-node v4 cache pnpm store, không cache node_modules → postinstall chạy mỗi job
       - Lean code: nếu sau này fail thì thêm explicit step chỉ tốn 30 giây

- [ ] 6. Commit + push lên branch hiện tại (`claude/elastic-dijkstra-c105e3`)
       Tạo PR draft → GitHub auto-trigger CI → verify all jobs ✅ green.

- [ ] 7. Nếu CI xanh → merge PR vào main + đóng task.

## Context quan trọng

### Root cause analysis
- `pnpm install` KHÔNG tự chạy `prisma generate` (libs/prisma không có postinstall script)
- CI workflow chỉ làm `pnpm install` → nhảy thẳng vào `pnpm build` → TypeScript compile fail vì `node_modules/.prisma/client` chưa được generate
- Hiện tại Docker build (deploy.yml) cũng có thể gặp lỗi tương tự — cần verify, nhưng deploy chỉ chạy trên push to main và chỉ build Docker images (Dockerfile có thể đã handle khác)

### Lỗi đã thấy trong CI log (run 25723450837 + 25723553610)
```
TS2694: Prisma has no exported member 'BlogPostSelect'        ← prisma generate
TS2694: Prisma has no exported member 'UserSelect'             ← prisma generate
TS2694: Prisma has no exported member 'Sql'                    ← prisma generate
TS2305: '@prisma/client' has no exported member 'SubjectCode'  ← prisma generate
TS2339: 'sql' does not exist on type 'typeof Prisma'           ← prisma generate
TS7006: Parameter 'r' implicitly has 'any' type                ← prisma generate (queries return any)
TS2322: '"LESSON_REVIEWER_ASSIGNED"' not assignable to 'AuditAction'  ← step 2
TS1470: 'import.meta' not allowed in CommonJS                  ← ✅ đã fix (2af75ee)
TS2339: 'validation' does not exist on AppError                ← ✅ đã fix (2af75ee)
```

### Gotchas
- pnpm + monorepo: postinstall ở root chỉ chạy 1 lần sau khi resolve all workspaces — OK cho use case này
- Docker build BE (`docker/backend/Dockerfile`) — kiểm tra xem nó có `pnpm install` + `prisma generate` không, vì nếu cache layer của Docker hit nhưng schema đổi → có thể stale
- CI workflow hiện có 3 jobs riêng (lint/test/build) → mỗi job đều `pnpm install` lại từ đầu → postinstall sẽ run ở mỗi job (OK, không phải vấn đề về perf vì là task one-shot dưới đây)

## Files đã tạo/sửa
- `package.json` — thêm `postinstall` script chạy `prisma generate`
- `apps/backend/src/shared/utils/audit.ts` — thêm `LESSON_REVIEWER_ASSIGNED` vào `AuditAction` enum
- `apps/backend/src/modules/users/users.service.ts` — `UpdateUserData.title` cho phép `null` (clear field)
- `apps/backend/tsconfig.json` — thêm `"jsx": "preserve"` cho transitive imports từ email-templates `.tsx`

## Bước tiếp theo sau task này
Backlog hiện tại rỗng. Sau khi CI xanh:
- Có thể cân nhắc các enhancement đã đề xuất (security scan, deploy hardening, PR experience) — nhưng chỉ khi user yêu cầu.
