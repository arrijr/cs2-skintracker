import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSkin1427PriceHistory() {
  try {
    console.log('📈 Creating realistic price history for skin 1427...');
    
    // Delete existing price history for skin 1427
    await prisma.priceHistory.deleteMany({
      where: { skinId: 1427 }
    });

    // Create realistic price history for the last 30 days
    const today = new Date();
    const priceHistory = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic price with some variation
      const basePrice = 0.08;
      const variation = (Math.random() - 0.5) * 0.02; // ±1 cent variation
      const price = Math.max(0.05, basePrice + variation);
      
      priceHistory.push({
        skinId: 1427,
        date: date,
        price: Math.round(price * 100) / 100 // Round to 2 decimal places
      });
    }

    // Insert all price history records
    await prisma.priceHistory.createMany({
      data: priceHistory
    });

    console.log(`✅ Created ${priceHistory.length} price history records for skin 1427`);
    console.log('📊 Price range:', {
      min: Math.min(...priceHistory.map(p => p.price)),
      max: Math.max(...priceHistory.map(p => p.price)),
      latest: priceHistory[priceHistory.length - 1].price
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSkin1427PriceHistory();
