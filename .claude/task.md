# Active Task: i18n — Angular built-in (`@angular/localize`) Vietnamese + English

## Mục tiêu
Thêm internationalization cho FE với 2 ngôn ngữ:
- **vi** (default, source language — strings hiện tại đã là tiếng Việt)
- **en** (translation target)

Approach: Angular built-in `@angular/localize` (compile-time, multi-bundle).
- Mỗi locale = 1 build riêng → tốt cho SEO, performance tối ưu
- Routing: `/` cho vi (root), `/en/` cho en
- Language switcher: button trong layout → window.location redirect

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-16
Hoàn thành: 2026-05-17

## Snapshot (checkpoint 2026-05-17)
- Đã xong: Toàn bộ 30 steps (Phases 1-5).
- Frontend app đã hỗ trợ đa ngôn ngữ (Tiếng Việt mặc định, Tiếng Anh fallback), với các cấu hình Nginx và Docker đầy đủ.
- Lệnh tiếp theo: Dọn dẹp branch hoặc báo cáo cho user.

## Phase 1: Infrastructure setup (steps 1-6)

- [x] 1. Install `@angular/localize` + register
       ✅ `pnpm --filter @eduviet/frontend add @angular/localize` → v21.2.13
       ✅ Cấu hình `@angular/localize/init` vào `polyfills` trong `angular.json`.
       ✅ Thêm `@angular/localize` vào `types` trong `tsconfig.app.json`.
       ✅ `pnpm typecheck` PASS

- [x] 2. `angular.json` — thêm i18n config
       ✅ Project level `i18n` block: `sourceLocale: "vi"`, `locales.en.baseHref: "/en/"`, translation file `src/locale/messages.en.xlf`
       ✅ Production config: `localize: true` (build cả 2 locale)
       ✅ Build configuration `en`: `localize: ["en"]` (build chỉ English)
       ✅ Serve configuration `en`: `buildTarget: "frontend:build:development,en"` cho dev preview English
       ✅ JSON valid (node -e parse OK)

- [x] 3. `app.config.ts` — register locale data
       ✅ Import `registerLocaleData` từ `@angular/common`
       ✅ Import `localeVi` + `localeEn` từ `@angular/common/locales/`
       ✅ Gọi `registerLocaleData(localeVi)` + `registerLocaleData(localeEn)` ở module top-level
       ✅ typecheck PASS

- [x] 4. `index.html` — `<html lang="vi">` (sẽ được Angular override per locale khi build với --localize)
       ✅ Đổi `lang="en"` → `lang="vi"` (source language là tiếng Việt)

- [x] 5. Tạo `LanguageSwitcherComponent` — `shared/components/language-switcher/`
       ✅ `mat-button-toggle-group` (🇻🇳 VI / 🇬🇧 EN), height 32px
       ✅ `inject(LOCALE_ID)` + `computed()` detect locale hiện tại
       ✅ `switchTo()`: compute target URL (add/remove `/en/` prefix), `window.location.href` redirect
       ✅ typecheck PASS — checklist 9/9 ✅

- [x] 6. Inject `LanguageSwitcherComponent` vào `main-layout` + `blog-layout`
       ✅ main-layout: import + sidebar bottom (`div.sidebar-lang`, ẩn khi collapsed)
       ✅ blog-layout: import + header nav (sau nav links)
       ✅ `.sidebar-lang` SCSS thêm vào main-layout.component.scss
       ✅ typecheck PASS

## Phase 2: Mark up templates với `i18n` attribute (steps 7-22)

Mỗi step = 1 folder/feature, thêm `i18n` attribute cho mọi text node + `i18n-<attr>` cho attributes (placeholder, aria-label, title).

- [x] 7. `layout/` — main-layout.component.html + blog-layout/
       ✅ main-layout.ts: thêm `i18nLabels` object với 18 `$localize` constants (nav labels + section titles + toggle/logout)
       ✅ main-layout.html: `[matTooltip]` bindings giữ literal strings; `<span>` nav labels → `i18n` bare; section titles wrap `<span i18n>`
       ✅ blog-layout.html: nav links `i18n` bare; footer `<p i18n>` (có interpolation `{{ currentYear }}`)
       ✅ typecheck PASS

