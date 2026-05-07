---
description: Cập nhật CLAUDE.md và .claude/PROGRESS.md để phản ánh đúng trạng thái hiện tại của dự án.
---

Hãy quét codebase và cập nhật tài liệu theo các bước sau:

## Cấu trúc docs

```
CLAUDE.md                    ← Index + trạng thái + backlog + patterns (SLIM)
docs/tech-stack.md           ← Tech stack (ít thay đổi)
docs/architecture.md         ← Architecture + folder structure
docs/coding-standards.md     ← Angular, Fastify, DB, Testing, Git
docs/rbac.md                 ← Roles, geo hierarchy, content workflow
docs/features.md             ← Feature descriptions + trạng thái
docs/dev-setup.md            ← Local setup, env vars, ports, commands
docs/security.md             ← Security checklist + principles
docs/api-conventions.md      ← API format, Prisma conventions
.claude/PROGRESS.md          ← Tracker chi tiết + backlog đầy đủ
```

## Bước 1 — Quét trạng thái thực tế

Dùng Glob/Bash để kiểm tra file nào đã tồn tại:
- `apps/backend/src/modules/*/` — liệt kê modules và các file (routes, service, repository, spec)
- `apps/frontend/src/app/features/*/` — liệt kê features và components
- `packages/` và `libs/` — liệt kê packages đã tạo
- `docker/`, `docker-compose*.yml` — infrastructure files

## Bước 2 — Cập nhật CLAUDE.md

Tìm section `## Trạng thái hiện tại` trong CLAUDE.md và cập nhật:
- Bảng Backend modules (Routes/Service/Repository/Tests — ✅ hoặc —)
- Bảng Frontend features (List/Detail/Service/Routes)
- Danh sách Packages & Infrastructure đã tạo
- Danh sách `🚧 Còn lại` — xóa những thứ đã làm xong, giữ những thứ chưa làm
- Cập nhật ngày tháng

**Không chạm vào:** bảng tài liệu, section Patterns, phần còn lại của file.

## Bước 3 — Cập nhật .claude/PROGRESS.md

Cập nhật toàn bộ file với:
- Danh sách đầy đủ files đã tạo (scan thực tế từ filesystem)
- Backlog còn lại với priority rõ ràng
- Known issues / tech debt mới phát hiện
- Ngày cập nhật

## Bước 4 — Cập nhật docs/ nếu cần

Chỉ cập nhật các file trong `docs/` khi có thay đổi thực sự liên quan:
- `docs/features.md` — khi tính năng mới hoàn thành
- `docs/rbac.md` — khi thêm role hoặc thay đổi permission
- `docs/coding-standards.md` — khi có pattern mới được thiết lập

## Lưu ý

- Chỉ ghi những gì THỰC SỰ tồn tại trên filesystem — không đoán mò
- Giữ nguyên "Patterns bắt buộc" trong CLAUDE.md nếu không có thay đổi kiến trúc
- Giữ nguyên "Architectural Decisions" trong PROGRESS.md
