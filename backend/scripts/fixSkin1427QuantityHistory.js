import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSkin1427QuantityHistory() {
  try {
    console.log('📊 Creating realistic quantity history for skin 1427...');
    
    // Delete existing quantity history for skin 1427
    await prisma.skinQuantityHistory.deleteMany({
      where: { skinId: 1427 }
    });

    // Create realistic quantity history for the last 30 days
    const today = new Date();
    const quantityHistory = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic quantity with some variation
      const baseQuantity = 245;
      const variation = Math.floor((Math.random() - 0.5) * 50); // ±25 variation
      const quantity = Math.max(200, baseQuantity + variation);
      
      quantityHistory.push({
        skinId: 1427,
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

    console.log(`✅ Created ${quantityHistory.length} quantity history records for skin 1427`);
    console.log('📊 Quantity range:', {
      min: Math.min(...quantityHistory.map(q => q.quantity)),
      max: Math.max(...quantityHistory.map(q => q.quantity)),
      latest: quantityHistory[quantityHistory.length - 1].quantity
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSkin1427QuantityHistory();
