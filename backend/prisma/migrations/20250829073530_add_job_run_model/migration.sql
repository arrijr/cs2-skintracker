-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "estimatedImpact" TEXT,
    "actualCount" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "adminId" INTEGER NOT NULL,
    "rateLimitKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRun_jobName_status_idx" ON "JobRun"("jobName", "status");

-- CreateIndex
CREATE INDEX "JobRun_adminId_idx" ON "JobRun"("adminId");

-- CreateIndex
CREATE INDEX "JobRun_rateLimitKey_idx" ON "JobRun"("rateLimitKey");

-- AddForeignKey
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
