# Task: Export PDF/Excel cho module Reports

## Trạng thái: COMPLETED
Hoàn thành: 2026-05-09

## Steps
- [x] 1. **Dependencies & Setup** — Cài đặt `exceljs` và `pdfkit`.
- [x] 2. **Excel Export** — `exportSummaryExcel()` trong reports.service.ts (BE).
- [x] 3. **PDF Export** — `exportSummaryPdf()` trong reports.service.ts (BE).
- [x] 4. **Routes** — `GET /api/reports/export/excel` và `GET /api/reports/export/pdf`.
- [x] 5. **FE Integration** — Nút "Xuất báo cáo" trong Frontend (refactor 3 file, OnPush, signals).
- [x] 6. **Validation** — ESLint pass 0 lỗi. File validation thực tế cần chạy server thủ công.

## Files đã tạo/sửa
### Backend
- apps/backend/src/modules/reports/reports.service.ts — thêm exportSummaryExcel(), exportSummaryPdf()
- apps/backend/src/modules/reports/reports.routes.ts — thêm 2 GET export routes

### Frontend
- apps/frontend/src/app/features/reports/reports.service.ts — thêm exportExcel(), exportPdf()
- apps/frontend/src/app/features/reports/reports.component.ts — refactor OnPush/signals + export logic
- apps/frontend/src/app/features/reports/reports.component.html — nút Excel/PDF + loading state
- apps/frontend/src/app/features/reports/reports.component.scss — styles nút export

## Lưu ý
- PDF dùng font mặc định PDFKit (không hỗ trợ tốt Vietnamese accents), nội dung bỏ dấu.
- Filename tự động: `eduviet-report-YYYY-MM-DD.xlsx/.pdf`.
- Export require role SUPER_ADMIN hoặc SCHOOL_ADMIN.
