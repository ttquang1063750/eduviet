# EduViet — Bảo mật

> **Ưu tiên cao nhất trong dự án.**

## Checklist bắt buộc trước mỗi PR merge

- [ ] Mọi route có `authenticate` middleware
- [ ] Mọi route có `authorize(roles)` với đúng roles
- [ ] Input validation bằng Zod schema
- [ ] Không log thông tin nhạy cảm (password, token, PII)
- [ ] Không expose internal error details cho client (dùng `AppError`)
- [ ] Rate limiting áp dụng cho auth endpoints
- [ ] File upload có kiểm tra MIME type và kích thước tối đa
- [ ] SQL queries dùng parameterized (Prisma đảm bảo)
- [ ] Audit log cho hành động CRUD trên dữ liệu nhạy cảm
- [ ] CORS chỉ cho phép origin đã whitelist

## Nguyên tắc phát triển

1. **Security first** — Mọi feature đều phải qua security review trước khi merge
2. **Type safety** — Không dùng `any`, shared types giữa FE và BE
3. **Test-driven** — Viết test trước hoặc song song với code
4. **Performance** — OnPush + Signals trên FE, index đúng trên DB
5. **Accessibility** — WCAG 2.1 AA cho UI components
6. **Flat design** — Tuân thủ design system Flat Illustration
7. **Vietnamese UX** — UI tiếng Việt, xử lý đúng UTF-8, locale VN
8. **Mobile first** — Responsive từ 320px trở lên

## Các biện pháp bảo mật đã implement

- **HTTPS** bắt buộc (Nginx SSL, TLS 1.2/1.3)
- **Helmet.js** — security headers
- **Rate limiting** — `@fastify/rate-limit`, per-route cho auth endpoints (max 5/15 phút)
- **JWT** — Access Token 15m (memory) + Refresh Token 7d (httpOnly cookie)
- **CORS** — chỉ cho phép origins trong `CORS_ORIGINS` env
- **Audit trail** — `writeAuditLog()` cho mọi hành động CRUD nhạy cảm
- **Soft delete** — không xóa dữ liệu quan trọng trực tiếp
- **bcrypt** — hash passwords
- **Prisma parameterized queries** — SQL injection prevention
- **`SecurityContext.NONE` scoped** — chỉ cho markdown rendering với KaTeX
- **CSRF protection** — `@fastify/csrf-protection` bảo vệ `/auth/refresh` + `/auth/logout` (httpOnly cookie endpoints); JWT Bearer routes tự miễn nhiễm
- **XSS defense in depth** — `sanitize-html` (BE) strip HTML trước khi lưu DB; `DOMPurify` (FE, `safe-html.pipe.ts`) strip trước khi render — 2 lớp độc lập

## Checklist PR mở rộng

- [ ] Route có `preHandler: [authenticate]` hoặc `optionalAuthenticate` nếu public
- [ ] Route mutation của cookie (refresh/logout) phải có `app.csrfProtection`
- [ ] Blog content đi qua `sanitizeContent()` trước khi INSERT/UPDATE
- [ ] FE render HTML user-generated dùng `| safeHtml` pipe (không dùng `[innerHTML]` thô)

## Chưa implement

- pgcrypto cho PII fields (email, phone) — mã hóa at-rest trong DB
- Dependency scanning (Dependabot) — `.github/dependabot.yml`
