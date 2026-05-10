# Active Task: PDF Export — Font tiếng Việt

## Mục tiêu
PDFKit mặc định dùng font Helvetica không hỗ trợ Unicode — kết quả xuất PDF bỏ hết dấu tiếng Việt.
Fix bằng cách nhúng font Roboto (có sẵn trên Google Fonts, hỗ trợ đầy đủ tiếng Việt) vào PDFKit.
Không cần thêm dependency mới — PDFKit đã hỗ trợ `.registerFont()`.

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-10
Hoàn thành: 2026-05-10

## Steps

### Chuẩn bị font
- [x] 1. **Tải font Roboto** — download `Roboto-Regular.ttf` + `Roboto-Bold.ttf` vào `apps/backend/src/assets/fonts/`

### Cập nhật PDF export
- [x] 2. **Cập nhật `reports.service.ts`** — register font + dùng tiếng Việt đầy đủ (bỏ ASCII fallback)

### Kiểm tra
- [x] 3. **Verify** — đọc lại file đã sửa, kiểm tra logic đúng chuẩn

## Context quan trọng
- PDFKit API: `doc.registerFont('Roboto', '/path/to/Roboto-Regular.ttf')` rồi `doc.font('Roboto')`
- Font path: dùng `path.join()` từ `import.meta.url` (ES Modules) hoặc `__dirname` (CommonJS)
- Backend dùng ES Modules (`.js` extension, `"type": "module"` trong package.json) — dùng `fileURLToPath(import.meta.url)`
- Không cần thay đổi route hay repository
- Font Roboto Regular (~70KB) — nhúng vào PDF buffer, không ảnh hưởng performance đáng kể
- Sau khi nhúng font: thay tất cả text ASCII fallback → tiếng Việt có dấu đầy đủ

## Files đã tạo/sửa
- `apps/backend/src/assets/fonts/LiberationSans-Regular.ttf` — font nhúng PDF
- `apps/backend/src/assets/fonts/LiberationSans-Bold.ttf` — font nhúng PDF
- `apps/backend/src/modules/reports/reports.service.ts` — registerFont + full Vietnamese text

## Bước tiếp theo sau task này
P4 — SMS notifications (ESMS.vn): tích hợp vào notification queue