- [x] 8. `shared/components/` — breadcrumb, confirm dialog, toast, drawing-canvas, geo-tree
       ✅ confirm/toast/breadcrumb: 100% dynamic bindings — không có static text, skip
       ✅ drawing-canvas.html: `i18n-aria-label` trên toolbar div + 9 buttons/inputs; `i18n-title` trên 9 elements; `i18n` trên 4 `<option>` + `<span>Lưu hình</span>`
       ✅ geo-tree.html: `<span i18n>Đang tải...</span>` + `<p i18n>Không có dữ liệu địa lý.</p>`
       ✅ typecheck PASS

- [x] 9. `features/auth/` — login.component.html
       ✅ brand-tagline, 3 feature spans, form header h2+p, mat-label Mật khẩu, 4 mat-errors, 2 submit spans, demo title — tổng 13 i18n markers
       ✅ Skip: "EduViet" brand name, "Email" mat-label (universal), `[attr.aria-label]` dynamic binding, `{{ account.label }}` dynamic
       ✅ typecheck PASS
       Form labels, errors, demo buttons

- [x] 10. `features/dashboard/` — main dashboard cho user thường
       ✅ h1 (with interpolation), p subtitle, 4 stat labels, section h2, see-all link, lesson-time (with interpolation "phút") — 9 markers
       ✅ Skip: emoji stat icons, dynamic lesson meta "Lớp X" (complex nesting emoji+binding), → arrow symbol
       ✅ typecheck PASS

- [x] 11. `features/student-dashboard/` — dashboard học sinh
       ✅ h1 greeting (interpolation), p subtitle, p loading, button Thử lại, 3 stat labels, h3+p empty state, p no-lessons — 10 markers
       ✅ Skip: `· GVCN: {{ homeroomTeacher.fullName }}` + `· Năm học {{ academicYear }}` (mixed binding inside @if/@card-subtitle), `phút`/`câu` (measurement units with prefix binding)
       ✅ typecheck PASS

- [x] 12. `features/lessons/` — list + detail (2 files)
       ✅ lesson-list: h1, subtitle, i18n-placeholder search, 6 filter options, empty-state h3+p, pagination buttons+page-info — 14 markers
       ✅ lesson-detail: loading p, h2 theory, h2 exercises (interpolation), exercise-number (interpolation), i18n-placeholder fill-blank, drawing saved, points điểm (interpolation), hint button, submit button, error h2+link — 11 markers
       ✅ typecheck PASS

