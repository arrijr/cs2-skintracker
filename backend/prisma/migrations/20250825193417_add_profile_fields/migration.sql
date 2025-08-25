-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezone" TEXT;
