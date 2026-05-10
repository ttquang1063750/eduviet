# Active Task: PDF Font Improvement (Vietnamese Support)

## Mục tiêu
Xử lý lỗi hiển thị tiếng Việt trong báo cáo PDF. 
Hiện tại mặc dù đã dùng LiberationSans nhưng có thể vẫn còn lỗi font hoặc cần chuyển sang phương pháp render bền vững hơn (Puppeteer/HTML-to-PDF) để hỗ trợ styling tốt hơn.
Tuy nhiên, để tối ưu hiệu năng và tận dụng code có sẵn, bước đầu sẽ kiểm tra lại việc nhúng font và sử dụng font Unicode đầy đủ hơn.

## Trạng thái: IN_PROGRESS
Bắt đầu: 2026-05-10
Step hiện tại: 1 — [BE] Nghiên cứu và thay thế font Unicode (Roboto/Inter)

## Steps
- [ ] 1. [BE] Tải font Inter hoặc Roboto (hỗ trợ tiếng Việt đầy đủ) vào thư mục assets/fonts
- [ ] 2. [BE] Cập nhật `ReportsService` để sử dụng font mới
- [ ] 3. [BE] Cải thiện layout PDF (thêm bảng, màu sắc, logo) bằng PDFKit
- [ ] 4. [FE] Test xuất báo cáo PDF và kiểm tra hiển thị tiếng Việt
- [ ] 5. [BE] (Optional) Nếu PDFKit vẫn không đáp ứng, chuyển sang dùng Puppeteer render HTML -> PDF

## Context quan trọng
- PDFKit yêu cầu font `.ttf` nhúng để hiển thị được Unicode.
- Dự án đang dùng LiberationSans nhưng người dùng báo cáo vẫn còn lỗi (hoặc layout xấu).
- Cần đảm bảo các ký tự như `ớ`, `ờ`, `ị`... hiển thị đúng.

## Files đã tạo/sửa
- (Chưa có)

## Bước tiếp theo sau task này
P2 — Dependabot
