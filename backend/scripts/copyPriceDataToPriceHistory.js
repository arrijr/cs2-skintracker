// /backend/scripts/copyPriceDataToPriceHistory.js — [Backend]
// {/* Copy real price data from CaseSupply to CasePriceHistory table */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function copyPriceDataToPriceHistory() {
  console.log("📊 Copying real price data from CaseSupply to CasePriceHistory...");

  try {
    const cases = await prisma.case.findMany({
      select: { id: true, name: true }
    });

    console.log(`📊 Found ${cases.length} cases in database`);

    for (const caseItem of cases) {
      console.log(`\n📈 Processing: ${caseItem.name}`);

      try {
        // Get all supply data with price information
        const supplyData = await prisma.caseSupply.findMany({
          where: { 
            caseId: caseItem.id,
            price: { not: null } // Only entries with price data
          },
          orderBy: { date: 'asc' }
        });

        if (supplyData.length === 0) {
          console.log(`  ⚠️ No price data found in CaseSupply for ${caseItem.name}`);
          continue;
        }

        console.log(`  📊 Found ${supplyData.length} supply entries with price data`);

        // Clear existing price history
        await prisma.casePriceHistory.deleteMany({
          where: { caseId: caseItem.id }
        });

        // Copy price data to CasePriceHistory
        const priceHistoryEntries = supplyData.map(supply => ({
          caseId: supply.caseId,
          date: supply.date,
          price: supply.price,
          marketCap: supply.marketCap,
          remaining: supply.remaining
        }));

        await prisma.casePriceHistory.createMany({
          data: priceHistoryEntries
        });

        console.log(`  ✅ Copied ${priceHistoryEntries.length} price history entries`);

        // Show sample of copied data
        const sampleEntry = supplyData[0];
        const lastEntry = supplyData[supplyData.length - 1];
        console.log(`  📅 Date range: ${sampleEntry.date.toISOString().split('T')[0]} to ${lastEntry.date.toISOString().split('T')[0]}`);
        console.log(`  💰 Price range: $${Math.min(...supplyData.map(s => s.price)).toFixed(2)} to $${Math.max(...supplyData.map(s => s.price)).toFixed(2)}`);

      } catch (error) {
        console.log(`  ❌ Error processing ${caseItem.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Price data copy to CasePriceHistory completed!`);

  } catch (error) {
    console.error("❌ Error copying price data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

copyPriceDataToPriceHistory();
