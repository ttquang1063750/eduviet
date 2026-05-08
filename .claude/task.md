# Active Task: Security items

## Trạng thái: COMPLETED
Hoàn thành: 2026-05-08

## Steps (tất cả hoàn thành)
- [x] 1. Thêm `sanitize-html` vào backend package.json
- [x] 2. Tạo `apps/backend/src/shared/utils/sanitize.ts` (sanitizeContent + sanitizeText)
- [x] 3. Wire sanitize vào `blog.service.ts` (create + update)
- [x] 4. Thêm `dompurify` + `@types/dompurify` vào frontend package.json
- [x] 5. Tạo `apps/frontend/src/app/shared/pipes/safe-html.pipe.ts`
- [x] 6. Wire SafeHtmlPipe vào blog-detail.component (innerHTML)
- [x] 7. Register `@fastify/csrf-protection` trong main.ts, thêm /csrf-token endpoint, bảo vệ /refresh + /logout
- [x] 8. Email welcome + verify trigger → đã có sẵn trong auth.service.ts (không cần thêm)

## Files đã tạo/sửa
- apps/backend/package.json (+sanitize-html, @fastify/csrf-protection)
- apps/frontend/package.json (+dompurify, @types/dompurify)
- apps/backend/src/shared/utils/sanitize.ts (MỚI)
- apps/backend/src/modules/blog/blog.service.ts
- apps/frontend/src/app/shared/pipes/safe-html.pipe.ts (MỚI)
- apps/frontend/src/app/features/blog/components/blog-detail.component.ts
- apps/frontend/src/app/features/blog/components/blog-detail.component.html
- apps/backend/src/main.ts
- apps/backend/src/modules/auth/auth.routes.ts

## Sau task này
→ Tech debt còn lại (thấp ưu tiên): pgcrypto PII fields, Dependabot
