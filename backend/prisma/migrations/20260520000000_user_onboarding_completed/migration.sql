-- AlterTable: add onboarding completion timestamp for new-user flow
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP;
