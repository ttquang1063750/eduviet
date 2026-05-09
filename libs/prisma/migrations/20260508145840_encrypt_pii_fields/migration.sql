/*
  Warnings:

  - The `phone` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email_hash]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone_hash]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `email` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_hash" TEXT NOT NULL,
ADD COLUMN     "phone_hash" TEXT,
DROP COLUMN "email",
ADD COLUMN     "email" BYTEA NOT NULL,
DROP COLUMN "phone",
ADD COLUMN     "phone" BYTEA;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_hash_key" ON "users"("email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_hash_key" ON "users"("phone_hash");

-- CreateIndex
CREATE INDEX "users_email_hash_idx" ON "users"("email_hash");
