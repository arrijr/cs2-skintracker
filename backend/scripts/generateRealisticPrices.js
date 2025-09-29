import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety } from "./safety-guard.js";

const prisma = new PrismaClient();

// Safety check: Only allow in development
checkProductionSafety("Realistic price generation", false);

/**
 * Generate realistic CS2 skin prices based on weapon type, rarity, and wear
 */
function generateRealisticPrice(skin) {
  // Base prices by weapon type (in USD)
  const weaponBasePrices = {
    // Rifles (highest value)
    'ak-47': { min: 0.5, max: 5000, multiplier: 1.0 },
    'm4a4': { min: 0.3, max: 3000, multiplier: 0.8 },
    'm4a1-s': { min: 0.3, max: 3000, multiplier: 0.8 },
    'awp': { min: 0.5, max: 8000, multiplier: 1.5 },
    'aug': { min: 0.2, max: 1000, multiplier: 0.3 },
    'sg 553': { min: 0.2, max: 1000, multiplier: 0.3 },
    'galil': { min: 0.1, max: 500, multiplier: 0.2 },
    'famas': { min: 0.1, max: 500, multiplier: 0.2 },
    
    // SMGs
    'mac-10': { min: 0.1, max: 200, multiplier: 0.15 },
    'mp9': { min: 0.1, max: 200, multiplier: 0.15 },
    'mp7': { min: 0.1, max: 300, multiplier: 0.2 },
    'ump-45': { min: 0.1, max: 300, multiplier: 0.2 },
    'p90': { min: 0.1, max: 400, multiplier: 0.25 },
    'pp-bizon': { min: 0.05, max: 150, multiplier: 0.1 },
    'mp5-sd': { min: 0.1, max: 250, multiplier: 0.18 },
    
    // Pistols
    'glock-18': { min: 0.1, max: 800, multiplier: 0.4 },
    'usp-s': { min: 0.1, max: 600, multiplier: 0.3 },
    'p250': { min: 0.05, max: 300, multiplier: 0.2 },
    'five-seven': { min: 0.05, max: 400, multiplier: 0.25 },
    'tec-9': { min: 0.05, max: 350, multiplier: 0.22 },
    'cz75-auto': { min: 0.05, max: 400, multiplier: 0.25 },
    'dual berettas': { min: 0.05, max: 200, multiplier: 0.15 },
    'p2000': { min: 0.05, max: 250, multiplier: 0.18 },
    'desert eagle': { min: 0.1, max: 1200, multiplier: 0.6 },
    'r8 revolver': { min: 0.05, max: 300, multiplier: 0.2 },
    
    // Knives (highest value)
    'knife': { min: 50, max: 8000, multiplier: 10.0 },
    'bayonet': { min: 50, max: 8000, multiplier: 10.0 },
    'karambit': { min: 100, max: 12000, multiplier: 15.0 },
    'butterfly': { min: 100, max: 12000, multiplier: 15.0 },
    'm9': { min: 80, max: 10000, multiplier: 12.0 },
    'gut': { min: 30, max: 4000, multiplier: 6.0 },
    'flip': { min: 30, max: 4000, multiplier: 6.0 },
    'huntsman': { min: 40, max: 5000, multiplier: 7.0 },
    'falchion': { min: 30, max: 4000, multiplier: 6.0 },
    'bowie': { min: 30, max: 4000, multiplier: 6.0 },
    'shadow': { min: 20, max: 3000, multiplier: 5.0 },
    'stiletto': { min: 30, max: 4000, multiplier: 6.0 },
    'talon': { min: 40, max: 5000, multiplier: 7.0 },
    'ursus': { min: 30, max: 4000, multiplier: 6.0 },
    'navaja': { min: 25, max: 3500, multiplier: 5.5 },
    'classic': { min: 20, max: 3000, multiplier: 5.0 },
    'paracord': { min: 25, max: 3500, multiplier: 5.5 },
    'survival': { min: 25, max: 3500, multiplier: 5.5 },
    'nomad': { min: 25, max: 3500, multiplier: 5.5 },
    'skeleton': { min: 25, max: 3500, multiplier: 5.5 },
    
    // Other weapons
    'nova': { min: 0.05, max: 100, multiplier: 0.08 },
    'xm1014': { min: 0.05, max: 150, multiplier: 0.1 },
    'sawed-off': { min: 0.05, max: 100, multiplier: 0.08 },
    'mag-7': { min: 0.05, max: 120, multiplier: 0.09 },
    'm249': { min: 0.1, max: 200, multiplier: 0.15 },
    'negev': { min: 0.1, max: 200, multiplier: 0.15 },
  };

  // Rarity multipliers
  const rarityMultipliers = {
    'consumer': 1.0,
    'industrial': 1.5,
    'mil-spec': 2.0,
    'restricted': 4.0,
    'classified': 8.0,
    'covert': 16.0,
    'contraband': 50.0,
    'rare': 100.0,
    'legendary': 200.0,
    'ancient': 500.0,
    'mythical': 1000.0,
  };

  // Wear condition multipliers
  const wearMultipliers = {
    'fn': 1.0,      // Factory New
    'mw': 0.8,      // Minimal Wear
    'ft': 0.6,      // Field-Tested
    'ww': 0.4,      // Well-Worn
    'bs': 0.2,      // Battle-Scarred
  };

  // Get weapon type from market hash name
  const marketHashName = skin.marketHashName?.toLowerCase() || '';
  let weaponType = 'rifle'; // default
  let basePrice = { min: 0.5, max: 100, multiplier: 1.0 };

  // Find matching weapon type
  for (const [weapon, price] of Object.entries(weaponBasePrices)) {
    if (marketHashName.includes(weapon)) {
      weaponType = weapon;
      basePrice = price;
      break;
    }
  }

  // Get rarity multiplier
  const rarity = skin.rarity?.toLowerCase() || 'consumer';
  const rarityMultiplier = rarityMultipliers[rarity] || 1.0;

  // Get wear multiplier
  const wear = skin.wear?.toLowerCase() || 'ft';
  const wearMultiplier = wearMultipliers[wear] || 0.6;

  // StatTrak multiplier
  const statTrakMultiplier = skin.isStattrak ? 2.5 : 1.0;

  // Calculate base price
  const minPrice = basePrice.min * rarityMultiplier * wearMultiplier * statTrakMultiplier;
  const maxPrice = basePrice.max * rarityMultiplier * wearMultiplier * statTrakMultiplier;

  // Generate random price within range
  const price = Math.random() * (maxPrice - minPrice) + minPrice;
  
  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
}

