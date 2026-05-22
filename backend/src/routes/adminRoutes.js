import express from 'express';
import prisma from '../prisma/prismaClient.js';
import fetch from 'node-fetch';
import clerkAdminAuth from '../middleware/clerkAdminAuth.js';

const router = express.Router();

// All admin routes require admin-level Clerk JWT (role==='admin' in DB).
// Mounted globally so future endpoints added below inherit the same gate.
router.use(clerkAdminAuth);

// Update skin data immediately
router.post('/update-skin-data', async (req, res) => {
  try {
    // Production safety: refuse external writes by default; require explicit
    // env opt-in. Matches the gate already used in adminController jobs.
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({
        error: 'Manual skin data update is disabled in production for safety.'
      });
    }

    console.log('[admin/update-skin-data] adminId=%s', req.user?.id);

    const STEAMWEBAPI_KEY = process.env.STEAMWEBAPI_KEY;

    if (!STEAMWEBAPI_KEY) {
      return res.status(500).json({ error: 'STEAMWEBAPI_KEY not found' });
    }

    // Get first 50 skins that need data
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
      take: 50
    });

    console.log(`📊 Found ${skins.length} skins to update`);

    let successCount = 0;
    let errorCount = 0;

    for (const skin of skins) {
      try {
        console.log(`🔍 Updating skin ${skin.id}...`);
        
        // Get skin data from SteamWebAPI
        const response = await fetch(`https://steamwebapi.com/api/item?appid=730&market_hash_name=${encodeURIComponent(skin.marketHashName)}`, {
          headers: {
            'X-API-KEY': STEAMWEBAPI_KEY
          }
        });

        if (!response.ok) {
          console.log(`⚠️  API error for skin ${skin.id}: ${response.status}`);
          errorCount++;
          continue;
        }

        const data = await response.json();
        
        if (!data.success) {
          console.log(`⚠️  API returned success=false for skin ${skin.id}`);
          errorCount++;
          continue;
        }

        // Update skin with real data
        await prisma.skin.update({
          where: { id: skin.id },
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

        console.log(`✅ Updated skin ${skin.id}: $${data.price} (vol: ${data.volume})`);
        successCount++;

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

  } catch (error) {
        console.error(`❌ Error updating skin ${skin.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Update complete:`);
    console.log(`✅ Successfully updated: ${successCount} skins`);
    console.log(`❌ Failed updates: ${errorCount} skins`);

    res.json({
      success: true,
      updated: successCount,
      errors: errorCount,
      total: skins.length,
      message: `Updated ${successCount} skins successfully`
    });

  } catch (error) {
    console.error('❌ Error in skin data update:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

export default router;