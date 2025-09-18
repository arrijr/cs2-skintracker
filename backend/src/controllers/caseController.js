// backend/src/controllers/caseController.js — [Backend]
// {/* Case Controller - Handle case/collection information */}

import prisma from "../prisma/prismaClient.js";

// {/* Get all available cases/collections */}
export const getCases = async (req, res) => {
  try {
    console.log(`[DEBUG] Fetching all real cases/collections`);
    
    // Only get actual cases (weaponType = "case")
    const cases = await prisma.skin.findMany({
      where: {
        weaponType: "case"
      },
      select: {
        name: true,
        weaponType: true
      },
      distinct: ['name'],
      orderBy: {
        name: 'asc'
      }
    });
    
    // Format case names for better display
    const formattedCases = cases.map(caseItem => ({
      id: caseItem.name,
      name: caseItem.name,
      originalWeaponType: caseItem.weaponType,
      skinCount: 0 // We'll calculate this separately if needed
    }));
    
    console.log(`[DEBUG] Found ${formattedCases.length} real cases`);
    
    res.json({
      cases: formattedCases,
      total: formattedCases.length
    });
  } catch (err) {
    console.error(`[ERROR] Failed to fetch cases:`, err);
    res.status(500).json({ error: "Could not fetch cases" });
  }
};

// {/* Get specific case details with all skins */}
export const getCaseById = async (req, res) => {
  const { caseId } = req.params;
  try {
    console.log(`[DEBUG] Fetching case details for: ${caseId}`);
    
    // Find all skins in this case/collection
    const skins = await prisma.skin.findMany({
      where: {
        weaponType: caseId
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
      ]
    });
    
    if (skins.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    // Format case name for better display
    let caseName = caseId;
    if (caseId.includes("2018") || caseId.includes("2019") || caseId.includes("2020") || 
        caseId.includes("2021") || caseId.includes("2022") || caseId.includes("2023") || 
        caseId.includes("2024")) {
      caseName = caseId.replace(/(\d{4})/, '$1 Major');
    } else if (caseId.includes("knife") || caseId.includes("gloves")) {
      caseName = "Knife & Glove Collection";
    } else if (caseId.includes("souvenir")) {
      caseName = "Souvenir Collection";
    }
    
    // Calculate case statistics
    const totalValue = skins.reduce((sum, skin) => {
      const price = skin.priceAvg || skin.priceMedian || skin.priceLatest || 0;
      return sum + price;
    }, 0);
    
    const avgPrice = totalValue / skins.length;
    
    const rarityCounts = skins.reduce((counts, skin) => {
      const rarity = skin.rarity || 'Unknown';
      counts[rarity] = (counts[rarity] || 0) + 1;
      return counts;
    }, {});
    
    console.log(`[DEBUG] Found ${skins.length} skins in case "${caseName}"`);
    
    const caseInfo = {
      id: caseId,
      name: caseName,
      originalWeaponType: caseId,
      skins: skins,
      totalSkins: skins.length,
      totalValue: totalValue,
      avgPrice: avgPrice,
      rarityCounts: rarityCounts
    };
    
    res.json(caseInfo);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch case details for ${caseId}:`, err);
    res.status(500).json({ error: "Could not fetch case details" });
  }
};
