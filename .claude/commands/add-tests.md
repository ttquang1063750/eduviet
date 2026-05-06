---
description: Viết tests còn thiếu cho file hoặc module được chỉ định
argument-hint: "<path đến file hoặc module>"
---

Phân tích code tại `$ARGUMENTS` và viết tests còn thiếu theo hướng dẫn trong `.claude/agents/test-writer.md`.

**Quy trình:**
1. Đọc file source để hiểu business logic
2. Kiểm tra file spec hiện có (nếu có)
3. Xác định các case chưa được test:
   - Happy path
   - Error cases
   - Edge cases
   - Security cases (unauthorized access)
4. Viết tests theo AAA pattern
5. Đảm bảo coverage targets: Services >90%, Components >75%

**Conventions:**
- Backend: Vitest
- Frontend: Jest + Angular Testing Library
- Mock ở boundary, không mock internal logic
- Tên test: "should <expected> when <condition>"
