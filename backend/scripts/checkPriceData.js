import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPriceData() {
  console.log("🔍 Checking price data...");
  
  // Check skins with prices
  const skinsWithPrices = await prisma.skin.findMany({
    where: {
      OR: [
        { priceLatest: { not: null } },
        { priceMedian: { not: null } },
        { priceAvg: { not: null } }
      ]
    },
    take: 5,
    select: {
      id: true,
      name: true,
      marketHashName: true,
      priceLatest: true,
      priceMedian: true,
      priceAvg: true
    }
  });
  
  console.log("✅ Skins with prices:", skinsWithPrices.length);
  console.log("Sample skins with prices:");
  console.log(JSON.stringify(skinsWithPrices, null, 2));
  
  // Check skins without prices
  const skinsWithoutPrices = await prisma.skin.findMany({
    where: {
      AND: [
        { priceLatest: null },
        { priceMedian: null },
        { priceAvg: null }
      ]
    },
    take: 5,
    select: {
      id: true,
      name: true,
      marketHashName: true
    }
  });
  
  console.log("\n❌ Skins without prices:", skinsWithoutPrices.length);
  console.log("Sample skins without prices:");
  console.log(JSON.stringify(skinsWithoutPrices, null, 2));
  
  // Check price history
  const priceHistoryCount = await prisma.priceHistory.count();
  console.log("\n📊 Price History entries:", priceHistoryCount);
  
  if (priceHistoryCount > 0) {
    const sampleHistory = await prisma.priceHistory.findMany({
      take: 3,
      select: {
        skinId: true,
        date: true,
        price: true
      }
    });
    console.log("Sample price history:");
    console.log(JSON.stringify(sampleHistory, null, 2));
  }
  
  await prisma.$disconnect();
}

checkPriceData().catch(console.error);
