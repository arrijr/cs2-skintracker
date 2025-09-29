import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety } from "./safety-guard.js";

const prisma = new PrismaClient();

// Safety check: Only allow in development
checkProductionSafety("Sample price generation", false);

/**
 * Generate realistic sample prices based on skin type and rarity
 */
function generateSamplePrice(skin) {
  const basePrices = {
    // Knives (highest value)
    'knife': { min: 50, max: 3000 },
    'bayonet': { min: 50, max: 3000 },
    'karambit': { min: 100, max: 5000 },
    'butterfly': { min: 100, max: 5000 },
    'm9': { min: 80, max: 4000 },
    'gut': { min: 30, max: 2000 },
    'flip': { min: 30, max: 2000 },
    'huntsman': { min: 40, max: 2500 },
    'falchion': { min: 30, max: 2000 },
    'bowie': { min: 30, max: 2000 },
    'shadow': { min: 20, max: 1500 },
    'stiletto': { min: 30, max: 2000 },
    'talon': { min: 40, max: 2500 },
    'ursus': { min: 30, max: 2000 },
    'navaja': { min: 20, max: 1500 },
    'skeleton': { min: 40, max: 2500 },
    'classic': { min: 20, max: 1500 },
    'paracord': { min: 30, max: 2000 },
    'survival': { min: 30, max: 2000 },
    'nomad': { min: 30, max: 2000 },
    
    // Gloves
    'gloves': { min: 20, max: 1000 },
    'hand': { min: 20, max: 1000 },
    'sport': { min: 20, max: 1000 },
    'driver': { min: 20, max: 1000 },
    'moto': { min: 20, max: 1000 },
    'specialist': { min: 20, max: 1000 },
    
    // Weapons
    'ak-47': { min: 0.5, max: 500 },
    'awp': { min: 0.5, max: 3000 },
    'm4a4': { min: 0.5, max: 800 },
    'm4a1-s': { min: 0.5, max: 800 },
    'ak': { min: 0.5, max: 500 },
    'awp': { min: 0.5, max: 3000 },
    'glock': { min: 0.1, max: 50 },
    'usp': { min: 0.1, max: 50 },
    'p250': { min: 0.1, max: 30 },
    'deagle': { min: 0.1, max: 100 },
    'five-seven': { min: 0.1, max: 30 },
    'tec-9': { min: 0.1, max: 30 },
    'cz75': { min: 0.1, max: 30 },
    'p2000': { min: 0.1, max: 30 },
    'dual': { min: 0.1, max: 30 },
    'r8': { min: 0.1, max: 30 },
    'mac-10': { min: 0.1, max: 20 },
    'mp9': { min: 0.1, max: 20 },
    'mp7': { min: 0.1, max: 20 },
    'ump': { min: 0.1, max: 20 },
    'p90': { min: 0.1, max: 30 },
    'pp-bizon': { min: 0.1, max: 20 },
    'mp5': { min: 0.1, max: 20 },
    'galil': { min: 0.1, max: 30 },
    'famas': { min: 0.1, max: 30 },
    'aug': { min: 0.1, max: 30 },
    'sg': { min: 0.1, max: 30 },
    'scar': { min: 0.1, max: 30 },
    'g3sg1': { min: 0.1, max: 30 },
    'ssg': { min: 0.1, max: 30 },
    'awp': { min: 0.5, max: 3000 },
    'm249': { min: 0.1, max: 20 },
    'negev': { min: 0.1, max: 20 },
    'nova': { min: 0.1, max: 20 },
    'xm1014': { min: 0.1, max: 20 },
    'sawed-off': { min: 0.1, max: 20 },
    'mag-7': { min: 0.1, max: 20 },
    
    // Stickers
    'sticker': { min: 0.01, max: 50 },
    'souvenir': { min: 0.1, max: 100 },
    'graffiti': { min: 0.01, max: 5 },
    'sealed': { min: 0.01, max: 5 },
    
    // Cases
    'case': { min: 0.1, max: 10 },
    'capsule': { min: 0.1, max: 10 },
    'package': { min: 0.1, max: 10 },
    'pass': { min: 0.1, max: 10 },
  };
  
  // Get skin name and type for price calculation
  const name = skin.name?.toLowerCase() || '';
  const marketHashName = skin.marketHashName?.toLowerCase() || '';
  const weaponType = skin.weaponType?.toLowerCase() || '';
  const itemType = skin.itemType?.toLowerCase() || '';
  
  // Determine base price category
  let category = 'weapon'; // default
  let basePrice = { min: 0.1, max: 10 }; // default
  
  // Check for knives first
  if (name.includes('knife') || marketHashName.includes('knife') || 
      name.includes('bayonet') || name.includes('karambit') || 
      name.includes('butterfly') || name.includes('m9') || 
      name.includes('gut') || name.includes('flip') || 
      name.includes('huntsman') || name.includes('falchion') || 
      name.includes('bowie') || name.includes('shadow') || 
      name.includes('stiletto') || name.includes('talon') || 
      name.includes('ursus') || name.includes('navaja') || 
      name.includes('skeleton') || name.includes('classic') || 
      name.includes('paracord') || name.includes('survival') || 
      name.includes('nomad')) {
    category = 'knife';
  }
  // Check for gloves
  else if (name.includes('gloves') || name.includes('hand') || 
           name.includes('sport') || name.includes('driver') || 
           name.includes('moto') || name.includes('specialist')) {
    category = 'gloves';
  }
  // Check for stickers
  else if (name.includes('sticker') || marketHashName.includes('sticker')) {
    category = 'sticker';
  }
  // Check for souvenirs
  else if (name.includes('souvenir') || marketHashName.includes('souvenir')) {
    category = 'souvenir';
  }
  // Check for graffiti
  else if (name.includes('graffiti') || name.includes('sealed')) {
    category = 'graffiti';
  }
  // Check for cases
  else if (name.includes('case') || name.includes('capsule') || 
           name.includes('package') || name.includes('pass')) {
    category = 'case';
  }
  // Check for specific weapons
  else if (name.includes('ak-47') || marketHashName.includes('ak-47')) {
    category = 'ak-47';
  }
  else if (name.includes('awp') || marketHashName.includes('awp')) {
    category = 'awp';
  }
  else if (name.includes('m4a4') || marketHashName.includes('m4a4')) {
    category = 'm4a4';
  }
  else if (name.includes('m4a1-s') || marketHashName.includes('m4a1-s')) {
    category = 'm4a1-s';
  }
  else if (weaponType) {
    category = weaponType;
  }
  
  // Get base price range
  basePrice = basePrices[category] || basePrices['weapon'];
  
  // Apply StatTrak multiplier
  let multiplier = 1;
  if (name.includes('stattrak') || marketHashName.includes('stattrak')) {
    multiplier = 1.5; // StatTrak items are typically more expensive
  }
  
  // Apply wear condition multiplier
  const wearMultiplier = {
    'factory new': 1.2,
    'minimal wear': 1.1,
    'field-tested': 1.0,
    'well-worn': 0.9,
    'battle-scarred': 0.8
  };
  
  const wear = marketHashName.match(/\((.*?)\)/)?.[1]?.toLowerCase();
  if (wear && wearMultiplier[wear]) {
    multiplier *= wearMultiplier[wear];
  }
  
  // Apply rarity multiplier
  const rarityMultiplier = {
    'consumer': 0.5,
    'industrial': 0.7,
    'mil-spec': 1.0,
    'restricted': 1.5,
    'classified': 2.0,
    'covert': 3.0,
    'contraband': 5.0
  };
  
  if (skin.rarity && rarityMultiplier[skin.rarity.toLowerCase()]) {
    multiplier *= rarityMultiplier[skin.rarity.toLowerCase()];
  }
  
  // Generate random price within range
  const minPrice = basePrice.min * multiplier;
  const maxPrice = basePrice.max * multiplier;
  const price = Math.random() * (maxPrice - minPrice) + minPrice;
  
  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
}

