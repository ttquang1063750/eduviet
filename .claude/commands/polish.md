---
description: Tiếp quản branch từ AI worker — đọc toàn bộ code đã commit, fix lỗi, improve quality, commit lại. Dùng sau khi worker AI đã implement xong trên cùng branch.
---

## Hành động

### 1. Xác định phạm vi thay đổi

```bash
git log develop..HEAD --oneline          # xem worker đã commit gì
git diff develop...HEAD --stat           # xem files đã thay đổi
git diff develop...HEAD -- '*.ts' '*.html' '*.scss'  # xem full diff
```

### 2. Scan lỗi tự động

Chạy song song:
```bash
pnpm --filter @eduviet/backend typecheck     # BE type errors
pnpm --filter @eduviet/frontend typecheck    # FE type errors
pnpm --filter @eduviet/backend lint          # BE lint
pnpm --filter @eduviet/frontend lint         # FE lint
pnpm --filter @eduviet/backend test          # BE tests
```

Ghi nhận tất cả lỗi — đây là priority #1 cần fix.

### 3. Đọc từng file worker đã tạo/sửa

Ưu tiên đọc theo thứ tự:
1. **Schema / migration** — đúng chuẩn Prisma không?
2. **BE routes → service → repository** — flow đúng không? RBAC đủ chưa?
3. **shared-types** — interface đầy đủ không?
4. **FE components** — checklist Angular đủ không?
5. **Templates** — i18n đủ không?

### 4. Fix theo checklist rules.md

Kiểm tra **TỪNG FILE** theo checklist:

#### Backend
- [ ] Route handler chỉ validate + delegate (không có business logic)
- [ ] Service có RBAC checks + `writeAuditLog()` sau mọi mutation
- [ ] Repository chỉ Prisma, có `satisfies Prisma.XxxSelect`
- [ ] Không dùng `any` — dùng proper types
- [ ] Zod validation bằng `.safeParse()` trong handler, **không** đặt Zod vào `schema:{}` Fastify
- [ ] Không throw Error thường — dùng `AppError.*`
- [ ] Rate limit trên auth endpoints

#### Frontend Angular
- [ ] 3 file riêng: `.ts` + `.html` + `.scss` — **KHÔNG inline template/styles**
- [ ] `OnPush` trên mọi component
- [ ] `inject()` thay constructor injection
- [ ] Signals: `signal()`, `computed()`, `input()`, `output()`
- [ ] Control flow: `@if`/`@for` — không `*ngIf`/`*ngFor`
- [ ] Không `CommonModule` — standalone
- [ ] Không `any` type
- [ ] Không `::ng-deep`
- [ ] i18n: `i18n` bare trên mọi text node + `i18n-<attr>` trên static attributes
- [ ] Material 3: mat-form-field outline, mat-flat/stroked-button, mat-icon (không emoji)
- [ ] Theme tokens: `var(--mat-sys-*)` thay hex hardcode

### 5. Fix và commit theo nhóm

Không commit một lần tất cả. Chia theo nhóm logic:
```bash
# Nhóm 1: fix lỗi typecheck/lint critical
git add <files> && git commit -m "fix: resolve typecheck + lint errors from worker"

# Nhóm 2: rules violations (inline template, CommonModule, any, etc.)
git add <files> && git commit -m "refactor: apply Angular + BE coding standards"

# Nhóm 3: i18n markup
git add <files> && git commit -m "feat(i18n): add i18n markers to new components"

# Nhóm 4: quality improvements (better types, cleaner logic)
git add <files> && git commit -m "refactor: improve type safety + code clarity"
```

### 6. Verify cuối cùng

```bash
pnpm --filter @eduviet/backend typecheck    # phải PASS
pnpm --filter @eduviet/frontend typecheck  # phải PASS  
pnpm --filter @eduviet/backend test         # phải PASS (tất cả tests)
pnpm --filter @eduviet/backend lint         # 0 errors
```

### 7. Báo cáo

```
✅ POLISH DONE

📊 Worker code review:
- Files reviewed: N
- Lỗi critical fixed: N
- Rules violations fixed: N  
- Quality improvements: N

🔴 Critical fixes:
- [mô tả fix]

🟡 Rules fixes:
- [file]: [vi phạm] → [fix]

🟢 Quality improvements:
- [mô tả improvement]

💾 Commits:
- [SHA] fix: ...
- [SHA] refactor: ...

🔧 Còn cần làm (nếu có):
- [items còn lại]
```

## Lưu ý
- **Fix trực tiếp, không chỉ comment** — đây là mục đích của skill này
- Nếu worker đã implement sai architecture → refactor ngay, không để debt
- Nếu phát hiện security issue → ưu tiên fix trước
- Sau polish xong → bạn review commit history và merge nếu OK
