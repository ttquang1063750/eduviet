# Active Task: Blog UX Improvements

## Mục tiêu
Cải thiện trải nghiệm người dùng trong trình soạn thảo Blog:
- Tự động gợi ý tags (autocomplete) dựa trên các tags đã có trong hệ thống.
- Tự động sinh slug từ tiêu đề bài viết (Slug auto-gen).
- Hiển thị preview slug để người dùng biết link bài viết.

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-10
Hoàn thành: 2026-05-10

## Steps
- [x] 1. [BE] Thêm phương thức `getPopularTags` vào `BlogRepository`
- [x] 2. [BE] Thêm phương thức `getTags` vào `BlogService`
- [x] 3. [BE] Thêm route `GET /api/blog/tags` vào `blog.routes.ts`
- [x] 4. [FE] Thêm phương thức `getTags()` vào `core/services/blog.service.ts`
- [x] 5. [FE] Cài đặt `MatAutocompleteModule` và `MatChipsModule` (nếu chưa có)
- [x] 6. [FE] BlogAdminEditor: Implement Slug auto-generation logic
- [x] 7. [FE] BlogAdminEditor: Implement Tag Autocomplete với MatAutocomplete & MatChips
- [x] 8. [FE] BlogAdminEditor: Thêm Slug Preview vào template

## Context quan trọng
- Backend dùng `unnest` trong raw SQL để đếm tags phổ biến.
- Frontend dùng `MatChips` cho tags và `debounceTime` cho slug generation.
- Tích hợp `@angular/material` prebuilt theme.

## Files đã tạo/sửa
- `apps/backend/src/modules/blog/blog.repository.ts`
- `apps/backend/src/modules/blog/blog.service.ts`
- `apps/backend/src/modules/blog/blog.routes.ts`
- `apps/frontend/src/app/core/services/blog.service.ts`
- `apps/frontend/package.json`
- `apps/frontend/angular.json`
- `apps/frontend/src/app/features/admin/blog/blog-admin-editor.component.ts`
- `apps/frontend/src/app/features/admin/blog/blog-admin-editor.component.html`
- `apps/frontend/src/app/features/admin/blog/blog-admin-editor.component.scss`

## Bước tiếp theo sau task này
P4 — Export reports PDF cải thiện font

