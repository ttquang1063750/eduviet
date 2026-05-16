# Active Task: i18n — Angular built-in (`@angular/localize`) Vietnamese + English

## Mục tiêu
Thêm internationalization cho FE với 2 ngôn ngữ:
- **vi** (default, source language — strings hiện tại đã là tiếng Việt)
- **en** (translation target)

Approach: Angular built-in `@angular/localize` (compile-time, multi-bundle).
- Mỗi locale = 1 build riêng → tốt cho SEO, performance tối ưu
- Routing: `/` cho vi (root), `/en/` cho en
- Language switcher: button trong layout → window.location redirect

## Trạng thái: IN_PROGRESS
Bắt đầu: 2026-05-16
Step hiện tại: 1 — Install `@angular/localize` package

## Phase 1: Infrastructure setup (steps 1-6)

- [ ] 1. Install `@angular/localize` + register
       `pnpm --filter @eduviet/frontend add @angular/localize`
       Thêm `import '@angular/localize/init'` vào `src/polyfills.ts` (hoặc main.ts nếu không có polyfills.ts)

- [ ] 2. `angular.json` — thêm i18n config
       ```json
       "i18n": {
         "sourceLocale": "vi",
         "locales": {
           "en": { "translation": "src/locale/messages.en.xlf", "baseHref": "/en/" }
         }
       }
       ```
       Build configurations: thêm `localize: true` cho production

- [ ] 3. `app.config.ts` — register locale data
       ```typescript
       import { registerLocaleData } from '@angular/common';
       import localeVi from '@angular/common/locales/vi';
       import localeEn from '@angular/common/locales/en';
       registerLocaleData(localeVi);
       registerLocaleData(localeEn);
       ```

- [ ] 4. `index.html` — `<html lang="vi">` (sẽ được Angular override per locale)

- [ ] 5. Tạo `LanguageSwitcherComponent` — `shared/components/language-switcher/`
       Material `mat-button-toggle-group` hoặc `mat-menu` với 2 option: 🇻🇳 Tiếng Việt / 🇬🇧 English
       Click → `window.location.href = '/en/' + currentPath` (hoặc `/`)
       Detect current locale: `LOCALE_ID` từ Angular DI

- [ ] 6. Inject `LanguageSwitcherComponent` vào `main-layout` + `blog-layout` (header area)

## Phase 2: Mark up templates với `i18n` attribute (steps 7-22)

Mỗi step = 1 folder/feature, thêm `i18n` attribute cho mọi text node + `i18n-<attr>` cho attributes (placeholder, aria-label, title).

- [ ] 7. `layout/` — main-layout.component.html + blog-layout/
       Sidebar nav items, footer, user menu

- [ ] 8. `shared/components/` — breadcrumb, confirm dialog, toast, drawing-canvas, geo-tree
       Common UI strings

- [ ] 9. `features/auth/` — login.component.html, register (nếu có)
       Form labels, errors, demo buttons

- [ ] 10. `features/dashboard/` — main dashboard cho user thường

- [ ] 11. `features/student-dashboard/` — dashboard học sinh

- [ ] 12. `features/lessons/` — list + detail (~3 files)

- [ ] 13. `features/classes/` — list + detail (~3 files)

- [ ] 14. `features/blog/` — list + detail + comment (~3 files)

- [ ] 15. `features/chat/` — widget + room-list + message-thread (~4 files)

- [ ] 16. `features/reports/` — dashboard + export controls

- [ ] 17. `features/admin/users/` — list + detail + create modal

- [ ] 18. `features/admin/schools/` — list + nested routes (~6 files)

- [ ] 19. `features/admin/classes/` — list + detail (~3 files)

- [ ] 20. `features/admin/lessons/` — list + editor + exercise-editor (~5 files)

- [ ] 21. `features/admin/questions/`, `features/admin/blog/`, `features/admin/subjects/`, `features/admin/content/`

- [ ] 22. Sanity check — grep mọi text chưa có `i18n` attribute
       `grep -rn ">" apps/frontend/src/app/features --include="*.html" | grep -v "i18n"` (heuristic)

