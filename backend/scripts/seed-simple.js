// Simple direct seeding using raw SQL over Prisma library
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

const CS2_SKINS = [
  {
    marketHashName: 'AK-47 | Phantom Disruptor',
    name: 'AK-47 | Phantom Disruptor',
    weaponType: 'Rifle',
    wear: 'Factory New',
    rarity: 'Restricted',
    priceLatest: 42.50,
    priceMedian: 41.25,
    priceAvg: 40.80,
  },
  {
    marketHashName: 'M4A4 | Howl',
    name: 'M4A4 | Howl',
    weaponType: 'Rifle',
    wear: 'Factory New',
    rarity: 'Covert',
    priceLatest: 185.00,
    priceMedian: 182.50,
    priceAvg: 180.20,
  },
  {
    marketHashName: 'AWP | Dragon Lore',
    name: 'AWP | Dragon Lore',
    weaponType: 'Sniper Rifle',
    wear: 'Factory New',
    rarity: 'Covert',
    priceLatest: 2850.00,
    priceMedian: 2825.00,
    priceAvg: 2800.00,
  },
  {
    marketHashName: 'M9 Bayonet | Crimson Web',
    name: 'M9 Bayonet | Crimson Web',
    weaponType: 'Knife',
    wear: 'Factory New',
    rarity: 'Covert',
    priceLatest: 1250.00,
    priceMedian: 1240.00,
    priceAvg: 1230.00,
  },
  {
    marketHashName: 'USP-S | Kill Confirmed',
    name: 'USP-S | Kill Confirmed',
    weaponType: 'Pistol',
    wear: 'Factory New',
    rarity: 'Restricted',
    priceLatest: 18.50,
    priceMedian: 18.25,
    priceAvg: 17.90,
  },
  {
    marketHashName: 'Glock-18 | Weasel',
    name: 'Glock-18 | Weasel',
    weaponType: 'Pistol',
    wear: 'Factory New',
    rarity: 'Restricted',
    priceLatest: 12.75,
    priceMedian: 12.50,
    priceAvg: 12.15,
  },
  {
    marketHashName: 'Karambit | Doppler',
    name: 'Karambit | Doppler',
    weaponType: 'Knife',
    wear: 'Factory New',
    rarity: 'Covert',
    priceLatest: 890.00,
    priceMedian: 875.00,
    priceAvg: 865.00,
  },
];

async function main() {
  try {
    console.log('\n=== DATABASE SEEDING (Prisma) ===\n');

    // 1. Check existing
    const counts = await Promise.all([
      prisma.skin.count(),
      prisma.priceHistory.count(),
      prisma.user.count(),
      prisma.portfolio.count(),
    ]);

    console.log('Existing data:');
    console.log(`  Skins: ${counts[0]}`);
    console.log(`  Price History: ${counts[1]}`);
    console.log(`  Users: ${counts[2]}`);
    console.log(`  Portfolios: ${counts[3]}\n`);

    // 2. Seed skins
    console.log('Creating Skins...');
    const skins = [];
    for (const skinData of CS2_SKINS) {
      const skin = await prisma.skin.upsert({
        where: { marketHashName: skinData.marketHashName },
        update: {
          priceLatest: skinData.priceLatest,
          priceMedian: skinData.priceMedian,
          priceAvg: skinData.priceAvg,
        },
        create: skinData,
      });
      skins.push(skin);
    }
    console.log(`✓ ${skins.length} skins\n`);

    // 3. Price history
    console.log('Creating Price History...');
    const today = new Date();
    let historyCount = 0;
    for (const skin of skins) {
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const variation = (Math.random() - 0.5) * 0.1;
        const price = skin.priceLatest * (1 + variation);

        try {
          await prisma.priceHistory.create({
            data: { skinId: skin.id, date, price },
          });
          historyCount++;
        } catch (e) {
          // Duplicate ignore
        }
      }
    }
    console.log(`✓ ${historyCount} entries\n`);

    // 4. Test user
    console.log('Creating Test User...');
    const testUser = await prisma.user.upsert({
      where: { email: 'test-user@cs2tracker.local' },
      update: {},
      create: {
        email: 'test-user@cs2tracker.local',
        displayName: 'Test Trader',
        clerkId: 'test-user-clerk-001',
        timezone: 'Europe/Berlin',
        emailAlerts: true,
        isPremium: false,
      },
    });
    console.log(`✓ ${testUser.email}\n`);

    // 5. Portfolio
    console.log('Creating Portfolio Items...');
    const portSkins = skins.slice(0, 7);
    let portCount = 0;
    for (const skin of portSkins) {
      try {
        const amount = Math.floor(Math.random() * 5) + 1;
        const buyPrice = skin.priceLatest * 0.9;
        const buyDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

        await prisma.portfolio.create({
          data: { userId: testUser.id, skinId: skin.id, amount, buyPrice, buyDate },
        });
        portCount++;
      } catch (e) {
        // Ignore
      }
    }
    console.log(`✓ ${portCount} items\n`);

    // 6. Subscription
    try {
      await prisma.userSubscriptions.create({
        data: {
          userId: testUser.id,
          tier: 'free',
          status: 'inactive',
          canCreatePortfolio: true,
          canAccessResearch: false,
        },
      });
      console.log(`✓ Subscription (Free)\n`);
    } catch (e) {
      console.log(`✓ Subscription exists\n`);
    }

    // Summary
    const finalCounts = await Promise.all([
      prisma.skin.count(),
      prisma.priceHistory.count(),
      prisma.user.count(),
      prisma.portfolio.count(),
    ]);

    console.log('=== SEEDING COMPLETE ===');
    console.log(`Total Skins: ${finalCounts[0]}`);
    console.log(`Total Price History: ${finalCounts[1]}`);
    console.log(`Total Users: ${finalCounts[2]}`);
    console.log(`Total Portfolios: ${finalCounts[3]}`);
    console.log(`\nTest User: test-user@cs2tracker.local`);
    console.log(`Local Dashboard: http://localhost:3000/dashboard`);
    console.log(`Stripe Test Card: 4242 4242 4242 4242\n`);

  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.code) console.error('Code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
