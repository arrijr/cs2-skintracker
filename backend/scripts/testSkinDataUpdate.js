// /backend/scripts/testSkinDataUpdate.js — [Backend]
// {/* Test script to check if skins have market data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSkinDataUpdate() {
  console.log("🔍 Checking skin market data status...");

  try {
    // Get first 10 skins
    const skins = await prisma.skin.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        priceLatest: true,
        priceMedian: true,
        offerVolume: true,
        sold7d: true,
        sold30d: true,
        sold90d: true,
        buyOrderVolume: true,
        buyOrderPrice: true
      }
    });

    console.log("\n📊 FIRST 10 SKINS DATA STATUS:");
    console.log("================================================================================");

    let skinsWithPrice = 0;
    let skinsWithOfferVolume = 0;
    let skinsWithSales = 0;
    let skinsWithBuyOrders = 0;

    for (const skin of skins) {
      const hasPrice = skin.priceLatest || skin.priceMedian;
      const hasOfferVolume = skin.offerVolume && skin.offerVolume > 0;
      const hasSales = skin.sold7d || skin.sold30d || skin.sold90d;
      const hasBuyOrders = skin.buyOrderVolume && skin.buyOrderVolume > 0;

      if (hasPrice) skinsWithPrice++;
      if (hasOfferVolume) skinsWithOfferVolume++;
      if (hasSales) skinsWithSales++;
      if (hasBuyOrders) skinsWithBuyOrders++;

      console.log(
        `${String(skin.id).padStart(5)} | ${skin.name.padEnd(40)} | ` +
        `${hasPrice ? '💰' : '❌'} Price | ` +
        `${hasOfferVolume ? '📦' : '❌'} Offer | ` +
        `${hasSales ? '📈' : '❌'} Sales | ` +
        `${hasBuyOrders ? '💵' : '❌'} Orders`
      );
    }

    console.log("\n📈 SUMMARY:");
    console.log("==================================================");
    console.log(`Skins with price data: ${skinsWithPrice}/10`);
    console.log(`Skins with offer volume: ${skinsWithOfferVolume}/10`);
    console.log(`Skins with sales data: ${skinsWithSales}/10`);
    console.log(`Skins with buy orders: ${skinsWithBuyOrders}/10`);

    // Get total counts
    const totalWithPrice = await prisma.skin.count({
      where: {
        OR: [
          { priceLatest: { not: null, gt: 0 } },
          { priceMedian: { not: null, gt: 0 } }
        ]
      }
    });

    const totalWithOfferVolume = await prisma.skin.count({
      where: { offerVolume: { not: null, gt: 0 } }
    });

    const totalWithSales = await prisma.skin.count({
      where: {
        OR: [
          { sold7d: { not: null, gt: 0 } },
          { sold30d: { not: null, gt: 0 } }
        ]
      }
    });

    const totalSkins = await prisma.skin.count();

    console.log("\n📊 TOTAL DATABASE STATUS:");
    console.log("==================================================");
    console.log(`Total skins: ${totalSkins}`);
    console.log(`Skins with price data: ${totalWithPrice} (${((totalWithPrice / totalSkins) * 100).toFixed(1)}%)`);
    console.log(`Skins with offer volume: ${totalWithOfferVolume} (${((totalWithOfferVolume / totalSkins) * 100).toFixed(1)}%)`);
    console.log(`Skins with sales data: ${totalWithSales} (${((totalWithSales / totalSkins) * 100).toFixed(1)}%)`);

    if (totalWithPrice === 0) {
      console.log("\n⚠️  WARNING: No skins have price data!");
      console.log("💡 Run updateSkinPrices.js or updateAllSkinsMarketData.js to populate data");
    }

  } catch (error) {
    console.error("❌ Error checking skin data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSkinDataUpdate();

