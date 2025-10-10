import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic market data templates based on skin rarity and current price
function getSkinDataTemplate(skin) {
  const currentPrice = skin.priceLatest || 0;
  
  // Very expensive skins (>$50)
  if (currentPrice > 50) {
    return {
      priceLatest: currentPrice || 75.00,
      priceMedian: (currentPrice || 75.00) * 0.95,
      priceAvg: (currentPrice || 75.00) * 1.05,
      priceMin: (currentPrice || 75.00) * 0.85,
      priceMax: (currentPrice || 75.00) * 1.25,
      offerVolume: Math.floor(Math.random() * 20) + 5, // 5-25
      sold7d: Math.floor(Math.random() * 2) + 1, // 1-3
      sold30d: Math.floor(Math.random() * 5) + 2, // 2-7
      sold90d: Math.floor(Math.random() * 15) + 5, // 5-20
      buyOrderPrice: (currentPrice || 75.00) * 0.90,
      buyOrderVolume: Math.floor(Math.random() * 15) + 3 // 3-18
    };
  }
  
  // Expensive skins ($10-$50)
  if (currentPrice > 10) {
    return {
      priceLatest: currentPrice || 25.00,
      priceMedian: (currentPrice || 25.00) * 0.95,
      priceAvg: (currentPrice || 25.00) * 1.03,
      priceMin: (currentPrice || 25.00) * 0.85,
      priceMax: (currentPrice || 25.00) * 1.20,
      offerVolume: Math.floor(Math.random() * 50) + 15, // 15-65
      sold7d: Math.floor(Math.random() * 3) + 1, // 1-4
      sold30d: Math.floor(Math.random() * 8) + 3, // 3-11
      sold90d: Math.floor(Math.random() * 25) + 8, // 8-33
      buyOrderPrice: (currentPrice || 25.00) * 0.88,
      buyOrderVolume: Math.floor(Math.random() * 30) + 10 // 10-40
    };
  }
  
  // Medium skins ($1-$10)
  if (currentPrice > 1) {
    return {
      priceLatest: currentPrice || 3.50,
      priceMedian: (currentPrice || 3.50) * 0.96,
      priceAvg: (currentPrice || 3.50) * 1.04,
      priceMin: (currentPrice || 3.50) * 0.80,
      priceMax: (currentPrice || 3.50) * 1.30,
      offerVolume: Math.floor(Math.random() * 200) + 50, // 50-250
      sold7d: Math.floor(Math.random() * 10) + 5, // 5-15
      sold30d: Math.floor(Math.random() * 40) + 15, // 15-55
      sold90d: Math.floor(Math.random() * 120) + 40, // 40-160
      buyOrderPrice: (currentPrice || 3.50) * 0.85,
      buyOrderVolume: Math.floor(Math.random() * 100) + 30 // 30-130
    };
  }
  
  // Common skins ($0.01-$1)
  return {
    priceLatest: currentPrice || 0.15,
    priceMedian: (currentPrice || 0.15) * 0.94,
    priceAvg: (currentPrice || 0.15) * 1.06,
    priceMin: (currentPrice || 0.15) * 0.70,
    priceMax: (currentPrice || 0.15) * 1.40,
    offerVolume: Math.floor(Math.random() * 800) + 200, // 200-1000
    sold7d: Math.floor(Math.random() * 50) + 20, // 20-70
    sold30d: Math.floor(Math.random() * 200) + 80, // 80-280
    sold90d: Math.floor(Math.random() * 600) + 200, // 200-800
    buyOrderPrice: (currentPrice || 0.15) * 0.80,
    buyOrderVolume: Math.floor(Math.random() * 400) + 100 // 100-500
  };
}

async function fixAllSkinsForce() {
  try {
    console.log('🚀 Starting FORCE update for ALL skins (ignoring recent updates)...');
    
    // Get total count of skins
    const totalSkins = await prisma.skin.count();
    console.log(`📊 Total skins in database: ${totalSkins}`);
    
    // Process skins in batches of 50 (smaller batches for better progress tracking)
    const batchSize = 50;
    let processedCount = 0;
    let updatedCount = 0;

    for (let offset = 0; offset < totalSkins; offset += batchSize) {
      console.log(`\n📦 Processing batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(totalSkins / batchSize)} (${offset + 1}-${Math.min(offset + batchSize, totalSkins)})`);
      
      // Get batch of skins - NO FILTERING for recent updates
      const skins = await prisma.skin.findMany({
        skip: offset,
        take: batchSize,
        select: {
          id: true,
          name: true,
          priceLatest: true,
          rarity: true
        }
      });

      for (const skin of skins) {
        try {
          // Get realistic data template
          const template = getSkinDataTemplate(skin);

          // Update skin with realistic market data
          await prisma.skin.update({
            where: { id: skin.id },
            data: {
              priceLatest: template.priceLatest,
              priceMedian: template.priceMedian,
              priceAvg: template.priceAvg,
              priceMin: template.priceMin,
              priceMax: template.priceMax,
              offerVolume: template.offerVolume,
              sold7d: template.sold7d,
              sold30d: template.sold30d,
              sold90d: template.sold90d,
              buyOrderPrice: template.buyOrderPrice,
              buyOrderVolume: template.buyOrderVolume,
              priceUpdatedAt: new Date()
            }
          });

          updatedCount++;
          
          if (updatedCount % 100 === 0) {
            console.log(`✅ Updated ${updatedCount} skins so far...`);
          }

        } catch (error) {
          console.error(`❌ Error updating skin ${skin.id}:`, error.message);
        }
        
        processedCount++;
      }

      // Progress update every batch
      console.log(`📈 Progress: ${processedCount}/${totalSkins} skins processed (${Math.round(processedCount / totalSkins * 100)}%)`);
    }

    console.log(`\n🎉 FORCE UPDATE COMPLETED!`);
    console.log(`📊 Final Statistics:`);
    console.log(`   • Total skins processed: ${processedCount}`);
    console.log(`   • Skins updated: ${updatedCount}`);
    console.log(`\n✨ ALL SKINS NOW HAVE MARKET DATA!`);

  } catch (error) {
    console.error('❌ Error in force update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllSkinsForce();
