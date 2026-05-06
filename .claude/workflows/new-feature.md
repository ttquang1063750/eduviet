---
name: new-feature
description: Workflow đầy đủ để thêm tính năng mới từ planning đến merge vào develop branch.
---

# New Feature Workflow

## Trigger
Khi cần thêm một tính năng mới vào hệ thống.

## Bước 1 — Planning (5-10 phút)
```bash
# Tạo branch mới từ develop
git checkout develop && git pull
git checkout -b feat/<module>/<feature-name>

# Ví dụ:
git checkout -b feat/lessons/interactive-drawing
```

Xác định:
- [ ] Entities và DB schema thay đổi
- [ ] API endpoints cần tạo/sửa
- [ ] Roles có quyền truy cập
- [ ] Angular components cần tạo
- [ ] Tests cần viết

## Bước 2 — Database Migration
```bash
# Cập nhật schema.prisma nếu cần
# Rồi chạy:
pnpm db:migrate:create -- --name <migration-name>
pnpm db:migrate
```

## Bước 3 — Backend Implementation
Dùng agent `feature-builder` hoặc tạo thủ công:
- Route với Zod validation
- Service với business logic
- Repository với Prisma queries
- Export và register trong main router

## Bước 4 — Frontend Implementation
- Angular feature module (standalone, OnPush, Signals)
- HTTP service
- Route guards
- Lazy route registration

## Bước 5 — Tests
```bash
# Chạy tests khi đang code
pnpm test:be --watch
pnpm test:fe --watch
```

Coverage targets:
- Services: >90%
- Routes: >80%
- Components: >75%

## Bước 6 — Security & Quality Check
```bash
# Lint
pnpm lint

# Type check
pnpm typecheck

# Tests đầy đủ
pnpm test

# Security review (dùng agent security-auditor)
```

Checklist bảo mật:
- [ ] Authenticate middleware trên mọi route
- [ ] Authorize với đúng roles
- [ ] Input validation đầy đủ
- [ ] Không expose sensitive data

## Bước 7 — Commit & Push
```bash
# Conventional commits
git add <specific-files>
git commit -m "feat(<module>): <mô tả ngắn gọn>"

git push origin feat/<module>/<feature-name>
```

## Bước 8 — Pull Request
PR template:
```markdown
## Tính năng
[Mô tả tính năng]

## Thay đổi
- [ ] Database migration: <migration-name>
- [ ] Backend: <endpoints mới>
- [ ] Frontend: <components mới>
- [ ] Tests: <coverage %>

## RBAC
Roles có quyền: <list roles>

## Security Checklist
- [ ] Authenticate middleware
- [ ] Authorize decorator
- [ ] Input validation
- [ ] No sensitive data exposure

## Test Plan
[Cách test tính năng]
```

## Bước 9 — CI Pipeline
Tự động chạy khi tạo PR:
- lint → typecheck → test:be → test:fe → build → security-scan

## Bước 10 — Code Review & Merge
- Ít nhất 1 reviewer approve
- CI pipeline phải pass
- Security issues phải resolve
- Merge vào `develop` (squash merge)
