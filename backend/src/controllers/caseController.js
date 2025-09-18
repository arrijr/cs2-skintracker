// backend/src/controllers/caseController.js — [Backend]
// {/* Case Controller - Handle case information */}

import prisma from "../prisma/prismaClient.js";

// [API] Get Case by ID — used on Skin Detail "Contained in Case" section
export const getCaseById = async (req, res) => {
  const { caseId } = req.params;
  try {
    console.log(`[DEBUG] Fetching case by ID: ${caseId}`);
    
    // Find the case by name (since we use case names as IDs)
    const caseItem = await prisma.skin.findFirst({
      where: {
        weaponType: "case",
        name: caseId
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        weaponType: true
      }
    });
    
    if (!caseItem) {
      console.log(`[DEBUG] Case ${caseId} not found`);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Get count of skins in this case (we'll need to implement proper case-skin mapping)
    const skinCount = await prisma.skin.count({
      where: {
        // For now, we'll use a simple approach - this needs proper case-skin mapping
        weaponType: { not: "case" } // Exclude other cases
      }
    });
    
    const caseInfo = {
      id: caseItem.id,
      name: caseItem.name,
      imageUrl: caseItem.imageUrl,
      weaponType: caseItem.weaponType,
      skinCount: skinCount
    };
    
    console.log(`[DEBUG] Found case: ${caseItem.name}`);
    res.json(caseInfo);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch case ${caseId}:`, err);
    res.status(500).json({ error: "Could not fetch case" });
  }
};

// [API] List Skins of Case — skin grid on Case pages & Case section
export const getCaseSkins = async (req, res) => {
  const { caseId } = req.params;
  try {
    console.log(`[DEBUG] Fetching skins for case: ${caseId}`);
    
    // For now, we'll return a placeholder since we need proper case-skin mapping
    // This should be implemented with a proper case-skin relationship table
    const skins = await prisma.skin.findMany({
      where: {
        // Placeholder: return some skins for demonstration
        weaponType: { not: "case" }
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
      take: 50 // Limit for now
    });
    
    console.log(`[DEBUG] Found ${skins.length} skins for case ${caseId}`);
    res.json({
      skins: skins,
      total: skins.length
    });
  } catch (err) {
    console.error(`[ERROR] Failed to fetch skins for case ${caseId}:`, err);
    res.status(500).json({ error: "Could not fetch case skins" });
  }
};

// [API] Resolve Case for Skin — used on Skin Detail to show the parent Case
export const getSkinCase = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Resolving case for skin: ${skinId}`);
    
    // Get the skin first
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { 
        id: true,
        name: true,
        weaponType: true,
        itemGroup: true
      }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // For now, we'll use a simple approach to determine the case
    // In a real implementation, this would use a proper case-skin relationship
    let caseInfo = null;
    
    // Check if this skin is from a known case pattern
    const casePatterns = [
      'recoil', 'fracture', 'kilowatt', 'revolution', 'snakebite', 
      'gallery', 'fever', 'clutch', 'cs20', 'shadow', 'prisma', 
      'dreams', 'falchion', 'danger zone', 'horizon', 'wildfire', 
      'revolver', 'spectrum'
    ];
    
    for (const pattern of casePatterns) {
      if (skin.name.toLowerCase().includes(pattern)) {
        // Find the corresponding case
        const caseItem = await prisma.skin.findFirst({
          where: {
            weaponType: "case",
            name: { contains: pattern, mode: 'insensitive' }
          },
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        });
        
        if (caseItem) {
          caseInfo = {
            id: caseItem.id,
            name: caseItem.name,
            imageUrl: caseItem.imageUrl
          };
          break;
        }
      }
    }
    
    if (!caseInfo) {
      console.log(`[DEBUG] No case found for skin ${skinId}`);
      return res.json({ case: null });
    }
    
    console.log(`[DEBUG] Found case ${caseInfo.name} for skin ${skinId}`);
    res.json({ case: caseInfo });
  } catch (err) {
    console.error(`[ERROR] Failed to resolve case for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not resolve case for skin" });
  }
};
