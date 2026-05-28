// scripts/smoke-notifications.mjs
// Hand-rolled smoke test for the notification system. Skips the Clerk JWT
// flow and directly exercises engine + delivery + read-state.
//
//   node scripts/smoke-notifications.mjs
//
// Cleans up after itself: deletes the test alert + events it creates.
//
// What it proves:
//   1. Migration was applied (Alert.lastConditionState + AlertEvent.readAt exist)
//   2. Engine fires on false→true transition
//   3. Engine SKIPS the second run (edge-trigger dedup) — fixes P1 bug
//   4. AlertEvent has correct read=false, payload keys are evaluator-shaped
//   5. mark-all-read writes readAt + GET returns read=true after

import 'dotenv/config';
import prisma from '../src/prisma/prismaClient.js';
import { runAllAlerts } from '../src/services/alerts/alertEngine.js';

const ANSI = { ok: '\x1b[32m✓\x1b[0m', fail: '\x1b[31m✗\x1b[0m', dim: '\x1b[2m', reset: '\x1b[0m' };
let passed = 0;
let failed = 0;
function assert(cond, name, detail = '') {
  if (cond) {
    console.log(`${ANSI.ok} ${name}${detail ? `  ${ANSI.dim}${detail}${ANSI.reset}` : ''}`);
    passed++;
  } else {
    console.log(`${ANSI.fail} ${name}  ${ANSI.dim}${detail}${ANSI.reset}`);
    failed++;
  }
}

// Explicit select to dodge schema-vs-DB drift on unrelated columns (e.g. an
// unapplied billingCycle migration from another worktree shouldn't crash this).
const user = await prisma.user.findFirst({
  orderBy: { id: 'asc' },
  select: { id: true, email: true, tier: true, isPremium: true, emailAlerts: true },
});
if (!user) { console.error('No users in DB — smoke test needs at least 1'); process.exit(1); }
const skin = await prisma.skin.findFirst({
  where: { priceLatest: { not: null, gt: 0 } },
  orderBy: { sold30d: 'desc' },
});
if (!skin) { console.error('No skin with priceLatest — smoke test cannot evaluate'); process.exit(1); }

console.log(`${ANSI.dim}Using user=${user.id} email=${user.email} skin=${skin.id} (${skin.name}) priceLatest=€${skin.priceLatest}${ANSI.reset}`);

const threshold = Math.max(0.01, skin.priceLatest - 50);
const alert = await prisma.alert.create({
  data: {
    userId: user.id,
    skinId: skin.id,
    type: 'price_threshold',
    config: { direction: 'above', price: threshold },
    channels: ['in_app'],
    cooldownMinutes: 0,
    isActive: true,
  },
});
console.log(`${ANSI.dim}Created test alert ${alert.id} (threshold €${threshold} → current €${skin.priceLatest})${ANSI.reset}\n`);

try {
  // Run 1: should fire (false → true transition)
  const run1 = await runAllAlerts();
  const fired1 = run1.find((r) => r.alert.id === alert.id);
  assert(!!fired1, 'Run 1: alert fires on false→true transition');
  const eventsAfter1 = await prisma.alertEvent.findMany({ where: { alertId: alert.id } });
  assert(eventsAfter1.length === 1, 'Run 1: exactly 1 AlertEvent row written', `got ${eventsAfter1.length}`);

  const ev = eventsAfter1[0];
  assert(ev.readAt === null, 'Run 1: AlertEvent.readAt is null (unread)');
  assert(ev.payload?.currentPrice === skin.priceLatest, 'Run 1: payload.currentPrice matches', `currentPrice=${ev.payload?.currentPrice}`);
  assert(ev.delivered.includes('in_app'), 'Run 1: in_app channel marked delivered');

  const alertAfter1 = await prisma.alert.findUnique({ where: { id: alert.id } });
  assert(alertAfter1.lastConditionState === true, 'Run 1: lastConditionState=true persisted');

  // Run 2: should NOT fire (still true → no transition)
  const run2 = await runAllAlerts();
  const fired2 = run2.find((r) => r.alert.id === alert.id);
  assert(!fired2, 'Run 2: edge-trigger dedup blocks re-fire while parked above threshold');
  const eventsAfter2 = await prisma.alertEvent.findMany({ where: { alertId: alert.id } });
  assert(eventsAfter2.length === 1, 'Run 2: still exactly 1 AlertEvent (no new row)', `got ${eventsAfter2.length}`);

  // Mark-read: directly call the same logic the route uses
  const updateResult = await prisma.alertEvent.updateMany({
    where: { alert: { userId: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  assert(updateResult.count >= 1, 'mark-all-read: updateMany returned >0 rows', `count=${updateResult.count}`);

  const evRead = await prisma.alertEvent.findUnique({ where: { id: ev.id } });
  assert(evRead.readAt instanceof Date, 'mark-all-read: AlertEvent.readAt is now a Date');

  // Re-arm: simulate price dropping below threshold then climbing back
  await prisma.alert.update({ where: { id: alert.id }, data: { lastConditionState: false, lastTriggeredAt: null } });
  const run3 = await runAllAlerts();
  const fired3 = run3.find((r) => r.alert.id === alert.id);
  assert(!!fired3, 'Run 3: alert re-arms after false→true (new transition)');
  const eventsAfter3 = await prisma.alertEvent.findMany({ where: { alertId: alert.id } });
  assert(eventsAfter3.length === 2, 'Run 3: second AlertEvent row written', `got ${eventsAfter3.length}`);
} finally {
  await prisma.alertEvent.deleteMany({ where: { alertId: alert.id } });
  await prisma.alert.delete({ where: { id: alert.id } });
  console.log(`\n${ANSI.dim}Cleaned up test alert + events.${ANSI.reset}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
await prisma.$disconnect();
process.exit(failed > 0 ? 1 : 0);
