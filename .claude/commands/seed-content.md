---
description: Tạo bài học mẫu cho môn học và cấp lớp được chỉ định
argument-hint: "<môn học> <lớp> [chủ đề] [số lượng]"
---

Tạo seed data bài học cho: $ARGUMENTS

Theo hướng dẫn trong `.claude/agents/content-seeder.md`:

1. **Parse arguments:** môn học, lớp, chủ đề (tùy chọn), số lượng bài
2. **Tạo theo chương trình SGK Việt Nam** phù hợp với cấp lớp
3. **Cấu trúc mỗi bài:**
   - Lý thuyết (Markdown + LaTeX)
   - Ví dụ minh họa có giải
   - Bài tập từ dễ đến khó (đủ 4 cấp độ nhận biết → vận dụng cao)
4. **Tạo seed script** tại `libs/prisma/seeds/`
5. **Lưu ý:** Tất cả bài tạo tự động ở trạng thái DRAFT

**Định dạng LaTeX:** Dùng KaTeX syntax, test render trước khi finalize.
