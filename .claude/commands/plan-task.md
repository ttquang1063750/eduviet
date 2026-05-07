---
description: Phân tích backlog trong PROGRESS.md, chọn task P1 tiếp theo, chia nhỏ thành micro-steps, ghi vào .claude/task.md
---

## Hành động

1. Đọc `.claude/PROGRESS.md` — xem backlog hiện tại, chú ý P1 chưa làm.
2. Đọc `.claude/task.md` — xem task nào đang dở dang (nếu có).
3. Đọc `CLAUDE.md` — trạng thái hiện tại.

4. **Nếu có task dở dang** trong task.md: hỏi người dùng có muốn tiếp tục task đó không.

5. **Chọn task tiếp theo** theo thứ tự ưu tiên trong PROGRESS.md (P1 → P2 → P3).

6. **Chia nhỏ thành micro-steps** — mỗi step là một hành động cụ thể, có thể làm trong 1 lần gọi tool:
   - Mỗi step = 1 file tạo/sửa cụ thể, hoặc 1 đơn vị logic nhỏ
   - Đặt tên step rõ ràng: `[BE] Tạo chat.repository.ts — Prisma queries`
   - Đánh dấu dependency nếu step B cần step A xong trước

7. **Ghi vào `.claude/task.md`** theo format:

```markdown
# Active Task: [tên task]

## Mục tiêu
[Mô tả ngắn gọn — tại sao làm task này]

## Trạng thái: IN_PROGRESS
Bắt đầu: [ngày]
Step hiện tại: [số] — [tên step]

## Steps
- [ ] 1. [tên step] — [file cụ thể / hành động]
- [ ] 2. ...
- [x] = đã xong, [ ] = chưa, [~] = đang làm

## Context quan trọng
[Những quyết định thiết kế, gotchas, constraints cần nhớ]

## Files đã tạo/sửa
[Điền khi thực thi]

## Bước tiếp theo sau task này
[Task P1/P2 tiếp theo trong backlog]
```

8. Trình bày plan cho người dùng xem và xác nhận trước khi bắt đầu.
