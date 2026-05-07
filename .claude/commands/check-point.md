---
description: Lưu tiến độ hiện tại — scan filesystem, cập nhật PROGRESS.md + task.md + CLAUDE.md, commit code, chuẩn bị cho /resume sau khi hết token.
---

## Hành động

1. Đọc `.claude/task.md` — xem steps nào đã xong `[x]`, còn lại `[ ]`.
2. Đọc `.claude/PROGRESS.md` — nắm backlog hiện tại.

3. **Scan filesystem thực tế** (để đảm bảo docs phản ánh đúng):
   - `apps/backend/src/modules/*/` — liệt kê modules: routes/service/repository/spec
   - `apps/frontend/src/app/features/*/` — liệt kê features và components
   - `packages/`, `libs/` — packages đã tạo

4. **Cập nhật `.claude/PROGRESS.md`**:
   - Di chuyển items đã xong từ backlog vào phần ✅ Đã hoàn thành (dựa trên scan thực tế).
   - Ghi rõ files đã tạo/sửa.
   - Cập nhật ngày.

5. **Cập nhật `.claude/task.md`**:
   - Nếu task CHƯA xong: giữ nguyên steps, cập nhật "Step hiện tại", thêm "Snapshot context":
     ```markdown
     ## Snapshot (checkpoint [timestamp])
     - Đã xong: steps 1-[N]
     - Đang làm: step [N+1] — [tên]
     - Files đã tạo: [danh sách]
     - Cần làm tiếp: [mô tả chi tiết, bao gồm gotchas]
     - Lệnh tiếp theo: `/resume` rồi `/execute-step`
     ```
   - Nếu task ĐÃ XONG hết: đổi trạng thái → `COMPLETED`, ghi tóm tắt.

6. **Cập nhật `CLAUDE.md`**:
   - Bảng Backend modules (Routes/Service/Repository/Tests)
   - Bảng Frontend features (List/Detail/Service/Routes)
   - Danh sách `🚧 Còn lại` — xóa thứ đã làm xong, cập nhật ← NEXT
   - Cập nhật ngày
   - **Không chạm vào:** bảng tài liệu, section Patterns

7. **Cập nhật `docs/` nếu cần** (chỉ khi có thay đổi thực sự):
   - `docs/features.md` — khi tính năng mới hoàn thành
   - `docs/rbac.md` — khi thêm role hoặc thay đổi permission
   - `docs/coding-standards.md` — khi có pattern mới

8. **Commit code**:
   - Hướng dẫn người dùng chạy lệnh commit trong Terminal (sandbox không có quyền xóa git lock):
     ```bash
     cd ~/Desktop/eduviet && git add -A && git commit -m "feat(...): ..."
     ```
   - Gợi ý commit message theo conventional commits dựa trên những gì đã làm.

9. **Báo cáo tóm tắt**:
   ```
   📌 CHECKPOINT saved
   ✅ Đã xong: [N steps] — [tên các step]
   📁 Files: [danh sách]
   ⏭ Tiếp theo: [task tiếp theo trong backlog]
   💾 Commit: [lệnh git gợi ý]
   🚀 Tiếp tục: /plan-task
   ```

## Lưu ý
- Chỉ ghi những gì THỰC SỰ tồn tại trên filesystem — không đoán mò
- Giữ nguyên "Patterns bắt buộc" và "Architectural Decisions" nếu không có thay đổi kiến trúc
- Sandbox không thể xóa git lock files — luôn hướng dẫn người dùng tự commit từ Terminal
