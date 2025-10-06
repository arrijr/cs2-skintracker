// /backend/scripts/testPriceHistory.js — [Backend]
// {/* Test price history data in CaseSupply entries */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPriceHistory() {
  console.log("🧪 Testing price history data...");

  try {
    const caseName = "Operation Breakout Weapon Case";
    const caseItem = await prisma.case.findUnique({
      where: { name: caseName },
      include: {
        caseSupply: {
          orderBy: { date: 'asc' },
          take: 10
        }
      }
    });

    if (!caseItem) {
      console.log(`Case not found: ${caseName}`);
      return;
    }

    console.log(`\n📊 Case: ${caseItem.name}`);
    console.log(`💰 Current case price: $${caseItem.price?.toFixed(2) || 'N/A'}`);
    console.log(`📈 Supply entries with prices:`);

    caseItem.caseSupply.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.date.toISOString().split('T')[0]}: Price=$${entry.price?.toFixed(2) || 'N/A'}, MarketCap=$${entry.marketCap?.toFixed(0) || 'N/A'}`);
    });

    // Check if we have price data
    const entriesWithPrices = caseItem.caseSupply.filter(e => e.price && e.price > 0);
    console.log(`\n📊 Summary:`);
    console.log(`  Total entries: ${caseItem.caseSupply.length}`);
    console.log(`  Entries with prices: ${entriesWithPrices.length}`);
    
    if (entriesWithPrices.length > 0) {
      const prices = entriesWithPrices.map(e => e.price);
      console.log(`  Price range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`);
      console.log(`  Average price: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
    }

  } catch (error) {
    console.error("❌ Error testing price history:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPriceHistory();
