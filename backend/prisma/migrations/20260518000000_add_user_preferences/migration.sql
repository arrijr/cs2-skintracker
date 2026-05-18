-- AlterTable: add user preferences for currency and theme
ALTER TABLE "User" ADD COLUMN "preferredCurrency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "User" ADD COLUMN "themePreference" TEXT NOT NULL DEFAULT 'DARK';
