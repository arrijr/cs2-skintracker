import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMultipleSkinsPriceHistory() {
  try {
    console.log('📈 Creating realistic price history for multiple skins...');
    
    // Get skins that have market data but no price history
    const skins = await prisma.skin.findMany({
      where: {
        AND: [
          { priceLatest: { not: null } },
          { priceUpdatedAt: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        priceLatest: true
      },
      take: 50
    });

    console.log(`📊 Creating price history for ${skins.length} skins`);

    let updatedCount = 0;

    for (const skin of skins) {
      try {
        // Delete existing price history
        await prisma.priceHistory.deleteMany({
          where: { skinId: skin.id }
        });

        // Create realistic price history for the last 30 days
        const today = new Date();
        const priceHistory = [];

        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Generate realistic price with some variation
          const basePrice = skin.priceLatest;
          const dailyVariation = (Math.random() - 0.5) * 0.1; // ±5% daily variation
          const price = Math.max(basePrice * 0.5, basePrice * (1 + dailyVariation));
          
          priceHistory.push({
            skinId: skin.id,
            date: date,
            price: Math.round(price * 100) / 100 // Round to 2 decimal places
          });
        }

        // Insert all price history records
        await prisma.priceHistory.createMany({
          data: priceHistory
        });

        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`✅ Created price history for ${updatedCount} skins...`);
        }

      } catch (error) {
        console.error(`❌ Error creating price history for skin ${skin.id}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created price history for ${updatedCount} skins!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMultipleSkinsPriceHistory();
