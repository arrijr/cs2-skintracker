import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// SteamWebAPI Key from environment
const STEAMWEBAPI_KEY = process.env.STEAMWEBAPI_KEY;

async function updateSkin1427() {
  try {
    console.log('🔍 Updating skin 1427 (MP9 | Slide Battle-Scarred)...');
    
    // Get the skin
    const skin = await prisma.skin.findUnique({
      where: { id: 1427 },
      select: { id: true, marketHashName: true }
    });

    if (!skin) {
      console.log('❌ Skin 1427 not found');
      return;
    }

    console.log(`📝 Market Hash Name: ${skin.marketHashName}`);

    // Get data from SteamWebAPI
    const response = await fetch(`https://steamwebapi.com/api/item?appid=730&market_hash_name=${encodeURIComponent(skin.marketHashName)}`, {
      headers: {
        'X-API-KEY': STEAMWEBAPI_KEY
      }
    });

    if (!response.ok) {
      console.log(`❌ API error: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log('📊 API Response:', JSON.stringify(data, null, 2));
    
    if (!data.success) {
      console.log('❌ API returned success=false');
      return;
    }

    // Update the skin with real data
    const updatedSkin = await prisma.skin.update({
      where: { id: 1427 },
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

    console.log('✅ Skin 1427 updated successfully!');
    console.log('📊 New data:', {
      priceLatest: updatedSkin.priceLatest,
      offerVolume: updatedSkin.offerVolume,
      sold7d: updatedSkin.sold7d,
      sold30d: updatedSkin.sold30d,
      buyOrderPrice: updatedSkin.buyOrderPrice
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSkin1427();
