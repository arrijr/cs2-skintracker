import { PrismaClient } from '@prisma/client';
import marketSnapshotService from './src/services/marketSnapshotService.js';

const prisma = new PrismaClient();

async function generateSkinData(skinId) {
  try {
    // Check if skin exists
    const skin = await prisma.skin.findUnique({ 
      where: { id: skinId },
      select: { id: true, name: true }
    });
    
    if (!skin) {
      console.log(`Skin ${skinId} not found`);
      return;
    }
    
    console.log(`Generating data for skin: ${skin.name} (ID: ${skinId})`);
    
    // Generate 7 days of data
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const marketData = {
        priceUsd: 100 + Math.random() * 200,
        activeListings: Math.floor(Math.random() * 50 + 10),
        soldVolume24h: Math.floor(Math.random() * 20 + 1),
        source: 'steam',
        fetchedAt: new Date()
      };
      
      await marketSnapshotService.storeMarketSnapshot(skinId, marketData, date);
      console.log(`Generated data for day ${i + 1}: ${date.toISOString().split('T')[0]}`);
    }
    
    console.log(`✅ Successfully generated 7 days of data for skin ${skinId}`);
    
  } catch (error) {
    console.error('Error generating skin data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Generate data for skin 25755
generateSkinData(25755);
