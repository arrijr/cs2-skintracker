/**
 * Sprint 1 — Rate Limit + Load Test
 *
 * Test A: Fire 100 sequential requests and check callsUsed counter
 * Test B: Fire 500 requests concurrently over 60 s and measure avg latency
 *
 * Usage: node scripts/test-rate-limit-and-load.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const API_KEY_ID = 1; // Sprint-1 Test Key (seeded)
const KNOWN_RAW_KEY = 'sprint1-test-api-key-abcdef1234567890abcdef1234567890';
const BASE_URL = 'http://localhost:5000';
const SKINS_ENDPOINT = `${BASE_URL}/api/public/skins?limit=5`;

async function resetCounter(keyId) {
  await prisma.aPIKey.update({
    where: { id: keyId },
    data: { callsUsed: 0, lastResetAt: new Date() }
  });
}

async function getCallsUsed(keyId) {
  const key = await prisma.aPIKey.findUnique({ where: { id: keyId }, select: { callsUsed: true, callsPerDay: true } });
  return key;
}

// ── Test A: Rate-limit counter ────────────────────────────────────────────────
async function testRateLimitCounter() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  TEST A — Rate Limit Counter (100 requests)');
  console.log('══════════════════════════════════════════════');

  await resetCounter(API_KEY_ID);
  const before = await getCallsUsed(API_KEY_ID);
  console.log(`Before: callsUsed=${before.callsUsed}/${before.callsPerDay}`);

  const N = 100;
  let ok = 0, errors = 0;
  for (let i = 0; i < N; i++) {
    try {
      const r = await fetch(SKINS_ENDPOINT, {
        headers: { Authorization: `Bearer ${KNOWN_RAW_KEY}` }
      });
      if (r.ok) ok++; else errors++;
    } catch {
      errors++;
    }
    if ((i + 1) % 25 === 0) process.stdout.write(`  sent ${i + 1}/${N}...\n`);
  }

  // Small delay for async log writes to settle
  await new Promise(r => setTimeout(r, 1500));

  const after = await getCallsUsed(API_KEY_ID);
  console.log(`After:  callsUsed=${after.callsUsed}/${after.callsPerDay}`);
  console.log(`HTTP ok=${ok}  errors=${errors}`);

  const pass = after.callsUsed >= 95; // allow slight async lag
  console.log(`\nResult: ${pass ? '✅  PASS' : '❌  FAIL'} — counter at ${after.callsUsed}/100 (threshold ≥95)`);
  return { callsUsed: after.callsUsed, ok, errors };
}

// ── Test B: Load test ─────────────────────────────────────────────────────────
async function loadTest() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  TEST B — Load Test (500 requests / 60 s)');
  console.log('══════════════════════════════════════════════');

  await resetCounter(API_KEY_ID);

  const TOTAL    = 500;
  const BATCH    = 25;   // concurrent requests per wave
  const WAVES    = Math.ceil(TOTAL / BATCH);
  const START    = Date.now();
  const latencies = [];
  let   ok = 0, errors = 0;

  for (let wave = 0; wave < WAVES; wave++) {
    const count = Math.min(BATCH, TOTAL - wave * BATCH);
    const promises = Array.from({ length: count }, async () => {
      const t0 = Date.now();
      try {
        const r = await fetch(SKINS_ENDPOINT, {
          headers: { Authorization: `Bearer ${KNOWN_RAW_KEY}` }
        });
        latencies.push(Date.now() - t0);
        if (r.ok) ok++; else errors++;
      } catch {
        errors++;
        latencies.push(Date.now() - t0);
      }
    });
    await Promise.all(promises);

    // Pace to spread across ~60 s
    const elapsed = Date.now() - START;
    const target  = ((wave + 1) / WAVES) * 58000; // 58 s budget
    const delay   = Math.max(0, target - elapsed);
    if (delay > 0) await new Promise(r => setTimeout(r, delay));

    if ((wave + 1) % 5 === 0) {
      const done = (wave + 1) * BATCH;
      process.stdout.write(`  ${Math.min(done, TOTAL)}/${TOTAL} requests (${((Date.now()-START)/1000).toFixed(1)}s)\n`);
    }
  }

  const totalMs   = Date.now() - START;
  const avg       = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95       = latencies.sort((a,b) => a-b)[Math.floor(latencies.length * 0.95)];
  const p99       = latencies.sort((a,b) => a-b)[Math.floor(latencies.length * 0.99)];
  const rps       = (TOTAL / (totalMs / 1000)).toFixed(1);

  await new Promise(r => setTimeout(r, 2000));
  const counter = await getCallsUsed(API_KEY_ID);

  console.log(`\nResults:`);
  console.log(`  Total requests : ${TOTAL}`);
  console.log(`  HTTP 200       : ${ok}`);
  console.log(`  Errors         : ${errors}`);
  console.log(`  Duration       : ${(totalMs/1000).toFixed(1)}s`);
  console.log(`  Throughput     : ${rps} req/s`);
  console.log(`  Avg latency    : ${avg.toFixed(0)}ms`);
  console.log(`  p95 latency    : ${p95}ms`);
  console.log(`  p99 latency    : ${p99}ms`);
  console.log(`  callsUsed DB   : ${counter.callsUsed}`);

  const pass = avg < 200;
  console.log(`\nResult: ${pass ? '✅  PASS' : '⚠️  WARN'} — avg ${avg.toFixed(0)}ms (target <200ms)`);
  return { avg: avg.toFixed(0), p95, p99, rps, ok, errors, totalMs };
}

async function main() {
  const rateResult = await testRateLimitCounter();
  const loadResult = await loadTest();

  console.log('\n══════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════════');
  console.log(`Rate limit counter : ${rateResult.callsUsed}/100 ${rateResult.callsUsed >= 95 ? '✅' : '❌'}`);
  console.log(`Load test avg ms   : ${loadResult.avg}ms  ${parseInt(loadResult.avg) < 200 ? '✅' : '⚠️'}`);
  console.log(`Load test p95      : ${loadResult.p95}ms`);
  console.log(`Load test errors   : ${loadResult.errors}`);

  // Print JSON for doc embed
  console.log('\n--- JSON (for docs) ---');
  console.log(JSON.stringify({ rateLimit: rateResult, loadTest: loadResult }, null, 2));
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
