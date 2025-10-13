import prisma from "../prisma/prismaClient.js";
import { fetchSkinPrice } from "../services/steamService.js";

// {/* Get price history for a skin */}
export const getPriceHistory = async (req, res) => {
  const { skinId } = req.params;
  const { range = '90d' } = req.query; // Support for different time ranges
  
  try {
    console.log(`[DEBUG] Fetching price history for skin ID: ${skinId}, range: ${range}`);
    
    // Calculate date range based on query parameter
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setDate(now.getDate() - 365);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Far back enough
        break;
      default:
        startDate.setDate(now.getDate() - 90);
    }
    
    const history = await prisma.priceHistory.findMany({
      where: { 
        skinId: parseInt(skinId),
        date: {
          gte: startDate
        }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        price: true
      }
    });
    
    console.log(`[DEBUG] Found ${history.length} price history entries for skin ${skinId} in range ${range}`);
    
    // If no price history exists, try to generate some sample data
    if (history.length === 0) {
      console.log(`[DEBUG] No price history found, generating sample data for skin ${skinId}`);
      
      // Get current skin price
      const skin = await prisma.skin.findUnique({
        where: { id: parseInt(skinId) },
        select: { 
          priceMedian: true, 
          priceAvg: true, 
          priceLatest: true,
          priceMedian24h: true,
          priceMedian7d: true,
          priceMedian30d: true
        }
      });
      
      if (skin) {
        const currentPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg;
        if (currentPrice && currentPrice > 0) {
          // Generate realistic sample data based on range
          const sampleHistory = [];
          const today = new Date();
          const days = range === 'all' ? 365 : range === '1y' ? 365 : 
                      range === '90d' ? 90 : range === '30d' ? 30 : 7;
          
          // Use historical prices if available for more realistic data
          const price24h = skin.priceMedian24h || currentPrice;
          const price7d = skin.priceMedian7d || currentPrice;
          const price30d = skin.priceMedian30d || currentPrice;
          
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Create realistic price progression
            let price;
            if (i >= 30) {
              // Use 30d price as base for older data
              price = price30d;
            } else if (i >= 7) {
              // Interpolate between 30d and 7d
              const progress = (i - 7) / 23;
              price = price7d + (price30d - price7d) * progress;
            } else if (i >= 1) {
              // Interpolate between 7d and 24h
              const progress = (i - 1) / 6;
              price = price24h + (price7d - price24h) * progress;
            } else {
              // Use current price for today
              price = currentPrice;
            }
            
            // Add small daily variation (±2%)
            const variation = (Math.random() - 0.5) * 0.04;
            price = price * (1 + variation);
            
            // Ensure price doesn't go below 0.01
            price = Math.max(0.01, price);
            
            sampleHistory.push({
              date: date.toISOString().split('T')[0],
              price: Math.round(price * 100) / 100
            });
          }
          
          console.log(`[DEBUG] Generated ${sampleHistory.length} sample price history entries for range ${range}`);
          return res.json({
            success: true,
            data: sampleHistory,
            range,
            source: 'generated',
            totalDays: days
          });
        }
      }
      
      return res.json({
        success: true,
        data: [],
        range,
        source: 'none'
      });
    }
    
    // Format the history data
    const formattedHistory = history.map(entry => ({
      date: entry.date.toISOString().split('T')[0],
      price: entry.price
    }));
    
    res.json({
      success: true,
      data: formattedHistory,
      range,
      source: 'database',
      totalDays: history.length
    });
  } catch (err) {
    console.error(`[ERROR] Failed to fetch price history for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch price history" });
  }
};

// {/* Get skin by ID with full details */}
export const getSkinById = async (req, res) => {
  const { skinId } = req.params;
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      include: {
        caseSkins: {
          include: {
            case: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    // Add caseInfo to the response if case relationship exists
    let responseData = { ...skin };
    
    if (skin.caseSkins && skin.caseSkins.length > 0) {
      // Use the first case (most skins belong to one case)
      const firstCase = skin.caseSkins[0].case;
      responseData.caseInfo = {
        id: firstCase.id,
        name: firstCase.name
      };
    }

    // Remove caseSkins from response (internal data)
    delete responseData.caseSkins;

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch skin" });
  }
};

// {/* Get skin variants (same skin, different wear/quality) */}
export const getSkinVariants = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching variants for skin ID: ${skinId}`);
    
    // Get the base skin to find variants
    const baseSkin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { 
        name: true, 
        marketHashName: true,
        weaponType: true,
        itemName: true,
        itemGroup: true
      }
    });
    
    if (!baseSkin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Find true variants - only exact matches for the same weapon/skin
    // For weapons: same itemName (e.g., "ak-47 | redline")
    // For stickers: same itemName (e.g., "twistzz (gold)")
    console.log(`[DEBUG] Looking for variants with itemName: "${baseSkin.itemName}", weaponType: "${baseSkin.weaponType}"`);
    
    const variants = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: parseInt(skinId) } }, // Exclude current skin
          { itemName: baseSkin.itemName }, // Only exact itemName matches
          { weaponType: baseSkin.weaponType } // Same weapon type
        ]
      },
      select: {
        id: true,
        name: true,
        wear: true,
        quality: true,
        isStattrak: true,
        isStar: true,
        imageUrl: true,
        priceAvg: true,
        priceMedian: true,
        priceLatest: true
      },
      orderBy: [
        { wear: 'asc' },
        { isStattrak: 'asc' }
      ],
      take: 8 // Limit to 8 variants maximum
    });
    
    console.log(`[DEBUG] Found ${variants.length} variants:`, variants.map(v => ({ id: v.id, name: v.name, wear: v.wear })));
    
    // Add current skin to variants list
    const currentSkin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: {
        id: true,
        name: true,
        wear: true,
        quality: true,
        isStattrak: true,
        isStar: true,
        imageUrl: true,
        priceAvg: true,
        priceMedian: true,
        priceLatest: true
      }
    });
    
    if (currentSkin) {
      variants.unshift({ ...currentSkin, isActive: true });
    }
    
    res.json(variants);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch variants for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch skin variants" });
  }
};