## Phase 3: Extract + translate (steps 23-25)

- [ ] 23. `pnpm --filter @eduviet/frontend ng extract-i18n --output-path=src/locale`
       Generates `src/locale/messages.xlf` (XLIFF 1.2)

- [ ] 24. Copy `messages.xlf` → `messages.en.xlf`, dịch toàn bộ `<target>` từ tiếng Việt sang English
       Có thể dùng AI bulk translate hoặc dịch thủ công

- [ ] 25. Verify XLF — check tất cả `<target>` đã có nội dung, no XML errors
       Có thể dùng `xmllint --noout messages.en.xlf` nếu installed

## Phase 4: Build + deploy config (steps 26-28)

- [ ] 26. Build cả 2 locale: `pnpm --filter @eduviet/frontend ng build --localize`
       Output: `dist/frontend/vi/` + `dist/frontend/en/`

- [ ] 27. Update `docker/nginx/nginx.spa.conf` — routing:
       - `/` → vi (default)
       - `/en/` → en
       - SPA fallback per locale

- [ ] 28. Update `docker/frontend/Dockerfile` — multi-locale build + copy cả 2 outputs

## Phase 5: Verify (steps 29-30)

- [ ] 29. Test dev mode cho mỗi locale
       `pnpm --filter @eduviet/frontend ng serve --configuration=en` để xem English locally

- [ ] 30. Visual verify cuối cùng
       - Switcher hoạt động (vi ↔ en)
       - Date/number format theo locale (Angular DatePipe tự handle qua LOCALE_ID)
       - Plural (ICU) hiển thị đúng nếu có sử dụng
       - Không còn text tiếng Việt hardcoded trong bundle en

## Context quan trọng

### Quyết định thiết kế
- **Default locale = vi** (source) — templates hiện đang viết bằng tiếng Việt, không cần dịch source
- **URL routing**: `https://eduviet.vn/` (vi) vs `https://eduviet.vn/en/`
- **Switcher**: redirect URL (không runtime switch) — Angular built-in không support runtime switch trực tiếp
- **i18n ID strategy**: dùng `@@custom.id` cho strings tái sử dụng nhiều chỗ (vd `@@common.cancel`, `@@common.save`); auto-id cho strings unique

### i18n attribute patterns
```html
<!-- Text content -->
<h2 i18n="@@login.title">Chào mừng trở lại!</h2>

<!-- Attribute -->
<input i18n-placeholder="@@login.email.placeholder" placeholder="example@eduviet.vn" />

<!-- Plural (ICU) -->
<span i18n="@@lessons.count">
  {count, plural, =0 {Không có bài học} =1 {1 bài học} other {# bài học}}
</span>

<!-- Description for translator -->
<button i18n="Nút xoá|Hành động xoá item@@common.delete">Xoá</button>
```

### Gotchas
- Validation messages trong code .ts cần dùng `$localize` template tag, không phải `i18n` attribute
  ```typescript
  this.errorMessage.set($localize`:@@common.error:Đã có lỗi xảy ra`);
  ```
- Date/number formatting: Angular pipes (date, currency, number) tự dùng `LOCALE_ID` — không cần custom code
- `ConfirmService` + `ToastService` messages dynamic từ TS — cần `$localize`
- Build size: localize tăng build time 2x (2 builds). CI cần update build step.
- ng extract-i18n cần chạy mỗi khi thêm string mới → workflow: viết code → mark i18n → extract → translate → build

### CLI commands cheatsheet
- Extract: `ng extract-i18n --output-path=src/locale --format=xlf`
- Build all locales: `ng build --localize`
- Serve specific locale: `ng serve --configuration=en` (cần config trong angular.json)

## Files đã tạo/sửa
(Điền khi thực thi)

## Bước tiếp theo sau task này
- Setup workflow CI: auto-extract messages khi PR thay đổi templates (optional)
- I18n cho BE error messages (API responses) — phía BE chưa có, có thể làm task riêng
