-- Sprint 1 Migration: Add Payment & API Models for Freemium SaaS

-- Add tier and Stripe fields to User
ALTER TABLE "User" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;

-- Create unique constraint for Stripe customer ID
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- APIKey table for B2B API access
CREATE TABLE "APIKey" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'starter',
    "callsPerDay" INTEGER NOT NULL DEFAULT 100,
    "callsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for API key
CREATE UNIQUE INDEX "APIKey_key_key" ON "APIKey"("key");

-- Create indexes for APIKey
CREATE INDEX "APIKey_userId_idx" ON "APIKey"("userId");
CREATE INDEX "APIKey_isActive_idx" ON "APIKey"("isActive");
CREATE INDEX "APIKey_tier_idx" ON "APIKey"("tier");

-- Add foreign key constraint
ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- APILog table for tracking API usage
CREATE TABLE "APILog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "apiKeyId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APILog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for APILog
CREATE INDEX "APILog_userId_idx" ON "APILog"("userId");
CREATE INDEX "APILog_apiKeyId_idx" ON "APILog"("apiKeyId");
CREATE INDEX "APILog_endpoint_idx" ON "APILog"("endpoint");
CREATE INDEX "APILog_createdAt_idx" ON "APILog"("createdAt");

-- Add foreign key constraints
ALTER TABLE "APILog" ADD CONSTRAINT "APILog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "APILog" ADD CONSTRAINT "APILog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "APIKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
