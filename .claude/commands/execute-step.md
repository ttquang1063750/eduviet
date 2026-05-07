---
description: Đọc .claude/task.md, thực thi bước [ ] đầu tiên chưa làm, đánh dấu xong, báo cáo kết quả.
---

## Hành động

1. Đọc `.claude/task.md` — tìm step `[ ]` đầu tiên chưa làm.
2. Đọc `.claude/rules.md` — nhắc lại rules trước khi viết code.
3. Nếu step có dependency (cần step trước xong) mà chưa xong → báo lỗi, không thực thi.

4. **Thực thi step**:
   - Đọc file liên quan trước khi sửa (không bao giờ sửa mù).
   - Viết/sửa code theo đúng rules.md.
   - Kiểm tra TypeScript sơ bộ (đọc lại file vừa tạo, check import/export).
   - Nên viết test để kiểm tra tính chính xác nếu có thể
   - Có thể commit code nếu bước chính đã hoàn thành

5. **Cập nhật task.md**:
   - Đánh dấu step vừa làm: `[ ]` → `[x]`.
   - Cập nhật "Step hiện tại" sang step tiếp theo.
   - Thêm file vào mục "Files đã tạo/sửa".

6. **Báo cáo**:
   ```
   ✅ Step [N] done: [tên step]
   📁 File: [đường dẫn]
   ⏭ Tiếp theo: Step [N+1] — [tên]
   💡 Ghi chú: [nếu có gì cần lưu ý]
   ```

7. Nếu đây là step cuối cùng → nhắc người dùng chạy `/check-point` ngược lại thì nhắc `/execute-step`.

## Lưu ý
- Mỗi lần chỉ làm 1 step — không nhảy cóc.
- Nếu step quá lớn (>150 dòng code mới), đề xuất tách nhỏ hơn.
- Nếu gặp lỗi hoặc cần quyết định thiết kế → dừng, hỏi người dùng, KHÔNG tự quyết.
