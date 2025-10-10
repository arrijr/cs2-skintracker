import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMultipleSkinsQuantityHistory() {
  try {
    console.log('📊 Creating realistic quantity history for multiple skins...');
    
    // Get skins that have market data
    const skins = await prisma.skin.findMany({
      where: {
        AND: [
          { offerVolume: { not: null } },
          { priceUpdatedAt: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        offerVolume: true
      },
      take: 50
    });

    console.log(`📊 Creating quantity history for ${skins.length} skins`);

    let updatedCount = 0;

    for (const skin of skins) {
      try {
        // Delete existing quantity history
        await prisma.skinQuantityHistory.deleteMany({
          where: { skinId: skin.id }
        });

        // Create realistic quantity history for the last 30 days
        const today = new Date();
        const quantityHistory = [];

        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Generate realistic quantity with some variation
          const baseQuantity = skin.offerVolume;
          const dailyVariation = (Math.random() - 0.5) * 0.2; // ±10% daily variation
          const quantity = Math.max(baseQuantity * 0.5, Math.floor(baseQuantity * (1 + dailyVariation)));
          
          quantityHistory.push({
            skinId: skin.id,
            date: date,
            quantity: quantity,
            activeListings: quantity,
            soldVolume24h: Math.floor(Math.random() * 5) + 1 // 1-5 sold per day
          });
        }

        // Insert all quantity history records
        await prisma.skinQuantityHistory.createMany({
          data: quantityHistory
        });

        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`✅ Created quantity history for ${updatedCount} skins...`);
        }

      } catch (error) {
        console.error(`❌ Error creating quantity history for skin ${skin.id}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created quantity history for ${updatedCount} skins!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMultipleSkinsQuantityHistory();
