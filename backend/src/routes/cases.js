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
    // Remove "Collection" suffix if present
    const weaponType = name.replace(/\s+Collection$/, '');
    
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
