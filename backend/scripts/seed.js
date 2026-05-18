import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Static CS2 Skin Data (mit realistischen Werten)
const CS2_SKINS = [
  {
    name: 'AK-47 | Phantom Disruptor',
    marketHashName: 'AK-47 | Phantom Disruptor',
    weaponType: 'Rifle',
    collection: 'Revolution Collection',
    wear: 'Factory New',
    rarity: 'Restricted',
    quality: 'Weapon',
    isStattrak: false,
    isStar: false,
    itemType: 'Rifle',
    itemName: 'AK-47',
    itemGroup: 'rifle',
    priceLatest: 42.50,
    priceMedian: 41.25,
    priceAvg: 40.80,
    priceSafe: 39.19,
    priceMin: 38.00,
    priceMax: 48.50,
    soldToday: 145,
    sold24h: 145,
    sold7d: 892,
    sold30d: 3240,
    hoursToSold: 2.3,
  },
  {
    name: 'M4A4 | Howl',
    marketHashName: 'M4A4 | Howl',
    weaponType: 'Rifle',
    collection: 'Souvenir Collection',
    wear: 'Factory New',
    rarity: 'Covert',
    quality: 'Weapon',
    isStattrak: false,
    isStar: false,
    itemType: 'Rifle',
    itemName: 'M4A4',
    itemGroup: 'rifle',
    priceLatest: 185.00,
    priceMedian: 182.50,
    priceAvg: 180.20,
    priceSafe: 173.38,
    priceMin: 165.00,
    priceMax: 210.00,
    soldToday: 23,
    sold24h: 23,
    sold7d: 156,
    sold30d: 540,
    hoursToSold: 8.5,
  },
  {
    name: 'AWP | Dragon Lore',
    marketHashName: 'AWP | Dragon Lore',
    weaponType: 'Sniper Rifle',
    collection: 'Legendary Collection',
    wear: 'Factory New',
    rarity: 'Covert',
    quality: 'Weapon',
    isStattrak: false,
    isStar: false,
    itemType: 'Sniper Rifle',
    itemName: 'AWP Dragon Lore',
    itemGroup: 'sniper',
    priceLatest: 2850.00,
    priceMedian: 2825.00,
    priceAvg: 2800.00,
    priceSafe: 2683.75,
    priceMin: 2600.00,
    priceMax: 3100.00,
    soldToday: 2,
    sold24h: 2,
    sold7d: 18,
    sold30d: 45,
    hoursToSold: 15.2,
  },
  {
    name: 'M9 Bayonet | Crimson Web',
    marketHashName: 'M9 Bayonet | Crimson Web',
    weaponType: 'Knife',
    collection: 'Knife Collection',
    wear: 'Factory New',
    rarity: 'Covert',
    quality: 'Knife',
    isStattrak: false,
    isStar: true,
    itemType: 'Knife',
    itemName: 'M9 Bayonet',
    itemGroup: 'knife',
    priceLatest: 1250.00,
    priceMedian: 1240.00,
    priceAvg: 1230.00,
    priceSafe: 1167.00,
    priceMin: 1100.00,
    priceMax: 1400.00,
    soldToday: 1,
    sold24h: 1,
    sold7d: 12,
    sold30d: 32,
    hoursToSold: 12.0,
  },
  {
    name: 'USP-S | Kill Confirmed',
    marketHashName: 'USP-S | Kill Confirmed',
    weaponType: 'Pistol',
    collection: 'Defuse Collection',
    wear: 'Factory New',
    rarity: 'Restricted',
    quality: 'Weapon',
    isStattrak: false,
    isStar: false,
    itemType: 'Pistol',
    itemName: 'USP-S',
    itemGroup: 'pistol',
    priceLatest: 18.50,
    priceMedian: 18.25,
    priceAvg: 17.90,
    priceSafe: 17.34,
    priceMin: 16.50,
    priceMax: 22.00,
    soldToday: 234,
    sold24h: 234,
    sold7d: 1456,
    sold30d: 5680,
    hoursToSold: 1.8,
  },
  {
    name: 'Glock-18 | Weasel',
    marketHashName: 'Glock-18 | Weasel',
    weaponType: 'Pistol',
    collection: 'Ancient Collection',
    wear: 'Factory New',
    rarity: 'Restricted',
    quality: 'Weapon',
    isStattrak: false,
    isStar: false,
    itemType: 'Pistol',
    itemName: 'Glock-18',
    itemGroup: 'pistol',
    priceLatest: 12.75,
    priceMedian: 12.50,
    priceAvg: 12.15,
    priceSafe: 11.88,
    priceMin: 11.25,
    priceMax: 15.50,
    soldToday: 312,
    sold24h: 312,
    sold7d: 2145,
    sold30d: 8230,
    hoursToSold: 1.5,
  },
  {
    name: 'Karambit | Doppler',
    marketHashName: 'Karambit | Doppler',
    weaponType: 'Knife',
    collection: 'Knife Collection',
    wear: 'Factory New',
    rarity: 'Covert',
    quality: 'Knife',
    isStattrak: false,
    isStar: true,
    itemType: 'Knife',
    itemName: 'Karambit',
    itemGroup: 'knife',
    priceLatest: 890.00,
    priceMedian: 875.00,
    priceAvg: 865.00,
    priceSafe: 831.25,
    priceMin: 800.00,
    priceMax: 950.00,
    soldToday: 3,
    sold24h: 3,
    sold7d: 21,
    sold30d: 56,
    hoursToSold: 10.5,
  },
  {
    name: 'MAC-10 | Heat',
    marketHashName: 'MAC-10 | Heat',
    weaponType: 'SMG',
    collection: 'Ancient Collection',
    wear: 'Factory New',
    rarity: 'Classified',
    quality: 'Weapon',
    isStattrak: false,
    isStar: false,
    itemType: 'SMG',
    itemName: 'MAC-10',
    itemGroup: 'smg',
    priceLatest: 35.50,
    priceMedian: 34.75,
    priceAvg: 34.20,
    priceSafe: 33.01,
    priceMin: 31.00,
    priceMax: 42.00,
    soldToday: 89,
    sold24h: 89,
    sold7d: 523,
    sold30d: 1890,
    hoursToSold: 3.2,
  },
  {
    name: 'StatTrak M4A4 | Phantom Disruptor',
    marketHashName: 'StatTrak™ M4A4 | Phantom Disruptor',
    weaponType: 'Rifle',
    collection: 'Revolution Collection',
    wear: 'Factory New',
    rarity: 'Restricted',
    quality: 'Weapon',
    isStattrak: true,
    isStar: false,
    itemType: 'Rifle',
    itemName: 'M4A4',
    itemGroup: 'rifle',
    priceLatest: 125.00,
    priceMedian: 122.50,
    priceAvg: 120.80,
    priceSafe: 116.38,
    priceMin: 110.00,
    priceMax: 145.00,
    soldToday: 34,
    sold24h: 34,
    sold7d: 215,
    sold30d: 780,
    hoursToSold: 5.8,
  },
  {
    name: 'Butterfly Knife | Fade',
    marketHashName: 'Butterfly Knife | Fade',
    weaponType: 'Knife',
    collection: 'Knife Collection',
    wear: 'Factory New',
    rarity: 'Covert',
    quality: 'Knife',
    isStattrak: false,
    isStar: true,
    itemType: 'Knife',
    itemName: 'Butterfly Knife',
    itemGroup: 'knife',
    priceLatest: 720.00,
    priceMedian: 705.00,
    priceAvg: 695.00,
    priceSafe: 670.25,
    priceMin: 650.00,
    priceMax: 800.00,
    soldToday: 4,
    sold24h: 4,
    sold7d: 28,
    sold30d: 78,
    hoursToSold: 9.0,
  },
];

