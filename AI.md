# AI Development Rules

## Session Start — PHẢI làm trước bất kỳ việc gì

Khi bắt đầu session mới, đọc **tất cả** các file sau theo thứ tự:

1. `CLAUDE.md` — trạng thái tổng thể dự án, patterns bắt buộc
2. `docs/tech-stack.md` — stack công nghệ
3. `docs/architecture.md` — kiến trúc hệ thống, folder structure
4. `docs/coding-standards.md` — chuẩn code Angular + Fastify + Prisma
5. `docs/rbac.md` — phân quyền roles
6. `docs/features.md` — tính năng + trạng thái implement
7. `docs/dev-setup.md` — setup local, ports, pnpm commands
8. `docs/security.md` — checklist bảo mật (ƯU TIÊN CAO NHẤT)
9. `docs/api-conventions.md` — format response, error codes
10. `.claude/rules.md` — luật bất biến, PHẢI tuân thủ mọi lúc
11. `.claude/PROGRESS.md` — tracker tiến độ + backlog
12. `.claude/task.md` — task đang làm dở (nếu có)
13. `.claude/commands/plan-task.md` — cách lập kế hoạch task
14. `.claude/commands/execute-step.md` — cách thực thi từng step
15. `.claude/commands/check-point.md` — cách lưu tiến độ
16. `.claude/commands/resume.md` — cách resume sau khi hết token

Sau khi đọc xong, tóm tắt ngắn cho người dùng:
- Trạng thái dự án hiện tại
- Task đang dở (nếu có) + step tiếp theo
- Backlog ưu tiên tiếp theo

## Token Safety

- Nếu context window bắt đầu lớn → PHẢI chạy `.claude/commands/check-point.md` ngay
- Sau checkpoint → dùng `.claude/commands/resume.md` để load lại context

## Nguyên tắc làm việc

- **Không bao giờ** bỏ qua bước đọc context khi bắt đầu session
- **Không bao giờ** tự quyết định thiết kế — dừng và hỏi người dùng nếu có ambiguity
- **Mỗi lần** chỉ thực thi 1 step — không nhảy cóc
- **Luôn** đọc file liên quan trước khi sửa (không sửa mù)
- **Luôn** cập nhật `.claude/task.md` sau mỗi step hoàn thành
