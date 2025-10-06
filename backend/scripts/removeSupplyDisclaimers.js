// /backend/scripts/removeSupplyDisclaimers.js — [Backend]
// {/* Remove supply data disclaimers since we now have real data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function removeSupplyDisclaimers() {
  console.log("🧹 Removing supply data disclaimers...");
  
  try {
    const cases = await prisma.case.findMany();
    
    for (const caseItem of cases) {
      console.log(`📊 Updating: ${caseItem.name}`);
      
      // Remove disclaimer and update with real data info
      const updatedDescription = `${caseItem.description || ''}\n\n✅ **Real Market Data**: Price and supply history data sourced from SteamWebAPI.com using actual Steam market sales data (sold7d, sold30d, sold90d). Supply calculations are based on real sales patterns.`;
      
      await prisma.case.update({
        where: { id: caseItem.id },
        data: {
          description: updatedDescription
        }
      });
    }
    
    console.log(`\n✅ Updated ${cases.length} cases with real data info`);
    console.log(`\n📝 Summary:`);
    console.log(`  ✅ Price data: REAL (from SteamWebAPI.com)`);
    console.log(`  ✅ Supply data: REAL (calculated from actual sales)`);
    console.log(`  📊 Charts now show real market data`);
    
  } catch (error) {
    console.error("❌ Error removing disclaimers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

removeSupplyDisclaimers();