/**
 * Generate sample price history for a skin
 */
function generateSamplePriceHistory(skin, currentPrice) {
  const history = [];
  const today = new Date();
  
  // Generate 30 days of price history
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some random variation (±10%)
    const variation = (Math.random() - 0.5) * 0.2; // ±10%
    const price = currentPrice * (1 + variation);
    
    history.push({
      skinId: skin.id,
      date: date,
      price: Math.round(price * 100) / 100
    });
  }
  
  return history;
}

async function generateSamplePrices() {
  console.log("🔍 Generating sample prices for all skins...");
  
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
        weaponType: true,
        itemType: true,
        rarity: true
      }
    });
    
    console.log(`📊 Found ${skinsWithoutPrices.length} skins without prices`);
    
    let processed = 0;
    let priceHistoryCreated = 0;
    
    for (const skin of skinsWithoutPrices) {
      try {
        // Generate sample price
        const samplePrice = generateSamplePrice(skin);
        
        // Update skin with sample prices
        await prisma.skin.update({
          where: { id: skin.id },
          data: {
            priceLatest: samplePrice,
            priceMedian: samplePrice * 0.95, // Slightly lower median
            priceAvg: samplePrice * 1.02,    // Slightly higher average
            priceSafe: samplePrice * 0.9,    // Safe price (90% of latest)
            priceMin: samplePrice * 0.8,     // Min price (80% of latest)
            priceMax: samplePrice * 1.2,     // Max price (120% of latest)
            
            // Historical prices
            priceMedian24h: samplePrice * 0.98,
            priceMedian7d: samplePrice * 0.96,
            priceMedian30d: samplePrice * 0.94,
            priceMedian90d: samplePrice * 0.92,
            priceAvg24h: samplePrice * 1.01,
            priceAvg7d: samplePrice * 1.02,
            priceAvg30d: samplePrice * 1.03,
            priceAvg90d: samplePrice * 1.05,
            
            // Sales statistics
            soldToday: Math.floor(Math.random() * 10),
            sold24h: Math.floor(Math.random() * 50),
            sold7d: Math.floor(Math.random() * 200),
            sold30d: Math.floor(Math.random() * 800),
            sold90d: Math.floor(Math.random() * 2000),
            soldTotal: Math.floor(Math.random() * 5000),
            hoursToSold: Math.random() * 48,
            
            // Market data
            offerVolume: Math.floor(Math.random() * 100),
            buyOrderVolume: Math.floor(Math.random() * 50),
            priceUpdatedAt: new Date()
          }
        });
        
        // Generate sample price history
        const priceHistory = generateSamplePriceHistory(skin, samplePrice);
        
        // Insert price history in batches
        for (const entry of priceHistory) {
          await prisma.priceHistory.create({
            data: entry
          });
        }
        
        priceHistoryCreated += priceHistory.length;
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`📊 Processed ${processed}/${skinsWithoutPrices.length} skins...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing skin ${skin.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Sample price generation completed!`);
    console.log(`📊 Processed: ${processed} skins`);
    console.log(`📈 Price history entries created: ${priceHistoryCreated}`);
    
    // Verify results
    const skinsWithPrices = await prisma.skin.count({
      where: {
        OR: [
          { priceLatest: { not: null } },
          { priceMedian: { not: null } },
          { priceAvg: { not: null } }
        ]
      }
    });
    
    const totalPriceHistory = await prisma.priceHistory.count();
    
    console.log(`📊 Final stats:`);
    console.log(`   Skins with prices: ${skinsWithPrices}`);
    console.log(`   Total price history entries: ${totalPriceHistory}`);
    
  } catch (error) {
    console.error("❌ Error generating sample prices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateSamplePrices();