// {/* Get case information for a skin (for breadcrumbs) */}
export const getSkinCaseInfo = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching case info for skin ID: ${skinId}`);
    
    // Get the skin and its case relationship
    const skinWithCase = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      include: {
        caseSkins: {
          include: {
            case: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });
    
    if (!skinWithCase) {
      console.log(`[DEBUG] Skin ${skinId} not found in database`);
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Extract case information
    const cases = skinWithCase.caseSkins.map(cs => cs.case);
    
    console.log(`[DEBUG] Found ${cases.length} cases for skin ${skinId}`);
    
    res.json({
      skin: {
        id: skinWithCase.id,
        name: skinWithCase.name
      },
      cases: cases
    });
    
  } catch (error) {
    console.error(`[ERROR] Error fetching case info for skin ${skinId}:`, error);
    res.status(500).json({ error: "Could not fetch case information" });
  }
};

// {/* Get case information for a skin */}
// DISABLED: This endpoint created artificial collections based on weaponType
// Now using only real case relationships from getSkinById endpoint
export const getSkinCase = async (req, res) => {
  const { skinId } = req.params;
  
  // Return empty result - no artificial collections
  res.json({
    caseName: null,
    skins: [],
    totalSkins: 0,
    message: "Use /skins/:skinId endpoint for real case relationships"
  });
};

// {/* Get market statistics for a skin */}
export const getSkinMarketStats = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching market stats for skin ID: ${skinId}`);
    
    // Get comprehensive skin data with all market statistics
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: {
        // Current prices
        priceLatest: true,
        priceLatestSell: true,
        priceAvg: true,
        priceMedian: true,
        priceSafe: true,
        priceMin: true,
        priceMax: true,
        
        // Historical prices
        priceMedian24h: true,
        priceMedian7d: true,
        priceMedian30d: true,
        priceMedian90d: true,
        priceAvg24h: true,
        priceAvg7d: true,
        priceAvg30d: true,
        priceAvg90d: true,
        
        // Sales statistics
        soldToday: true,
        sold24h: true,
        sold7d: true,
        sold30d: true,
        sold90d: true,
        soldTotal: true,
        hoursToSold: true,
        
        // Steam market data
        buyOrderPrice: true,
        buyOrderMedian: true,
        buyOrderAvg: true,
        buyOrderVolume: true,
        offerVolume: true,
        
        // Metadata
        priceUpdatedAt: true,
        unstable: true,
        unstableReason: true
      }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Use real data from database - no more sample data
    const stats = {
      // Current prices
      latestPrice: skin.priceLatest || 0,
      latestSellPrice: skin.priceLatestSell || 0,
      medianPrice: skin.priceMedian || 0,
      averagePrice: skin.priceAvg || 0,
      safePrice: skin.priceSafe || 0,
      minPrice: skin.priceMin || 0,
      maxPrice: skin.priceMax || 0,
      
      // Historical prices (90d)
      medianPrice24h: skin.priceMedian24h || 0,
      medianPrice7d: skin.priceMedian7d || 0,
      medianPrice30d: skin.priceMedian30d || 0,
      medianPrice90d: skin.priceMedian90d || 0,
      averagePrice24h: skin.priceAvg24h || 0,
      averagePrice7d: skin.priceAvg7d || 0,
      averagePrice30d: skin.priceAvg30d || 0,
      averagePrice90d: skin.priceAvg90d || 0,
      
      // Sales statistics
      soldToday: skin.soldToday || 0,
      sold24h: skin.sold24h || 0,
      sold7d: skin.sold7d || 0,
      sold30d: skin.sold30d || 0,
      sold90d: skin.sold90d || 0,
      soldTotal: skin.soldTotal || 0,
      hoursToSold: skin.hoursToSold || 0,
      
      // Market data
      buyOrderPrice: skin.buyOrderPrice || 0,
      buyOrderMedian: skin.buyOrderMedian || 0,
      buyOrderAvg: skin.buyOrderAvg || 0,
      buyOrderVolume: skin.buyOrderVolume || 0,
      offerVolume: skin.offerVolume || 0, // Available Listings
      
      // Metadata
      lastUpdated: skin.priceUpdatedAt || new Date(),
      unstable: skin.unstable || false,
      unstableReason: skin.unstableReason || null,
      
      // Calculated fields for compatibility
      currentPrice: skin.priceLatest || skin.priceMedian || skin.priceAvg || 0,
      activeListings: skin.offerVolume || 0,
      buyOrders: skin.buyOrderVolume || 0,
      volume24h: skin.sold24h || 0,
      volume7d: skin.sold7d || 0,
      volume30d: skin.sold30d || 0,
      volume90d: skin.sold90d || 0
    };
    
    console.log(`[DEBUG] Market stats for skin ${skinId}:`, {
      latestPrice: stats.latestPrice,
      offerVolume: stats.offerVolume,
      sold7d: stats.sold7d,
      sold30d: stats.sold30d,
      buyOrderVolume: stats.buyOrderVolume
    });
    
    res.json(stats);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch market stats for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch market statistics" });
  }
};

