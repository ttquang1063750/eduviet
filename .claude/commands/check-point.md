---
description: Lưu tiến độ hiện tại — cập nhật PROGRESS.md và task.md, chuẩn bị cho /resume sau khi hết token.
---

## Hành động

1. Đọc `.claude/task.md` — xem steps nào đã xong `[x]`, còn lại `[ ]`.
2. Đọc `.claude/PROGRESS.md` — cập nhật phần "Đã hoàn thành".

3. **Cập nhật `.claude/PROGRESS.md`**:
   - Di chuyển items đã xong từ backlog vào phần ✅ Đã hoàn thành.
   - Ghi rõ files đã tạo/sửa.
   - Cập nhật ngày.

4. **Cập nhật `.claude/task.md`**:
   - Nếu task CHƯA xong: giữ nguyên steps, cập nhật "Step hiện tại", thêm "Snapshot context":
     ```markdown
     ## Snapshot (checkpoint [timestamp])
     - Đã xong: steps 1-[N]
     - Đang làm: step [N+1] — [tên]
     - Files đã tạo: [danh sách]
     - Cần làm tiếp: [step N+1 description chi tiết, bao gồm gotchas]
     - Lệnh tiếp theo: `/resume` rồi `/execute-step`
     ```
   - Nếu task ĐÃ XONG hết: đổi trạng thái → `COMPLETED`, ghi tóm tắt.

5. **Cập nhật `CLAUDE.md`** trạng thái nếu có module/feature mới hoàn thành.

6. **Báo cáo tóm tắt**:
   ```
   📌 CHECKPOINT saved
   ✅ Đã xong: [N steps] — [tên các step]
   📁 Files: [danh sách]
   ⏭ Tiếp theo: Step [N+1] — [tên]
   💾 Để tiếp tục: /resume → /execute-step
   ```