async function generateRealisticPrices() {
  console.log("🔍 [PRICES] Starting realistic price generation...");

  try {
    // Get all skins without prices
    const skinsWithoutPrices = await prisma.skin.findMany({
      where: {
        AND: [
          { priceLatest: null },
          { priceMedian: null },
          { priceAvg: null }
        ]
      },
      select: {
        id: true,
        name: true,
        marketHashName: true,
        rarity: true,
        wear: true,
        isStattrak: true,
        weaponType: true
      }
    });

    console.log(`📊 [PRICES] Found ${skinsWithoutPrices.length} skins without prices`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const skin of skinsWithoutPrices) {
      try {
        const price = generateRealisticPrice(skin);
        
        // Generate related prices with some variation
        const medianPrice = price * (0.95 + Math.random() * 0.1); // ±5% variation
        const avgPrice = price * (0.98 + Math.random() * 0.04); // ±2% variation
        const minPrice = price * (0.8 + Math.random() * 0.15); // -20% to -5%
        const maxPrice = price * (1.05 + Math.random() * 0.2); // +5% to +25%

        await prisma.skin.update({
          where: { id: skin.id },
          data: {
            priceLatest: price,
            priceMedian: Math.round(medianPrice * 100) / 100,
            priceAvg: Math.round(avgPrice * 100) / 100,
            priceMin: Math.round(minPrice * 100) / 100,
            priceMax: Math.round(maxPrice * 100) / 100,
            offerVolume: Math.floor(Math.random() * 50) + 1,
            buyOrderVolume: Math.floor(Math.random() * 20) + 1,
            sold24h: Math.floor(Math.random() * 10),
            sold7d: Math.floor(Math.random() * 50) + 5,
            sold30d: Math.floor(Math.random() * 200) + 20,
            priceUpdatedAt: new Date(),
            unstable: Math.random() < 0.1, // 10% chance of being unstable
          }
        });

        // Add to price history
        await prisma.priceHistory.create({
          data: {
            skinId: skin.id,
            date: new Date(),
            price: price
          }
        });

        updatedCount++;
        
        if (updatedCount % 1000 === 0) {
          console.log(`✅ [PRICES] Updated ${updatedCount} skins...`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ [PRICES] Error updating skin ${skin.id}: ${error.message}`);
      }
    }

    console.log(`🎯 [PRICES] Price generation completed!`);
    console.log(`✅ Updated: ${updatedCount} skins`);
    console.log(`❌ Errors: ${errorCount} skins`);

  } catch (error) {
    console.error("❌ [PRICES] Fatal error during price generation:", error);
    throw error;
  }
}

async function main() {
  try {
    await generateRealisticPrices();
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
