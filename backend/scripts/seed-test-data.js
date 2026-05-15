/**
 * Sprint 1 — Test Data Seeder
 * Creates pro user, free user, and a known API key for local E2E testing.
 *
 * Usage: node scripts/seed-test-data.js
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Stable test values so we can reference them in curl
const PRO_CLERK_ID   = process.env.DEV_TEST_CLERK_ID   || 'test-clerk-pro-user-001';
const FREE_CLERK_ID  = process.env.DEV_FREE_CLERK_ID   || 'test-clerk-free-user-001';

// A known raw API key we'll use in tests
const KNOWN_RAW_KEY  = 'sprint1-test-api-key-abcdef1234567890abcdef1234567890';
const HASHED_KEY     = crypto.createHash('sha256').update(KNOWN_RAW_KEY).digest('hex');

async function main() {
  console.log('🌱  Seeding test data...\n');

  // ── Pro user ──────────────────────────────────────────────────────────────
  const proUser = await prisma.user.upsert({
    where: { email: 'pro-test@cs2tracker.local' },
    update: { tier: 'pro', clerkId: PRO_CLERK_ID, role: 'user' },
    create: {
      email: 'pro-test@cs2tracker.local',
      clerkId: PRO_CLERK_ID,
      tier: 'pro',
      role: 'user',
      displayName: 'Pro Test User',
      isPremium: true
    }
  });
  console.log(`✅  Pro user   id=${proUser.id}  tier=${proUser.tier}  clerkId=${proUser.clerkId}`);

  // ── Free user ─────────────────────────────────────────────────────────────
  const freeUser = await prisma.user.upsert({
    where: { email: 'free-test@cs2tracker.local' },
    update: { tier: 'free', clerkId: FREE_CLERK_ID, role: 'user' },
    create: {
      email: 'free-test@cs2tracker.local',
      clerkId: FREE_CLERK_ID,
      tier: 'free',
      role: 'user',
      displayName: 'Free Test User',
      isPremium: false
    }
  });
  console.log(`✅  Free user  id=${freeUser.id}  tier=${freeUser.tier}  clerkId=${freeUser.clerkId}`);

  // ── Known API key for pro user ─────────────────────────────────────────────
  const apiKey = await prisma.aPIKey.upsert({
    where: { key: HASHED_KEY },
    update: { isActive: true, callsUsed: 0 },
    create: {
      userId: proUser.id,
      key: HASHED_KEY,
      name: 'Sprint-1 Test Key',
      tier: 'developer',
      callsPerDay: 10000,
      callsUsed: 0,
      isActive: true
    }
  });
  console.log(`✅  API key    id=${apiKey.id}  name="${apiKey.name}"  active=${apiKey.isActive}`);

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('Use these values for curl tests:\n');
  console.log(`  Clerk bypass token : DEV_TEST_TOKEN  = ${process.env.DEV_TEST_TOKEN}`);
  console.log(`  Pro user clerkId   : DEV_TEST_CLERK_ID = ${PRO_CLERK_ID}`);
  console.log(`  Known API key      : ${KNOWN_RAW_KEY}`);
  console.log('─────────────────────────────────────────────────────────────\n');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
