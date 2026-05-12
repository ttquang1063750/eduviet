-- AlterTable: thêm cột read_by vào chat_messages
ALTER TABLE "chat_messages" ADD COLUMN "read_by" JSONB NOT NULL DEFAULT '[]';