// {/* Get related skins */}
export const getRelatedSkins = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching related skins for skin ID: ${skinId}`);
    
    // Get the base skin to find related skins
    const baseSkin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { 
        name: true,
        weaponType: true,
        itemGroup: true,
        itemName: true,
        rarity: true
      }
    });
    
    console.log(`[DEBUG] Base skin found:`, baseSkin);
    
    if (!baseSkin) {
      console.log(`[DEBUG] Skin ${skinId} not found`);
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Find related skins (same weapon type or similar characteristics)
    console.log(`[DEBUG] Searching for related skins with weaponType: ${baseSkin.weaponType}, itemName: ${baseSkin.itemName}`);
    
    const relatedSkins = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: parseInt(skinId) } }, // Exclude current skin
          {
            OR: [
              { weaponType: baseSkin.weaponType },
              { itemName: baseSkin.itemName },
              { 
                name: {
                  contains: baseSkin.name?.split('|')[0]?.trim() || baseSkin.name?.split('(')[0]?.trim() || baseSkin.name
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        priceAvg: true,
        priceMedian: true,
        priceLatest: true,
        wear: true,
        rarity: true,
        isStattrak: true,
        isStar: true
      },
      orderBy: [
        { priceAvg: 'desc' }
      ],
      take: 12 // Limit to 12 related skins
    });
    
    console.log(`[DEBUG] Found ${relatedSkins.length} related skins`);
    console.log(`[DEBUG] Related skins:`, relatedSkins.map(s => ({ id: s.id, name: s.name })));
    
    res.json(relatedSkins);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch related skins for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch related skins" });
  }
};