// /backend/scripts/markSupplyAsEstimated.js — [Backend]
// {/* Mark supply data as estimated and add disclaimer */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function markSupplyAsEstimated() {
  console.log("⚠️ Marking supply data as estimated...");
  
  try {
    // Update all cases to mark supply data as estimated
    const cases = await prisma.case.findMany();
    
    for (const caseItem of cases) {
      console.log(`📊 Updating: ${caseItem.name}`);
      
      // Update case description to include disclaimer
      const updatedDescription = `${caseItem.description || ''}\n\n⚠️ **Supply History Disclaimer**: The supply data (drops, unboxings, remaining supply) shown in the charts are estimated calculations based on case age and market patterns. These are not real historical data as Steam does not provide public access to actual case drop/unboxing statistics. Price data, however, is real and sourced from SteamWebAPI.com.`;
      
      await prisma.case.update({
        where: { id: caseItem.id },
        data: {
          description: updatedDescription
        }
      });
    }
    
    console.log(`\n✅ Updated ${cases.length} cases with supply data disclaimer`);
    console.log(`\n📝 Summary:`);
    console.log(`  ✅ Price data: REAL (from SteamWebAPI.com)`);
    console.log(`  ⚠️ Supply data: ESTIMATED (no public API available)`);
    console.log(`  📊 Charts now clearly indicate estimated vs real data`);
    
  } catch (error) {
    console.error("❌ Error marking supply as estimated:", error);
  } finally {
    await prisma.$disconnect();
  }
}

markSupplyAsEstimated();
