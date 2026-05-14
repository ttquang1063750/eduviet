# Active Task: Bug Fix — Known Issues (session 23)

## Mục tiêu
Fix 3 known issues còn tồn đọng từ các session trước.

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-14
Hoàn thành: 2026-05-14

---

## Steps

- [x] 1. `shared/errors/app-error.ts` — thêm `static validation()` → HTTP 422
         `lessons.service.ts:359` gọi `AppError.validation()` nhưng method không tồn tại → fix

- [x] 2. `modules/reports/reports.service.ts` — xóa `import.meta.url` (ESM-only)
         Backend là CJS (`package.json` không có `"type": "module"`) → `import.meta` crash
         Fix: xóa `fileURLToPath` + `__dirname` declaration, dùng CJS built-in `__dirname`

- [x] 3. Verify PDF font path sau fix
         Dev: `src/modules/reports/ → ../../assets/fonts` ✅
         Prod: `dist/modules/reports/ → ../../assets/fonts` ✅ (build đã cp assets)
         → PDF export tiếng Việt đầy đủ dấu

## Files đã sửa
- `apps/backend/src/shared/errors/app-error.ts` — +`static validation()`
- `apps/backend/src/modules/reports/reports.service.ts` — remove `import.meta.url`

## Context
- ESM/CJS root cause: `package.json` BE không có `"type": "module"` → CJS context
- `__dirname` available automatically trong CJS, không cần khai báo
- PDF font issue là hệ quả của ESM/CJS crash → font path sai → PDFKit fallback Helvetica
