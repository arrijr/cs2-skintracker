// /backend/scripts/generateCaseData.js — [Backend]
// {/* Generate test case data for development */}
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

const sampleCases = [
  {
    name: "Operation Bravo Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A case containing weapon finishes from the Operation Bravo collection.",
    releaseDate: new Date("2013-09-19"),
    isDiscontinued: true,
    price: 12.50,
    marketCap: 1250000,
    remaining: 50000,
    dropped: 2000000,
    unboxed: 1950000,
    timeToExtinction: 8.5,
    priceChange24h: 2.3,
    priceChange7d: -1.2,
    priceChange30d: 15.7
  },
  {
    name: "CS:GO Weapon Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "The original CS:GO weapon case containing classic finishes.",
    releaseDate: new Date("2013-08-14"),
    isDiscontinued: true,
    price: 8.75,
    marketCap: 875000,
    remaining: 75000,
    dropped: 5000000,
    unboxed: 4925000,
    timeToExtinction: 12.3,
    priceChange24h: -0.8,
    priceChange7d: 3.1,
    priceChange30d: -5.2
  },
  {
    name: "eSports 2013 Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A case featuring eSports-themed weapon finishes.",
    releaseDate: new Date("2013-08-15"),
    isDiscontinued: true,
    price: 15.20,
    marketCap: 1520000,
    remaining: 30000,
    dropped: 1000000,
    unboxed: 970000,
    timeToExtinction: 4.2,
    priceChange24h: 1.5,
    priceChange7d: 8.9,
    priceChange30d: 22.1
  },
  {
    name: "Winter Offensive Weapon Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A winter-themed case with cold weather finishes.",
    releaseDate: new Date("2014-01-27"),
    isDiscontinued: true,
    price: 6.88,
    marketCap: 2384821,
    remaining: 346631,
    dropped: 15053117,
    unboxed: 14706486,
    timeToExtinction: 17.3,
    priceChange24h: -2.1,
    priceChange7d: 4.7,
    priceChange30d: -8.3
  },
  {
    name: "Falchion Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A case featuring the Falchion knife and desert-themed finishes.",
    releaseDate: new Date("2015-05-26"),
    isDiscontinued: true,
    price: 1.72,
    marketCap: 6332610,
    remaining: 3681750,
    dropped: 57930562,
    unboxed: 54248812,
    timeToExtinction: 28.2,
    priceChange24h: 0.5,
    priceChange7d: -1.8,
    priceChange30d: 6.4
  },
  {
    name: "Shadow Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A mysterious case with dark, shadowy finishes.",
    releaseDate: new Date("2016-05-03"),
    isDiscontinued: true,
    price: 3.45,
    marketCap: 1725000,
    remaining: 150000,
    dropped: 3000000,
    unboxed: 2850000,
    timeToExtinction: 6.8,
    priceChange24h: 2.1,
    priceChange7d: -3.2,
    priceChange30d: 12.5
  },
  {
    name: "Snakebite Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A venomous case with snake-themed finishes.",
    releaseDate: new Date("2021-05-04"),
    isDiscontinued: false,
    price: 0.58,
    marketCap: 80790190,
    remaining: 139293431,
    dropped: 231559584,
    unboxed: 92266153,
    timeToExtinction: 196.6,
    priceChange24h: -0.3,
    priceChange7d: 1.2,
    priceChange30d: -2.8
  },
  {
    name: "Fracture Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A case with fractured, broken finishes.",
    releaseDate: new Date("2020-12-03"),
    isDiscontinued: false,
    price: 0.89,
    marketCap: 44500000,
    remaining: 50000000,
    dropped: 100000000,
    unboxed: 50000000,
    timeToExtinction: 45.2,
    priceChange24h: 0.8,
    priceChange7d: -2.1,
    priceChange30d: 4.7
  },
  {
    name: "Prisma Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A prismatic case with rainbow-like finishes.",
    releaseDate: new Date("2019-03-28"),
    isDiscontinued: false,
    price: 1.25,
    marketCap: 31250000,
    remaining: 25000000,
    dropped: 50000000,
    unboxed: 25000000,
    timeToExtinction: 18.7,
    priceChange24h: -1.2,
    priceChange7d: 3.4,
    priceChange30d: -7.1
  },
  {
    name: "Shattered Web Case",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZR3ibxOoMxx5sACMu7JpJiU3t3H9Q_2jYb0k_5WzYj3YQ",
    description: "A case from the Shattered Web operation.",
    releaseDate: new Date("2019-11-18"),
    isDiscontinued: false,
    price: 2.15,
    marketCap: 10750000,
    remaining: 5000000,
    dropped: 15000000,
    unboxed: 10000000,
    timeToExtinction: 9.3,
    priceChange24h: 1.7,
    priceChange7d: -4.2,
    priceChange30d: 8.9
  }
];

async function generateCaseData() {
  try {
    console.log('🎲 Generating case data...');

    // Clear existing case data
    await prisma.caseSkin.deleteMany();
    await prisma.caseSupply.deleteMany();
    await prisma.casePriceHistory.deleteMany();
    await prisma.case.deleteMany();

    // Create cases
    for (const caseData of sampleCases) {
      const createdCase = await prisma.case.create({
        data: caseData
      });

      console.log(`✅ Created case: ${createdCase.name}`);

      // Generate some sample supply data for the last 30 days
      const supplyData = [];
      const priceData = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate supply changes
        const dailyUnboxed = Math.floor(Math.random() * 1000) + 500;
        const dailyDropped = Math.floor(Math.random() * 200) + 100;
        const remaining = Math.max(0, (createdCase.remaining || 0) + (dailyDropped - dailyUnboxed) * (30 - i));
        
        // Simulate price fluctuations
        const priceVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const price = (createdCase.price || 1) * (1 + priceVariation);
        
        supplyData.push({
          caseId: createdCase.id,
          date: date,
          remaining: remaining,
          dropped: (createdCase.dropped || 0) + dailyDropped * (30 - i),
          unboxed: (createdCase.unboxed || 0) + dailyUnboxed * (30 - i),
          price: price,
          marketCap: remaining * price
        });

        priceData.push({
          caseId: createdCase.id,
          date: date,
          price: price,
          marketCap: remaining * price,
          remaining: remaining
        });
      }

      // Insert supply and price data
      await prisma.caseSupply.createMany({
        data: supplyData
      });

      await prisma.casePriceHistory.createMany({
        data: priceData
      });

      console.log(`📊 Generated supply and price data for: ${createdCase.name}`);
    }

    console.log('🎉 Case data generation completed!');
    console.log(`Created ${sampleCases.length} cases with supply and price history`);

  } catch (error) {
    console.error('❌ Error generating case data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCaseData();
}

export default generateCaseData;
