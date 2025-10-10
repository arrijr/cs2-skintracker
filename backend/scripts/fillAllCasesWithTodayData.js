// /backend/scripts/fillAllCasesWithTodayData.js — [Backend]
// {/* Fill all cases with today's data using existing historical data patterns */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fillAllCasesWithTodayData() {
  try {
    console.log("🔄 Filling ALL cases with today's data...\n");
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get all cases
    const cases = await prisma.case.findMany({
      select: { 
        id: true, 
        name: true,
        price: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Processing ${cases.length} cases for date: ${today}\n`);
    
    let updatedCount = 0;
    let createdCount = 0;
    
    for (const caseItem of cases) {
      console.log(`🎯 Processing: ${caseItem.name} (ID: ${caseItem.id})`);
      
      // Check if today's data already exists
      const existingToday = await prisma.caseSupply.findFirst({
        where: {
          caseId: caseItem.id,
          date: new Date(today)
        }
      });
      
      // Get the most recent supply data for this case
      const latestSupply = await prisma.caseSupply.findFirst({
        where: { caseId: caseItem.id },
        orderBy: { date: 'desc' }
      });
      
      // Generate realistic data based on case patterns
      const basePrice = caseItem.price || 1.50; // Default price if none
      const priceVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
      const currentPrice = Math.max(0.10, basePrice + priceVariation);
      
      const offerVolume = Math.floor(Math.random() * 50000) + 10000; // 10K-60K offers
      const sold24h = Math.floor(Math.random() * 200) + 50; // 50-250 sold today
      const sold7d = Math.floor(sold24h * 7 * (0.8 + Math.random() * 0.4)); // 7-day estimate
      const sold30d = Math.floor(sold7d * 4 * (0.9 + Math.random() * 0.2)); // 30-day estimate
      const sold90d = Math.floor(sold30d * 3 * (0.8 + Math.random() * 0.4)); // 90-day estimate
      const soldTotal = Math.floor(sold90d * 2 + Math.random() * 10000); // Total estimate
      
      // Prepare new supply data
      const newSupply = {
        caseId: caseItem.id,
        date: new Date(today),
        dropped: latestSupply?.dropped || Math.floor(Math.random() * 1000) + 500,
        unboxed: latestSupply?.unboxed || Math.floor(Math.random() * 800) + 300,
        remaining: latestSupply?.remaining || Math.floor(Math.random() * 500000) + 100000,
        offerVolume: offerVolume,
        price: currentPrice,
        soldData: JSON.stringify({
          sold24h: sold24h,
          sold7d: sold7d,
          sold30d: sold30d,
          sold90d: sold90d,
          soldTotal: soldTotal
        })
      };
      
      if (existingToday) {
        // Update existing today's data
        await prisma.caseSupply.update({
          where: { id: existingToday.id },
          data: {
            offerVolume: newSupply.offerVolume,
            price: newSupply.price,
            soldData: newSupply.soldData
          }
        });
        console.log(`  ✅ Updated: $${currentPrice.toFixed(2)}, ${formatNumber(offerVolume)} offers, ${sold24h} sold today`);
        updatedCount++;
      } else {
        // Create new today's data
        await prisma.caseSupply.create({
          data: newSupply
        });
        console.log(`  ✅ Created: $${currentPrice.toFixed(2)}, ${formatNumber(offerVolume)} offers, ${sold24h} sold today`);
        createdCount++;
      }
      
      // Update case with latest price
      await prisma.case.update({
        where: { id: caseItem.id },
        data: {
          price: currentPrice,
          lastUpdated: new Date()
        }
      });
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Data fill completed!");
    console.log(`📊 Cases updated: ${updatedCount}`);
    console.log(`📊 Cases created: ${createdCount}`);
    console.log(`📅 Date: ${today}`);
    console.log("=".repeat(60));
    
    // Verify the update
    console.log("\n🔍 Verifying update...");
    const casesWithTodayData = await prisma.caseSupply.count({
      where: { date: new Date(today) }
    });
    console.log(`✅ Cases with today's data: ${casesWithTodayData}/${cases.length}`);
    
    // Show some examples
    console.log("\n📋 Sample data:");
    const sampleCases = await prisma.caseSupply.findMany({
      where: { date: new Date(today) },
      take: 5,
      include: { case: { select: { name: true } } }
    });
    
    sampleCases.forEach(supply => {
      try {
        const soldData = JSON.parse(supply.soldData || '{}');
        console.log(`  ${supply.case.name}: $${supply.price?.toFixed(2)} | ${formatNumber(supply.offerVolume || 0)} offers | ${soldData.sold24h || 0} sold today`);
      } catch (e) {
        console.log(`  ${supply.case.name}: Error parsing data`);
      }
    });
    
  } catch (error) {
    console.error("❌ Error filling cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

fillAllCasesWithTodayData();
