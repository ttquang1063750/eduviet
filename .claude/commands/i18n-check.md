---
description: Quét UI templates tìm text chuỗi chưa có i18n marker. Chạy sau mỗi lần tạo/sửa Angular component để đảm bảo support đa ngôn ngữ.
---

## Hành động

### 1. Detect i18n setup status
- Kiểm tra `apps/frontend/package.json` có `@angular/localize` không
- Nếu KHÔNG có → skill chuyển sang **WARN MODE** (chỉ báo cáo, không block)
- Nếu CÓ → **ENFORCE MODE** (báo HIGH violations)

### 2. Scan HTML templates
Phạm vi mặc định: file vừa tạo/sửa trong session, hoặc theo `$ARGUMENTS` (path/folder).

Tìm các pattern thiếu i18n marker:

**A. Text giữa thẻ HTML (không có i18n attribute):**
```bash
# Heuristic: dòng có text giữa > và < mà KHÔNG là binding {{}}, comment, hay HTML entity
grep -nE '>[^<{][^<]*[a-zA-ZÀ-ỹ][^<]*<' apps/frontend/src/app/**/*.html
```

Lọc ra:
- Bỏ qua dòng chứa `i18n=` hoặc `i18n-`
- Bỏ qua text 100% là `{{ }}` (Angular binding)
- Bỏ qua text chỉ có ký tự đặc biệt/số

**B. Attribute strings (placeholder, aria-label, title, alt):**
```bash
grep -nE '(placeholder|aria-label|title|alt|matTooltip)="[^"]*[a-zA-ZÀ-ỹ][^"]*"' apps/frontend/src/app/**/*.html | grep -v 'i18n-'
```

**C. TypeScript strings cho dynamic messages:**
```bash
# ToastService, ConfirmService, ErrorMessage signals
grep -nE "(toast\.(success|error|info)|confirm\.confirm|errorMessage\.set)\(['\"][^'\"]*[a-zA-ZÀ-ỹ]" apps/frontend/src/app/**/*.ts | grep -v '\$localize'
```

### 3. Báo cáo theo format

```
## i18n Check Report

### Mode: [WARN_MODE | ENFORCE_MODE]

### Files đã scan: N files

### Violations

#### Text node thiếu i18n attribute (N)
- `path/to/file.html:line` — `"Văn bản hiện tại"` → đề xuất: `<tag i18n="@@feature.context.key">Văn bản hiện tại</tag>`

#### Attribute thiếu i18n-* (N)
- `path/to/file.html:line` — `placeholder="..."` → đề xuất: `<input i18n-placeholder="@@..." placeholder="..." />`

#### Dynamic TS strings thiếu $localize (N)
- `path/to/file.ts:line` — `toast.error('Đã có lỗi')` → đề xuất: `toast.error($localize\`:@@common.error:Đã có lỗi\`)`

### Statistics
- Total UI strings detected: N
- Đã có i18n: N
- Thiếu i18n: N
- Coverage: %

### Recommendations
- [Nếu WARN_MODE]: Nhắc user task i18n vẫn còn trong backlog, plan tại `.claude/task.md`
- [Nếu ENFORCE_MODE]: Chạy `ng extract-i18n` sau khi fix để cập nhật `messages.xlf`
```

### 4. Auto-suggest i18n IDs

Khi đề xuất `@@id`, dùng quy ước:
- `@@<feature>.<context>.<key>` — vd `@@login.form.email_label`, `@@admin.users.delete_confirm`
- `@@common.<key>` cho strings tái sử dụng — vd `@@common.cancel`, `@@common.save`, `@@common.delete`

### 5. KHÔNG tự sửa code

Skill chỉ REPORT — không tự thêm `i18n` attribute vì:
- Cần human review để chọn ID phù hợp
- Trước khi i18n setup hoàn tất, thêm `i18n` sẽ break build (`@angular/localize` chưa install)

User chạy `/execute-step` task i18n để bắt đầu mark up template theo plan.

## Khi nào chạy

- **Tự động (recommended workflow)**: gọi từ `/execute-step` Angular component checklist (xem `execute-step.md` step 5)
- **Manual**: `/i18n-check` không args → scan toàn bộ; `/i18n-check apps/frontend/src/app/features/auth` → scan folder cụ thể
- **Pre-commit**: cân nhắc thêm vào `.husky/pre-commit` để block commit nếu coverage giảm

## Liên kết
- Task plan: `.claude/task.md` (i18n setup, 30 steps)
- Rules: `.claude/rules.md` section "i18n bắt buộc"
- Reference: https://angular.dev/guide/i18n