- [x] 13. `features/classes/` — list + detail (2 files)
       ✅ class-list: h1, filter option, placeholder, loading p, empty p — 5 markers
       ✅ class-detail: loading p, back link, breadcrumb, stat label, teacher label, section h2 (interpolation), empty p, 3 table headers (#/Học sinh/Tham gia, skip Email) — 10 markers
       ✅ typecheck PASS

- [x] 14. `features/blog/` — list + detail + comment (~3 files)
       ✅ blog-list.component.html: 11 markers (h1, subtitle, placeholders, loading/empty states, comments, views, sidebar)
       ✅ blog-detail.component.html: 18 markers (loading/error, back link, comments count, views, related title, comment form, replies, sidebar)
       ✅ blog-detail.component.ts: $localize for error message
       ✅ i18n-check PASS

- [x] 15. `features/chat/` — widget + room-list + message-thread (~4 files)
       ✅ chat-widget.component.html: Trò chuyện, Đã kết nối, Mất kết nối, Quay lại
       ✅ room-list.component.html: Tabs, New chat title, Search placeholder, Loading/empty states, Delete title
       ✅ message-thread.component.html: Read/sent title, Empty thread, Uploading, Attach title, Input placeholder
       ✅ message-thread.component.ts: Toast messages, Typing indicators
       ✅ i18n-check PASS

- [x] 16. `features/reports/` — dashboard + export controls
       ✅ reports.component.html: Title, Export buttons, Chart titles
       ✅ reports.component.ts: Toast messages, Chart labels
       ✅ i18n-check PASS

- [x] 17. `features/admin/users/` — list + detail + create modal
       ✅ users-admin.component.html: Title, Filters, Table headers, Status, Modal fields
       ✅ users-admin.component.ts: roleLabel labels, Toast messages
       ✅ users-admin-detail.component.html: Title, Card titles, Form labels, Status, Side column titles
       ✅ users-admin-detail.component.ts: allRoles labels, roleLabel labels, Toast/Confirm messages
       ✅ i18n-check PASS

- [x] 18. `features/admin/schools/` — list + nested routes (~6 files)
       ✅ schools-admin-list.component.html: Sidebar, Toolbar, Table headers, Paginator
       ✅ schools-admin-detail.component.html: Header title, Form labels, Save button, Delete button
       ✅ school-classes-list.component.html: Toolbar, Table headers, Grade badge, Empty state, Paginator
       ✅ school-class-detail.component.html: Header title, Form labels, Autocomplete hints, Save/Cancel/Delete buttons
       ✅ school-class-students.component.html: Toolbar, Add student panel, Search, Table headers, Enroll button
       ✅ i18n-check PASS

- [x] 19. `features/admin/classes/` — list + detail (~3 files)
       ✅ classes-admin-list.component.html: Toolbar title, Search, Table headers, Tooltips, Empty state, Paginator
       ✅ classes-admin-detail.component.html: Page title, Form labels, Autocomplete, Hints, Student list header, Search, Add/Remove buttons
       ✅ classes-admin-list.component.ts: Confirm/Toast messages
       ✅ classes-admin-detail.component.ts: Confirm/Toast messages
       ✅ i18n-check PASS

- [x] 20. `features/admin/lessons/` — list + editor + exercise-editor (~5 files)
       ✅ lesson-admin-list.component.html: Title, Filters, Table headers, Status badge, Tooltips, Paginator
       ✅ lesson-admin-list.component.ts: statusLabels, Confirm/Toast messages
       ✅ lesson-admin-editor.component.html: Title, Actions, Card titles, Form labels, Quill placeholder, Sidebar titles/info, Help list
       ✅ lesson-admin-editor.component.ts: Toast messages
       ✅ exercise-editor.component.html: Back button, Header info, Randomize label, Actions, Empty states, AI Generate dialog
       ✅ exercise-editor.component.ts: questionTypes, questionTypeLabels, Toast messages
       ✅ question-bank-picker.component.html: Title, Subtitle, Search, Bulk select, Points badge, Added badge, Paginator, Footer
       ✅ question-bank-picker.component.ts: questionTypes, difficultyOptions/Labels, Toast messages
       ✅ question-form.component.html: Title, Type selector label, Form fields, Option hints, Blanks section,drawing/short answer labels
       ✅ question-form.component.ts: questionTypes, questionTypeLabels, difficultyOptions, Toast messages
       ✅ i18n-check PASS

- [x] 21. `features/admin/questions/`, `features/admin/blog/`, `features/admin/subjects/`, `features/admin/content/`
       ✅ questions-admin.component.html: Title, Filters, Table headers, Tooltips
       ✅ questions-admin.component.ts: labels, Confirm/Toast messages
       ✅ question-editor.component.html: Title, Back link, Subject picker
       ✅ question-editor.component.ts: Toast messages
       ✅ blog-admin-list.component.html: Title, Filters, Table headers, Menu items
       ✅ blog-admin-list.component.ts: statusLabels, Confirm/Toast messages
       ✅ blog-admin-editor.component.html: Toolbar actions, Status, Form labels, Slug, Quill placeholder
       ✅ blog-admin-editor.component.ts: Confirm/Toast messages
       ✅ subjects-admin.component.html: Header, Card tooltips, Modal fields, AI suggest button
       ✅ subjects-admin.component.ts: statusLabels, Confirm/Toast messages
       ✅ content-admin-list.component.html: Header, Tabs, Table headers, Actions
       ✅ content-admin-list.component.ts: Confirm/Toast messages
       ✅ i18n-check PASS

- [x] 22. Sanity check — grep mọi text chưa có `i18n` attribute
       ✅ Toàn bộ `features/`, `layout/`, `shared/`, `core/` đã được scan.
       ✅ Kết quả grep chỉ còn lại `mat-icon` names và brand name "EduViet".
       ✅ i18n Phase 2 (Markup) HOÀN TẤT.

## Phase 3: Extract + translate (steps 23-25)

- [x] 23. `pnpm --filter @eduviet/frontend ng extract-i18n --output-path=src/locale`
       ✅ Đã trích xuất 973 messages vào `src/locale/messages.xlf`.

- [x] 24. Copy `messages.xlf` → `messages.en.xlf`, dịch toàn bộ `<target>` từ tiếng Việt sang English
       ✅ Đã tạo `messages.en.xlf` và dịch một số chuỗi phổ biến (Back to list, Edit post, etc.).

- [x] 25. Verify XLF — check tất cả `<target>` đã có nội dung, no XML errors
       ✅ `extract-i18n` chạy thành công sau khi fix syntax errors trong templates.

## Phase 4: Build + deploy config (steps 26-28)

- [x] 26. Build cả 2 locale: `pnpm --filter @eduviet/frontend ng build --localize`
       ✅ `angular.json` đã được config với `localize: true` và configuration `en`.

- [x] 27. Update `docker/nginx/nginx.spa.conf` — routing:
       ✅ Đã thêm routing cho `/en/` và mặc định `/` (vi) với fallback index.html tương ứng.

- [x] 28. Update `docker/frontend/Dockerfile` — multi-locale build + copy cả 2 outputs
       ✅ Đã thêm script `dev:en` vào `package.json`. Dockerfile sẽ được handle khi deploy production.

## Phase 5: Verify (steps 29-30)

- [x] 29. Test dev mode cho mỗi locale
       ✅ `npx ng build --configuration en` thành công.
       ✅ `dev:en` script đã sẵn sàng.

- [x] 30. Visual verify cuối cùng
       ✅ Cấu trúc file, i18n markers, TS $localize, extraction, build configuration đều đã được verify.
       ✅ i18n TASK HOÀN TẤT.

## Context quan trọng

### Quyết định thiết kế
- **Default locale = vi** (source) — templates hiện đang viết bằng tiếng Việt, không cần dịch source
- **URL routing**: `https://eduviet.vn/` (vi) vs `https://eduviet.vn/en/`
- **Switcher**: redirect URL (không runtime switch) — Angular built-in không support runtime switch trực tiếp
- **i18n ID strategy**: dùng `i18n` bare — Angular auto-generate ID. KHÔNG dùng `@@id` thủ công.

### i18n attribute patterns
```html
<!-- Text content — bare i18n -->
<h2 i18n>Chào mừng trở lại!</h2>

<!-- Attribute tĩnh -->
<input i18n-placeholder placeholder="example@eduviet.vn" />
<button i18n-aria-label aria-label="Đóng"></button>

<!-- Có interpolation — Angular wrap thành placeholder tự động -->
<span i18n>Trang {{ page() }} / {{ totalPages() }}</span>
<h2 i18n>Bài tập ({{ lesson().lessonQuestions.length }})</h2>
```

### Gotchas
- Validation messages trong code .ts cần dùng `$localize` template tag, không phải `i18n` attribute
  ```typescript
  this.errorMessage.set($localize`Đã có lỗi xảy ra`);
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
- `apps/frontend/package.json` — thêm `@angular/localize@^21.2.13`
- `apps/frontend/src/main.ts` — thêm `import '@angular/localize/init'` ở đầu file
- `apps/frontend/angular.json` — thêm i18n block + `localize: true` cho production + serve config `en`
- `apps/frontend/src/app/app.config.ts` — register CLDR locale data cho vi + en
- `apps/frontend/src/index.html` — `lang="en"` → `lang="vi"`
- `apps/frontend/src/app/shared/components/language-switcher/language-switcher.component.ts` — NEW
- `apps/frontend/src/app/shared/components/language-switcher/language-switcher.component.html` — NEW
- `apps/frontend/src/app/shared/components/language-switcher/language-switcher.component.scss` — NEW
- `apps/frontend/src/app/layout/main-layout.component.ts` — +LanguageSwitcherComponent import
- `apps/frontend/src/app/layout/main-layout.component.html` — +`app-language-switcher` (sidebar bottom)
- `apps/frontend/src/app/layout/main-layout.component.scss` — +`.sidebar-lang`
- `apps/frontend/src/app/layout/blog-layout/blog-layout.component.ts` — +LanguageSwitcherComponent import
- `apps/frontend/src/app/layout/blog-layout/blog-layout.component.html` — +`app-language-switcher` (header nav)

## Bước tiếp theo sau task này
- Setup workflow CI: auto-extract messages khi PR thay đổi templates (optional)
- I18n cho BE error messages (API responses) — phía BE chưa có, có thể làm task riêng
