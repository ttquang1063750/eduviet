# Active Task: Admin UI — Geo Tree + Subjects + Blog Editor

## Mục tiêu
Implement 3 subsystems theo spec: `docs/superpowers/specs/2026-05-09-admin-ui-tree-subjects-blog-design.md`

## Trạng thái: IN_PROGRESS
Bắt đầu: 2026-05-09
Step hiện tại: 4

## Steps

### Backend
- [x] 1. **Geo Routes** — `GET /api/nations`, `/api/provinces?nationId=`, `/api/districts?provinceId=`
- [x] 2. **Subjects CRUD Routes** — POST/PUT/DELETE + `GET /api/subjects/suggest?code=`
- [x] 3. **Users schoolId filter** — thêm query param `schoolId` vào `GET /api/users`

### Frontend Shared
- [ ] 4. **`<app-geo-tree>` component** — 3 file, OnPush, signals, lazy-load children, RBAC scoping

### Frontend Feature Enhancements
- [ ] 5. **Schools admin sidebar** — tích hợp geo-tree vào `/admin/schools`
- [ ] 6. **Classes admin pickers** — school picker + HOMEROOM_TEACHER picker filtered by school
- [ ] 7. **Subjects admin** — list + modal CRUD + auto-suggest button
- [ ] 8. **Blog admin list** — `/admin/blog` list view với filter status
- [ ] 9. **Blog admin editor** — Quill.js WYSIWYG + metadata panel + Draft/Review workflow

### Wiring
- [ ] 10. **Routes + Sidebar** — thêm lazy routes + 2 link sidebar trong MainLayout

## Context quan trọng
- Spec: `docs/superpowers/specs/2026-05-09-admin-ui-tree-subjects-blog-design.md`
- Approach 2: shared component + enhance existing routes
- Teacher picker: `GET /api/users?role=HOMEROOM_TEACHER&schoolId=<id>`
- Blog editor: ngx-quill (cần `pnpm add ngx-quill quill @types/quill`)
- RBAC geo-tree: SUPER_ADMIN=Nation, PROVINCE_ADMIN=Province, DISTRICT_ADMIN=District, SCHOOL_ADMIN=skip

## Files đã tạo/sửa
