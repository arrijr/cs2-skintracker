// /backend/src/routes/cases.js — [Backend]
// {/* Case Routes - API endpoints for case management */}
import express from 'express';
import caseController from '../controllers/caseController.js';
import prisma from '../prisma/prismaClient.js';

const router = express.Router();

// GET /api/cases - Get all cases with filtering and sorting
router.get('/', caseController.getAllCases);

// GET /api/cases/stats - Get case statistics and market overview
router.get('/stats', caseController.getCaseStats);

// GET /api/cases/collections - Get all available collections based on weapon types
router.get('/collections', async (req, res) => {
  try {
    console.log('[DEBUG] Fetching all collections');
    
    // Define the main weapon types that should be collections
    const mainWeaponTypes = [
      'pistol',
      'rifle', 
      'smg',
      'sniper rifle',
      'knife',
      'gloves',
      'shotgun',
      'machinegun'
    ];

    // Generate collection data for each weapon type
    const collections = await Promise.all(
      mainWeaponTypes.map(async (weaponType) => {
        // Count skins in this collection
        const skinCount = await prisma.skin.count({
          where: { weaponType }
        });
        
        // Get average price for this collection
        const avgPriceResult = await prisma.skin.aggregate({
          where: { 
            weaponType,
            priceAvg: { not: null }
          },
          _avg: { priceAvg: true }
        });
        
        // Generate collection name
        let collectionName = weaponType;
        if (weaponType.includes('knife') || weaponType.includes('gloves')) {
          collectionName = 'Knife & Glove Collection';
        } else {
          collectionName = `${weaponType.charAt(0).toUpperCase() + weaponType.slice(1)} Collection`;
        }
        
        return {
          id: weaponType, // Use weaponType as ID
          name: collectionName,
          weaponType: weaponType,
          imageUrl: '/images/placeholder-case.png',
          skinCount: skinCount,
          averagePrice: avgPriceResult._avg.priceAvg || 0,
          description: `A collection featuring ${weaponType} skins`,
          releaseDate: new Date().toISOString(),
          isDiscontinued: false,
          price: avgPriceResult._avg.priceAvg || 0,
          marketCap: (avgPriceResult._avg.priceAvg || 0) * skinCount,
          remaining: skinCount,
          dropped: skinCount,
          unboxed: 0,
          timeToExtinction: 999, // Collections don't have extinction
          priceChange24h: 0,
          priceChange7d: 0,
          lastUpdated: new Date().toISOString()
        };
      })
    );
    
    console.log(`[DEBUG] Found ${collections.length} collections`);
    
    res.json({ cases: collections });
  } catch (err) {
    console.error('[ERROR] Failed to fetch collections:', err);
    res.status(500).json({ error: "Could not fetch collections" });
  }
});

// GET /api/cases/:id - Get specific case by ID
router.get('/:id', caseController.getCaseById);

// GET /api/cases/:id/supply - Get case supply history
router.get('/:id/supply', caseController.getCaseSupply);

// GET /api/cases/:id/price-history - Get case price history
router.get('/:id/price-history', caseController.getCasePriceHistory);

// GET /api/cases/by-name/:name/skins - Get skins contained in case by name
router.get('/by-name/:name/skins', async (req, res) => {
  const { name } = req.params;
  try {
    console.log(`[DEBUG] Fetching skins for case name: ${name}`);
    
    // Find skins by weapon type that matches the case name
    // Remove "Collection" suffix if present and convert to lowercase
    const weaponType = name.replace(/\s+Collection$/, '').toLowerCase();
    
    const skins = await prisma.skin.findMany({
      where: {
        weaponType: {
          contains: weaponType,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        wear: true,
        rarity: true,
        quality: true,
        isStattrak: true,
        isStar: true,
        priceAvg: true,
        priceMedian: true,
        priceLatest: true,
        imageUrl: true,
        weaponType: true,
        sold24h: true,
        offerVolume: true
      },
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' }
      ],
      take: 50 // Limit for performance
    });
    
    console.log(`[DEBUG] Found ${skins.length} skins for case "${name}"`);
    
    res.json({ skins });
  } catch (err) {
    console.error(`[ERROR] Failed to fetch skins for case "${name}":`, err);
    res.status(500).json({ error: "Could not fetch case skins" });
  }
});

// GET /api/cases/:id/skins - Get skins contained in case
router.get('/:id/skins', caseController.getCaseSkins);

export default router;
