-- AlterEnum
BEGIN;
CREATE TYPE "NotificationChannel_new" AS ENUM ('IN_APP', 'EMAIL');
ALTER TABLE "notifications" ALTER COLUMN "channel" TYPE "NotificationChannel_new" USING ("channel"::text::"NotificationChannel_new");
ALTER TYPE "NotificationChannel" RENAME TO "NotificationChannel_old";
ALTER TYPE "NotificationChannel_new" RENAME TO "NotificationChannel";
DROP TYPE "NotificationChannel_old";
COMMIT;
