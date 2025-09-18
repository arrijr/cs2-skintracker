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
    
    // First, get the case to find its name
    const caseItem = await prisma.skin.findFirst({
      where: {
        weaponType: "case",
        name: caseId
      },
      select: {
        id: true,
        name: true
      }
    });
    
    if (!caseItem) {
      console.log(`[DEBUG] Case ${caseId} not found`);
      return res.status(404).json({ error: 'Case not found' });
    }
    
    console.log(`[DEBUG] Found case: ${caseItem.name}`);
    
    // Find skins that belong to this case using reverse mapping
    const caseMappings = {
      'Fever Case': 'fever dream',
      'Revolution Case': 'neon revolution', 
      'Recoil Case': 'recoil',
      'Fracture Case': 'fracture',
      'Kilowatt Case': 'kilowatt',
      'Snakebite Case': 'snakebite',
      'Gallery Case': 'gallery',
      'Clutch Case': 'clutch',
      'CS20 Case': 'cs20',
      'Shadow Case': 'shadow'
    };
    
    const casePattern = caseMappings[caseItem.name] || caseItem.name.toLowerCase().replace(' case', '');
    console.log(`[DEBUG] Looking for skins with pattern: "${casePattern}"`);
    
    const skins = await prisma.skin.findMany({
      where: {
        weaponType: { not: "case" }, // Exclude other cases
        name: { contains: casePattern, mode: 'insensitive' }
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
      take: 100 // Increased limit for real cases
    });
    
    console.log(`[DEBUG] Found ${skins.length} skins for case ${caseItem.name}`);
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
    
    console.log(`[DEBUG] Skin: "${skin.name}" (${skin.weaponType})`);
    
    // Try to find a real case for this skin
    let caseInfo = null;
    
    // Method 1: Look for specific case patterns in skin name
    const caseMappings = {
      'fever dream': 'Fever Case',
      'neon revolution': 'Revolution Case', 
      'recoil': 'Recoil Case',
      'fracture': 'Fracture Case',
      'kilowatt': 'Kilowatt Case',
      'snakebite': 'Snakebite Case',
      'gallery': 'Gallery Case',
      'clutch': 'Clutch Case',
      'cs20': 'CS20 Case',
      'shadow': 'Shadow Case'
    };
    
    const skinNameLower = skin.name.toLowerCase();
    
    // Check for specific mappings first
    for (const [pattern, caseName] of Object.entries(caseMappings)) {
      if (skinNameLower.includes(pattern)) {
        const caseItem = await prisma.skin.findFirst({
          where: {
            weaponType: "case",
            name: caseName
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
          console.log(`[DEBUG] Found case via mapping: ${caseName}`);
          break;
        }
      }
    }
    
    // Method 2: If no specific mapping, try generic case patterns
    if (!caseInfo) {
      const genericPatterns = ['recoil', 'fracture', 'kilowatt', 'revolution', 'snakebite', 
                              'gallery', 'fever', 'clutch', 'cs20', 'shadow', 'prisma', 
                              'dreams', 'falchion', 'danger zone', 'horizon', 'wildfire', 
                              'revolver', 'spectrum'];
      
      for (const pattern of genericPatterns) {
        if (skinNameLower.includes(pattern)) {
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
            console.log(`[DEBUG] Found case via pattern: ${pattern} -> ${caseItem.name}`);
            break;
          }
        }
      }
    }
    
    if (!caseInfo) {
      console.log(`[DEBUG] No case found for skin ${skinId} - this is normal for many skins`);
      return res.json({ case: null });
    }
    
    console.log(`[DEBUG] Found case ${caseInfo.name} for skin ${skinId}`);
    res.json({ case: caseInfo });
  } catch (err) {
    console.error(`[ERROR] Failed to resolve case for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not resolve case for skin" });
  }
};
