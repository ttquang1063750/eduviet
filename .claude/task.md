# Active Task: Bug Fixes Session 8

## Mục tiêu
Sửa các lỗi runtime phát sinh trong quá trình sử dụng.

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-10
Hoàn thành: 2026-05-10

## Steps
- [x] 1. Xóa `[katex]="true"` khỏi lesson-detail template (markedKatex đã xử lý)
- [x] 2. Xóa scripts CommonJS thừa khỏi angular.json (marked.umd.js, highlight.js/lib/index.js, katex.min.js)
- [x] 3. `[value]` → `[ngValue]` trên grade select trong classes-admin-detail
- [x] 4. Bỏ `(onContentChanged)` + `onContentChange()` trong blog editor (cursor fix)
- [x] 5. `getBySlug()` BE fallback UUID → `findById()` (blog editor load content)
- [x] 6. `getAll()` FE hardcode `status: 'PUBLISHED'` trên public blog list
- [x] 7. Quill image handler → upload MinIO (fix 413 base64 body too large)
- [x] 8. Register `@fastify/multipart` trong main.ts (fix 415)
- [x] 9. `ensurePublicReadPolicy('public')` trong storage plugin; key `public/uploads/` (fix ảnh broken)
- [x] 10. `onPublish()` auto-save trước khi đổi status

## Files đã tạo/sửa
- `apps/frontend/src/app/features/lessons/components/lesson-detail.component.html`
- `apps/frontend/angular.json` — scripts[] cleaned
- `apps/frontend/src/app/features/admin/classes/classes-admin-detail.component.html`
- `apps/frontend/src/app/features/admin/blog/blog-admin-editor.component.ts`
- `apps/frontend/src/app/features/admin/blog/blog-admin-editor.component.html`
- `apps/frontend/src/app/features/blog/components/blog-list.component.ts`
- `apps/backend/src/modules/blog/blog.service.ts`
- `apps/backend/src/modules/storage/storage.routes.ts`
- `apps/backend/src/main.ts`
- `apps/backend/src/plugins/storage.plugin.ts`
- `libs/storage/src/storage.service.ts`

## Bước tiếp theo
P4 — Blog UX: tag autocomplete, slug auto-gen
