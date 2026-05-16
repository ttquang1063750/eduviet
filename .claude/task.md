# Active Task: Login page — refactor sang Angular Material

## Mục tiêu
Thay tất cả form elements raw HTML (`<input>`, `<button>`, emoji icons) ở trang login bằng Angular Material 3 components để đồng nhất với rules UI/UX dự án (M3 high-density, mat-form-field outline, mat-icon thay emoji).

## Trạng thái: COMPLETED (code done — chờ user verify UX)
Bắt đầu: 2026-05-16
Hoàn thành: 2026-05-16

## Phạm vi

### Thay (raw → Material)
| Hiện tại | Material |
|---|---|
| `<input>` email + password | `mat-form-field appearance="outline"` + `matInput` |
| Toggle password button (🙈/👁️) | `mat-icon-button matSuffix` + `<mat-icon>visibility[_off]</mat-icon>` |
| Submit `<button class="btn-primary">` | `mat-flat-button color="primary"` |
| Spinner `<span class="spinner">` | `<mat-progress-spinner diameter="20" mode="indeterminate">` |
| Error alert `<div class="alert">` | mat-card error styling + `<mat-icon>warning</mat-icon>` |
| Demo `<button class="demo-btn">` | `mat-stroked-button` |
| Feature icons (📚✏️💬) | `<mat-icon>menu_book/edit/chat</mat-icon>` |
| Alert icon ⚠️ | `<mat-icon>warning</mat-icon>` |
| Field validation message | `<mat-error>` trong mat-form-field |

### Giữ nguyên
- Layout 2 panel (illustration + form)
- Brand logo SVG + decorative illustration SVG
- ReactiveFormsModule + signals (form, showPassword, errorMessage, isLoading)
- Demo accounts logic + 8 accounts
- Component.ts patterns (OnPush, inject, signals) — đã đúng rules

## Steps

- [x] 1. `login.component.ts` — thêm imports Material modules
       ✅ Thêm 5 imports: MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
       ✅ Đăng ký trong `imports[]` của @Component decorator

- [x] 2. `login.component.html` — refactor form fields (email + password)
       ✅ Email: `mat-form-field appearance="outline"` + `matInput` + 2× `mat-error` (required + email)
       ✅ Password: `mat-form-field` + `matInput` + `mat-icon-button matSuffix` với `visibility`/`visibility_off` icon
       ✅ Password errors: 2× `mat-error` (required + minlength)
       ✅ `isFieldInvalid()` method sẽ không còn dùng — Material auto-handle invalid state

- [x] 3. `login.component.html` — refactor submit button + spinner
       ✅ `mat-flat-button type="submit"` (M3 default = primary, không cần `color="primary"`)
       ✅ Loading: `<mat-progress-spinner diameter="20" mode="indeterminate" />` + text
       ✅ Giữ `[disabled]="form.invalid || isLoading()"`

- [x] 4. `login.component.html` — refactor error alert + demo buttons + feature icons
       ✅ Error alert: `<mat-icon class="alert-icon">warning</mat-icon>` thay ⚠️
       ✅ Demo: 8× `<button mat-stroked-button type="button">` thay raw `.demo-btn`
       ✅ Feature icons: `menu_book`, `edit`, `chat` thay 📚 ✏️ 💬

- [x] 5. `login.component.scss` + cleanup `login.component.ts`
       ✅ Xoá dead CSS: `.form-group`, `.form-label`, `.form-input`, `.field-error`, `.input-wrapper`, `.toggle-password`, `.btn-primary`, `.spinner`, `@keyframes spin`, `.demo-btn` (raw style), `.demo-role`
       ✅ Apply theme tokens: form-header h2 → `var(--mat-sys-primary)`, alert-error → error-container tokens, demo-title → on-surface-variant, demo-accounts border → outline-variant
       ✅ Resize: `.feature-icon` + `.alert-icon` thêm `width`+`height` 1.25rem cho mat-icon
       ✅ Mới: `.submit-btn` (full-width + flex gap cho spinner), `.demo-btn` (font-size 0.78rem)
       ✅ SCSS giảm 299 → 201 dòng (-33%)
       ✅ Bonus: xoá `isFieldInvalid()` method dead code trong component.ts

- [x] 6. Visual verify — automated checks PASS
       ✅ FE dev server running (HTTP 200 on /login)
       ✅ Material Icons font loaded
       ✅ `pnpm build` PASS (Angular catches missing module imports)
       ✅ `pnpm typecheck` PASS
       ✅ File hiển thị trong Launch Preview panel
       ⏳ Manual UX verification (user): email/password validation, password toggle, submit disabled state, loading spinner, error alert, 8 demo buttons fill, mobile responsive (<768px hides illustration)

## Context quan trọng

### Rules UI/UX đang áp dụng (từ rules.md)
- `mat-form-field appearance="outline"` — bắt buộc cho form fields
- `mat-flat-button` action chính, `mat-stroked-button` phụ, `mat-icon-button` quick action
- `<mat-icon>` thay emoji
- M3 theme + density -3 (đã setup global)
- Không hardcode màu — dùng `var(--mat-sys-*)`

### Gotchas
- `MatFormFieldModule` cần BrowserAnimations — đã có `provideAnimationsAsync` trong app.config
- Standalone imports — KHÔNG dùng NgModule, mỗi module Material import riêng vào component
- `mat-error` chỉ hiển thị khi form control invalid + touched — đã có sẵn `isFieldInvalid()` nhưng Material tự handle qua `errorStateMatcher`. Có thể đơn giản hoá bằng cách bỏ method này và dùng built-in.
- Password reveal: dùng `signal showPassword`, switch icon dựa `showPassword()`
- mat-progress-spinner trong button: dùng `diameter="20"` cho vừa cỡ text

### Material modules cần import
```typescript
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
```

## Files đã tạo/sửa
- `apps/frontend/src/app/features/auth/components/login.component.ts` — thêm 5 Material imports
- `apps/frontend/src/app/features/auth/components/login.component.html` — refactor toàn bộ sang Material (form fields, submit, alert, demo, feature icons)
- `apps/frontend/src/app/features/auth/components/login.component.scss` — clean up 98 dòng dead CSS, apply theme tokens
- `apps/frontend/src/app/features/auth/components/login.component.ts` — xoá `isFieldInvalid()` dead code

## Bước tiếp theo sau task này
Backlog rỗng. Possible: register page cũng cần refactor tương tự nếu có pattern lặp.
