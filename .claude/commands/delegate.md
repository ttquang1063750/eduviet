---
description: Giao một task cho AI worker thực hiện trong worktree riêng, sau đó tạo PR và chờ reviewer (bạn) kiểm tra. Dùng khi muốn tách biệt vai trò: AI khác implement, bạn review.
---

## Quy trình

1. **Nhận `$ARGUMENTS`** — mô tả task cần làm (feature, fix, refactor).
   - Nếu không có args → hỏi user task là gì.

2. **Đọc context** cần thiết để brief worker:
   - `.claude/task.md` — task plan hiện tại (nếu có)
   - `.claude/rules.md` — rules bắt buộc
   - `CLAUDE.md` — kiến trúc + patterns

3. **Spawn worker agent** với `isolation: "worktree"` và `subagent_type: "feature-builder"`.
   Prompt cho worker phải bao gồm:
   - Task description đầy đủ
   - Architecture patterns từ `rules.md` + `CLAUDE.md`
   - Files liên quan cần đọc/sửa
   - Yêu cầu: viết code → typecheck → test → commit → push → tạo PR vào branch `develop`
   - **KHÔNG tự merge** — chờ reviewer

4. **Sau khi worker xong**, lấy PR URL và báo cáo:
   ```
   🤖 WORKER DONE
   📋 Task: [tên task]
   🔗 PR: [URL]
   
   Bây giờ gõ `/review` để tôi review PR này.
   ```

5. **Gọi `/review` skill** với PR URL vừa tạo.
   - Review code quality, logic, security, rules compliance
   - Comment trên từng file nếu cần
   - Approve hoặc request changes

## Ví dụ sử dụng

```
/delegate xây dựng hệ thống lesson assignment theo task.md hiện tại
/delegate tạo endpoint GET /api/students/:id/progress
/delegate viết tests cho attempts.service.ts
```

## Lưu ý quan trọng
- Worker chạy trong **worktree riêng** → không ảnh hưởng working directory của bạn
- Worker sẽ push lên branch `feature/<tên-task>` và tạo PR → `develop`
- **Bạn (reviewer) là người quyết định** merge hay reject
- Nếu review fail → `/delegate fix: <vấn đề>` để worker fix lại

## Phân công trách nhiệm

| Vai trò | Nhiệm vụ |
|---------|---------|
| **Worker (AI)** | Đọc spec → implement → test → commit → push → tạo PR |
| **Reviewer (bạn + AI)** | Review code → approve/reject → merge nếu OK |
| **User** | Xác nhận yêu cầu → approve merge cuối cùng |
