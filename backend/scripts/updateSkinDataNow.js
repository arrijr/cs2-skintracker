import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// SteamWebAPI Key from environment
const STEAMWEBAPI_KEY = process.env.STEAMWEBAPI_KEY;

if (!STEAMWEBAPI_KEY) {
  console.error('❌ STEAMWEBAPI_KEY not found in environment');
  process.exit(1);
}

async function updateSkinData(skinId) {
  try {
    console.log(`🔍 Updating skin ${skinId}...`);
    
    // Get skin data from SteamWebAPI
    const response = await fetch(`https://steamwebapi.com/api/item?appid=730&market_hash_name=${encodeURIComponent(skin.marketHashName)}`, {
      headers: {
        'X-API-KEY': STEAMWEBAPI_KEY
      }
    });

    if (!response.ok) {
      console.log(`⚠️  API error for skin ${skinId}: ${response.status}`);
      return false;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.log(`⚠️  API returned success=false for skin ${skinId}`);
      return false;
    }

    // Update skin with real data
    await prisma.skin.update({
      where: { id: skinId },
      data: {
        priceLatest: data.price || null,
        priceMedian: data.median_price || null,
        priceAvg: data.avg_price || null,
        priceMin: data.min_price || null,
        priceMax: data.max_price || null,
        offerVolume: data.volume || null,
        sold7d: data.sold_7d || null,
        sold30d: data.sold_30d || null,
        sold90d: data.sold_90d || null,
        buyOrderPrice: data.buy_order || null,
        buyOrderVolume: data.buy_order_volume || null,
        priceUpdatedAt: new Date()
      }
    });

    console.log(`✅ Updated skin ${skinId}: $${data.price} (vol: ${data.volume})`);
    return true;

  } catch (error) {
    console.error(`❌ Error updating skin ${skinId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting immediate skin data update...');
  
  // Get first 100 skins that need data
  const skins = await prisma.skin.findMany({
    where: {
      OR: [
        { priceLatest: null },
        { offerVolume: null },
        { sold7d: null }
      ]
    },
    select: {
      id: true,
      marketHashName: true
    },
    take: 100
  });

  console.log(`📊 Found ${skins.length} skins to update`);

  let successCount = 0;
  let errorCount = 0;

  for (const skin of skins) {
    const success = await updateSkinData(skin.id);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Rate limiting - wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📈 Update complete:`);
  console.log(`✅ Successfully updated: ${successCount} skins`);
  console.log(`❌ Failed updates: ${errorCount} skins`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
