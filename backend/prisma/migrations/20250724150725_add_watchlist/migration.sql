/*
  Warnings:

  - A unique constraint covering the columns `[userId,skinId]` on the table `Watchlist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Watchlist" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_skinId_key" ON "Watchlist"("userId", "skinId");
