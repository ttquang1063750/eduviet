---
description: Tạo Prisma migration an toàn với rollback strategy
argument-hint: "<mô tả thay đổi schema>"
---

Tạo database migration cho: $ARGUMENTS

Theo đúng quy trình trong `.claude/agents/db-migrator.md`:

1. **Phân tích impact:**
   - Bảng nào bị ảnh hưởng và có bao nhiêu rows?
   - Có blocking operations không?
   - Cần backfill data không?

2. **Cập nhật schema.prisma** với:
   - UUID primary keys
   - snake_case column names (`@map`)
   - Soft delete (`deletedAt`) cho entities quan trọng
   - Proper indexes cho foreign keys và frequently queried fields

3. **Tạo migration:**
   ```bash
   pnpm db:migrate:create -- --name <descriptive-name>
   ```

4. **Verify:**
   - Rollback strategy rõ ràng
   - `CREATE INDEX CONCURRENTLY` cho indexes trên bảng lớn
   - Không breaking change trong một migration

5. **Kiểm tra cuối:**
   - Chạy `pnpm db:migrate` trên dev
   - Verify data integrity
