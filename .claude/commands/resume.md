---
description: Load lại toàn bộ context sau khi hết token. Đọc task.md + PROGRESS.md + rules.md, tóm tắt trạng thái, sẵn sàng /execute-step tiếp.
---

## Hành động

1. Đọc `.claude/task.md` — trạng thái task hiện tại, bước đang làm.
2. Đọc `.claude/PROGRESS.md` — tổng quan dự án.
3. Đọc `.claude/rules.md` — nạp lại rules bắt buộc.
4. Đọc `CLAUDE.md` — trạng thái tổng thể + patterns.

5. Đọc **các file liên quan đến step tiếp theo** (không đọc toàn bộ codebase):
   - Nếu step tiếp là tạo file mới: đọc file cùng module để hiểu pattern.
   - Nếu step tiếp là sửa file có sẵn: đọc file đó.

6. **Tóm tắt context** cho người dùng:
   ```
   🔄 RESUMED
   
   📋 Task: [tên task]
   📍 Đang ở: Step [N] / [tổng] — [tên step]
   ✅ Đã xong: [danh sách steps trước]
   
   📁 Files đã tạo trong task này:
   - [file 1]
   - [file 2]
   
   ⏭ Bước tiếp theo:
   Step [N]: [mô tả chi tiết — đủ để làm không cần hỏi thêm]
   
   🔧 Lệnh tiếp: /execute-step
   ```

7. KHÔNG bắt đầu thực thi — chỉ tóm tắt và chờ lệnh `/execute-step`.
