// /backend/scripts/testCaseData.js — [Backend]
// {/* Test all case data including contained skins */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCaseData() {
  console.log("🧪 Testing all case data...");

  try {
    const caseName = "Operation Breakout Weapon Case";
    const caseItem = await prisma.case.findUnique({
      where: { name: caseName },
      include: {
        caseSupply: {
          orderBy: { date: 'desc' },
          take: 5
        },
        casePriceHistory: {
          orderBy: { date: 'desc' },
          take: 5
        },
        caseSkins: {
          include: {
            skin: {
              select: {
                id: true,
                name: true,
                rarity: true,
                priceLatest: true
              }
            }
          }
        }
      }
    });

    if (!caseItem) {
      console.log(`Case not found: ${caseName}`);
      return;
    }

    console.log(`\n📊 Case: ${caseItem.name}`);
    console.log(`💰 Current case price: $${caseItem.price?.toFixed(2) || 'N/A'}`);
    console.log(`📈 Market Cap: $${caseItem.marketCap?.toLocaleString() || 'N/A'}`);
    console.log(`📦 Remaining Supply: ${caseItem.remaining?.toLocaleString() || 'N/A'}`);
    console.log(`📦 Total Dropped: ${caseItem.dropped?.toLocaleString() || 'N/A'}`);
    console.log(`📦 Total Unboxed: ${caseItem.unboxed?.toLocaleString() || 'N/A'}`);
    
    // Calculate unbox rate
    const totalSupply = (caseItem.dropped || 0) + (caseItem.unboxed || 0);
    const unboxRate = totalSupply > 0 ? ((caseItem.unboxed || 0) / totalSupply * 100).toFixed(1) : '0';
    console.log(`🎲 Unbox Rate: ${unboxRate}%`);

    console.log(`\n📈 Recent Supply Data:`);
    caseItem.caseSupply.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.date.toISOString().split('T')[0]}: Price=$${entry.price?.toFixed(2) || 'N/A'}, OfferVolume=${entry.offerVolume?.toLocaleString() || 'N/A'}`);
    });

    console.log(`\n📈 Recent Price History:`);
    caseItem.casePriceHistory.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.date.toISOString().split('T')[0]}: Price=$${entry.price?.toFixed(2) || 'N/A'}, MarketCap=$${entry.marketCap?.toLocaleString() || 'N/A'}`);
    });

    console.log(`\n🎨 Contained Skins (${caseItem.caseSkins.length}):`);
    caseItem.caseSkins.forEach((caseSkin, index) => {
      console.log(`  ${index + 1}. ${caseSkin.skin.name} (${caseSkin.skin.rarity}) - $${caseSkin.skin.priceLatest?.toFixed(2) || 'N/A'}`);
    });

    // Check data consistency
    console.log(`\n🔍 Data Consistency Check:`);
    console.log(`  Supply data entries: ${caseItem.caseSupply.length}`);
    console.log(`  Price history entries: ${caseItem.casePriceHistory.length}`);
    console.log(`  Contained skins: ${caseItem.caseSkins.length}`);
    
    // Check if prices match between tables
    const latestSupply = caseItem.caseSupply[0];
    const latestPrice = caseItem.casePriceHistory[0];
    
    if (latestSupply && latestPrice) {
      const priceMatch = Math.abs((latestSupply.price || 0) - (latestPrice.price || 0)) < 0.01;
      console.log(`  Price sync between tables: ${priceMatch ? '✅' : '❌'}`);
      if (!priceMatch) {
        console.log(`    Supply price: $${latestSupply.price?.toFixed(2)}`);
        console.log(`    History price: $${latestPrice.price?.toFixed(2)}`);
      }
    }

  } catch (error) {
    console.error("❌ Error testing case data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCaseData();