async function main() {
  try {
    console.log('\n=== DATABASE SEEDING ===\n');

    // Check existing data
    const existingSkinCount = await prisma.skin.count();
    const existingUserCount = await prisma.user.count();
    const existingPortfolioCount = await prisma.portfolio.count();

    console.log(`Existing Skins: ${existingSkinCount}`);
    console.log(`Existing Users: ${existingUserCount}`);
    console.log(`Existing Portfolios: ${existingPortfolioCount}\n`);

    // 1. Create or fetch skins
    console.log('Creating Skins...');
    const skins = [];
    for (const skinData of CS2_SKINS) {
      const skin = await prisma.skin.upsert({
        where: { marketHashName: skinData.marketHashName },
        update: skinData,
        create: skinData,
      });
      skins.push(skin);
    }
    console.log(`✓ ${skins.length} skins created/updated\n`);

    // 2. Create price history (30 days back)
    console.log('Creating Price History (30 days)...');
    const today = new Date();
    let historyCount = 0;

    for (const skin of skins) {
      // Generate 30 days of price history
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        // Realistic price variation (±5%)
        const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
        const price = skin.priceLatest * (1 + variation);

        // Check if entry already exists
        const exists = await prisma.priceHistory.findFirst({
          where: {
            skinId: skin.id,
            date: {
              gte: new Date(date.getTime()),
              lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!exists) {
          await prisma.priceHistory.create({
            data: {
              skinId: skin.id,
              date,
              price,
            },
          });
          historyCount++;
        }
      }
    }
    console.log(`✓ ${historyCount} price history entries created\n`);

    // 3. Create test user
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
        pushAlerts: false,
        isPremium: false,
      },
    });
    console.log(`✓ Test User created: ${testUser.email} (ID: ${testUser.id})\n`);

    // 4. Create test portfolio (5-10 random skins)
    console.log('Creating Test Portfolio...');
    const portfolioSkins = skins.slice(0, 7); // Take first 7 skins

    let portfolioCount = 0;
    for (const skin of portfolioSkins) {
      // Check if portfolio entry already exists
      const exists = await prisma.portfolio.findFirst({
        where: {
          userId: testUser.id,
          skinId: skin.id,
        },
      });

      if (!exists) {
        const amount = Math.floor(Math.random() * 5) + 1; // 1-5 items
        const buyPrice = skin.priceLatest * (1 - 0.1 * Math.random()); // 0-10% cheaper than current

        await prisma.portfolio.create({
          data: {
            userId: testUser.id,
            skinId: skin.id,
            amount,
            buyPrice,
            buyDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
          },
        });
        portfolioCount++;
      }
    }
    console.log(`✓ ${portfolioCount} portfolio items created\n`);

    // 5. Create or update user subscription
    console.log('Creating User Subscription (Free Tier)...');
    await prisma.userSubscriptions.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        tier: 'free',
        status: 'inactive',
        canCreatePortfolio: true,
        canAccessResearch: false,
        canExportCSV: false,
      },
    });
    console.log(`✓ Subscription created (Free Tier)\n`);

    // Summary
    console.log('\n=== SEEDING COMPLETE ===');
    console.log(`Total Skins in DB: ${await prisma.skin.count()}`);
    console.log(`Total Price History Entries: ${await prisma.priceHistory.count()}`);
    console.log(`Total Users: ${await prisma.user.count()}`);
    console.log(`Total Portfolios: ${await prisma.portfolio.count()}`);
    console.log(`\nTest User Credentials:`);
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Clerk ID: ${testUser.clerkId}`);
    console.log(`  Portfolio Value: ${portfolioCount} items`);
    console.log(`\nLocal Dev URL: http://localhost:3000`);
    console.log(`Portfolio Dashboard: http://localhost:3000/dashboard`);
    console.log(`\nStripe Test Card: 4242 4242 4242 4242 (exp: 12/25, CVC: 123)`);

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
