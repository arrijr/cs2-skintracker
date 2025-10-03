// /backend/scripts/simpleCaseUpdate.js — [Backend]
// {/* Simple case data update */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function simpleCaseUpdate() {
  try {
    console.log("🎲 Updating case data...");

    // Get all cases
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);

    for (const caseItem of cases) {
      try {
        // Generate realistic data
        const basePrice = Math.random() * 10 + 0.5; // $0.50 - $10.50
        const skinCount = Math.floor(Math.random() * 50) + 10; // 10-60 skins
        const marketCap = basePrice * skinCount * 1000; // Scale up for realism
        
        const totalDropped = Math.floor(Math.random() * 1000000) + 100000;
        const unboxRate = 0.6 + Math.random() * 0.3; // 60-90%
        const totalUnboxed = Math.floor(totalDropped * unboxRate);
        const remaining = totalDropped - totalUnboxed;

        const timeToExtinction = caseItem.isDiscontinued ? 0 : Math.random() * 200 + 10;

        const updateData = {
          price: basePrice,
          marketCap: marketCap,
          remaining: remaining,
          dropped: totalDropped,
          unboxed: totalUnboxed,
          timeToExtinction: timeToExtinction,
          priceChange24h: (Math.random() - 0.5) * 10,
          priceChange7d: (Math.random() - 0.5) * 20,
          priceChange30d: (Math.random() - 0.5) * 30,
          lastUpdated: new Date()
        };

        await prisma.case.update({
          where: { id: caseItem.id },
          data: updateData
        });

        console.log(`✅ Updated: ${caseItem.name} - $${basePrice.toFixed(2)} (${skinCount} skins)`);

      } catch (error) {
        console.error(`❌ Error updating ${caseItem.name}:`, error.message);
      }
    }

    console.log("🎉 Case data update completed!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCaseUpdate();
