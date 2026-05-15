/**
 * Sprint 1 — Price History Seeder
 * Generates 90 days of realistic daily price history for every skin in the DB.
 *
 * Usage: node scripts/seed-price-history.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Simulate a realistic price walk using geometric Brownian motion.
 * daily volatility ≈ 2-5 % (higher for cheap skins, lower for expensive)
 * slight upward drift to mimic CS2 market
 */
function generatePriceHistory(basePrice, days = 90) {
  // Volatility inversely scales with price (cheap skins are more volatile)
  const dailyVol = basePrice < 5
    ? 0.045
    : basePrice < 50
    ? 0.028
    : basePrice < 500
    ? 0.018
    : 0.012;

  const dailyDrift = 0.0003; // ~11 % annual upward drift

  const prices = [];
  let price = basePrice;

  // Walk backwards from today so index 0 = 90 days ago
  // First build forward in time
  const rawPrices = [basePrice * (0.88 + Math.random() * 0.24)]; // start ±12 %
  for (let i = 1; i < days; i++) {
    const shock = (Math.random() - 0.5) * 2 * dailyVol;
    rawPrices.push(rawPrices[i - 1] * (1 + dailyDrift + shock));
  }

  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    // Zero out time component so unique constraint [skinId, date] works
    date.setHours(0, 0, 0, 0);
    prices.push({ date, price: Math.max(0.03, parseFloat(rawPrices[i].toFixed(4))) });
  }

  return prices;
}

async function main() {
  console.log('📈  Generating 90-day price history...\n');

  const skins = await prisma.skin.findMany({
    select: { id: true, name: true, priceAvg: true }
  });

  if (skins.length === 0) {
    console.error('No skins found — run seed-skins.js first.');
    process.exit(1);
  }

  console.log(`Found ${skins.length} skins. Generating history...`);

  let totalRows = 0;
  const BATCH = 500; // rows per DB write

  for (const skin of skins) {
    const history = generatePriceHistory(skin.priceAvg ?? 1, 90);

    // Upsert each day (idempotent re-runs)
    const rows = history.map(h => ({
      skinId: skin.id,
      date: h.date,
      price: h.price,
    }));

    // Insert in batches
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      await prisma.$transaction(
        batch.map(r =>
          prisma.priceHistory.upsert({
            where: { skinId_date: { skinId: r.skinId, date: r.date } },
            update: { price: r.price },
            create: r,
          })
        )
      );
      totalRows += batch.length;
    }

    // Update aggregate stats on skin while we're here
    const prices = history.map(h => h.price);
    const avg7d  = prices.slice(-7).reduce((s, p) => s + p, 0) / 7;
    const avg30d = prices.slice(-30).reduce((s, p) => s + p, 0) / 30;
    const avg90d = prices.reduce((s, p) => s + p, 0) / 90;
    await prisma.skin.update({
      where: { id: skin.id },
      data: {
        priceAvg7d:  parseFloat(avg7d.toFixed(4)),
        priceAvg30d: parseFloat(avg30d.toFixed(4)),
        priceAvg90d: parseFloat(avg90d.toFixed(4)),
        priceMin:    parseFloat(Math.min(...prices).toFixed(4)),
        priceMax:    parseFloat(Math.max(...prices).toFixed(4)),
      }
    });
  }

  console.log(`✅  Inserted ${totalRows} price history rows across ${skins.length} skins`);

  const total = await prisma.priceHistory.count();
  console.log(`\n📊  PriceHistory table total: ${total} rows`);
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
