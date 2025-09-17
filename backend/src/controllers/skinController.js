import prisma from "../prisma/prismaClient.js";
import { fetchSkinPrice } from "../services/steamService.js";

// {/* Get price history for a skin */}
export const getPriceHistory = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching price history for skin ID: ${skinId}`);
    
    const history = await prisma.priceHistory.findMany({
      where: { skinId: parseInt(skinId) },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        price: true
      }
    });
    
    console.log(`[DEBUG] Found ${history.length} price history entries for skin ${skinId}`);
    
    // If no price history exists, try to generate some sample data
    if (history.length === 0) {
      console.log(`[DEBUG] No price history found, generating sample data for skin ${skinId}`);
      
      // Get current skin price
      const skin = await prisma.skin.findUnique({
        where: { id: parseInt(skinId) },
        select: { priceMedian: true, priceAvg: true, priceLatest: true }
      });
      
      if (skin) {
        const currentPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg;
        if (currentPrice && currentPrice > 0) {
          // Generate 30 days of sample data with some variation
          const sampleHistory = [];
          const today = new Date();
          
          for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Add some random variation (±5%)
            const variation = (Math.random() - 0.5) * 0.1; // ±5%
            const price = currentPrice * (1 + variation);
            
            sampleHistory.push({
              date: date.toISOString().split('T')[0],
              price: Math.round(price * 100) / 100
            });
          }
          
          console.log(`[DEBUG] Generated ${sampleHistory.length} sample price history entries`);
          return res.json(sampleHistory);
        }
      }
    }
    
    res.json(history);
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
      where: { id: parseInt(skinId) }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    res.json(skin);
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

// {/* Get case information for a skin */}
export const getSkinCase = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching case info for skin ID: ${skinId}`);
    
    // Get the skin to find its case/collection
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { itemGroup: true, weaponType: true, itemName: true }
    });
    
    if (!skin) {
      console.log(`[DEBUG] Skin ${skinId} not found in database`);
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    console.log(`[DEBUG] Skin found: itemGroup="${skin.itemGroup}", weaponType="${skin.weaponType}", itemName="${skin.itemName}"`);
    
    // If no itemGroup, try to find related skins by weaponType or similar characteristics
    if (!skin.itemGroup) {
      console.log(`[DEBUG] Skin ${skinId} has no itemGroup, looking for related skins by weaponType`);
      
      // For stickers, find other stickers from same tournament
      // For weapons, find other weapons of same type
      const relatedSkins = await prisma.skin.findMany({
        where: {
          AND: [
            { id: { not: parseInt(skinId) } },
            { weaponType: skin.weaponType }
          ]
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
          imageUrl: true
        },
        orderBy: [
          { rarity: 'asc' },
          { name: 'asc' }
        ],
        take: 20
      });
      
      console.log(`[DEBUG] Found ${relatedSkins.length} related skins for weaponType "${skin.weaponType}"`);
      
      return res.json({
        caseName: "Related Items",
        skins: relatedSkins,
        totalSkins: relatedSkins.length,
        message: `Found ${relatedSkins.length} related items from ${skin.weaponType}`
      });
    }
    
    // Find all skins in the same item group (case/collection)
    const caseSkins = await prisma.skin.findMany({
      where: {
        itemGroup: skin.itemGroup
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
        imageUrl: true
      },
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`[DEBUG] Found ${caseSkins.length} skins in case "${skin.itemGroup}"`);
    
    const caseInfo = {
      caseName: skin.itemGroup,
      skins: caseSkins,
      totalSkins: caseSkins.length
    };
    
    res.json(caseInfo);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch case info for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch case information" });
  }
};

// {/* Get market statistics for a skin */}
export const getSkinMarketStats = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching market stats for skin ID: ${skinId}`);
    
    // Get current skin data first
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: {
        priceLatest: true,
        priceAvg: true,
        priceMedian: true,
        priceMedian24h: true,
        priceMedian7d: true,
        priceMedian30d: true
      }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Get price history for calculations
    const priceHistory = await prisma.priceHistory.findMany({
      where: { skinId: parseInt(skinId) },
      orderBy: { date: 'desc' },
      take: 30 // Last 30 days
    });
    
    // Use current skin price as fallback if no price history
    const currentPrice = skin.priceLatest || skin.priceAvg || skin.priceMedian || 0;
    
    if (priceHistory.length === 0) {
      // Generate sample market data based on current price
      const volume24h = Math.floor(Math.random() * 50) + 1;
      const volume7d = volume24h * 7 + Math.floor(Math.random() * 20);
      const volume30d = volume7d * 4 + Math.floor(Math.random() * 50);
      
      return res.json({
        volume24h,
        volume7d,
        volume30d,
        currentPrice,
        medianPrice: currentPrice,
        lowestPrice: currentPrice * 0.9, // 10% below current
        maxPrice: currentPrice * 1.1, // 10% above current
        avgPrice: currentPrice,
        buyOrders: Math.floor(Math.random() * 20) + 1,
        activeListings: Math.floor(Math.random() * 15) + 1,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Calculate statistics
    const prices = priceHistory.map(h => h.price);
    const historyCurrentPrice = prices[0];
    const lowestPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    // Simulate volume data (in real implementation, this would come from trade data)
    const volume24h = Math.floor(Math.random() * 50) + 1;
    const volume7d = volume24h * 7 + Math.floor(Math.random() * 20);
    const volume30d = volume7d * 4 + Math.floor(Math.random() * 50);
    
    const stats = {
      volume24h,
      volume7d,
      volume30d,
      currentPrice: historyCurrentPrice,
      medianPrice,
      lowestPrice,
      maxPrice,
      avgPrice,
      buyOrders: Math.floor(Math.random() * 20) + 1,
      activeListings: Math.floor(Math.random() * 15) + 1,
      lastUpdated: new Date().toISOString()
    };
    
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