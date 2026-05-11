/*
  Migration: user_multi_roles

  Thay đổi:
  - User.role (Role enum, single) → User.roles (Json array, multi)
  - Thêm User.title (String?, chức danh tự do — chỉ hiển thị)
  - Backfill: mọi user hiện có chuyển role đơn thành mảng 1 phần tử
  - Drop cột role + enum Role
  - Drop index role trên bảng users

  Thứ tự QUAN TRỌNG:
  1. Thêm cột roles + title
  2. Backfill roles từ role
  3. Drop cột role
  4. Drop enum Role
*/

-- Step 1: Thêm cột roles với default tạm thời
ALTER TABLE "users"
  ADD COLUMN "roles" JSONB NOT NULL DEFAULT '["STUDENT"]',
  ADD COLUMN "title" TEXT;

-- Step 2: Backfill — chuyển role đơn thành mảng JSON
UPDATE "users"
  SET "roles" = json_build_array("role"::TEXT)::JSONB;

-- Step 3: Drop index cũ trên cột role
DROP INDEX IF EXISTS "users_role_idx";

-- Step 4: Drop cột role
ALTER TABLE "users"
  DROP COLUMN "role";

-- Step 5: Drop enum Role (không còn dùng)
DROP TYPE IF EXISTS "Role";
