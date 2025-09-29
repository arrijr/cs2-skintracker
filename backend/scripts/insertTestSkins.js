// /backend/scripts/insertTestSkins.js (Backend)
// {/* Insert test skins to make the app functional */}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety, safeDatabaseOperation } from "./safety-guard.js";

const prisma = new PrismaClient();

// Safety check: Only allow in development
checkProductionSafety("Test skins insertion", false);

const testSkins = [
  {
    name: "AK-47 | Redline",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5gZKKkuXLPr7Vn35cppwl3L7F9J3wjO2s_0I4M2j3I4fDc1Lr_1Hq-FC1rOe6gJO_tqjJh3o1vJzHjA",
    weaponType: "rifle",
    wear: "Field-Tested",
    rarity: "Classified",
    quality: "Classified",
    isStattrak: false,
    isStar: false,
    priceAvg: 15.50,
    priceMedian: 15.00,
    priceLatest: 15.50
  },
  {
    name: "AWP | Dragon Lore",
    marketHashName: "AWP | Dragon Lore (Factory New)",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5gZKKkuXLPr7Vn35cppwl3L7F9J3wjO2s_0I4M2j3I4fDc1Lr_1Hq-FC1rOe6gJO_tqjJh3o1vJzHjA",
    weaponType: "rifle",
    wear: "Factory New",
    rarity: "Covert",
    quality: "Covert",
    isStattrak: false,
    isStar: false,
    priceAvg: 2500.00,
    priceMedian: 2400.00,
    priceLatest: 2500.00
  },
  {
    name: "★ StatTrak™ Gut Knife | Urban Masked",
    marketHashName: "★ StatTrak™ Gut Knife | Urban Masked (Minimal Wear)",
    imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5gZKKkuXLPr7Vn35cppwl3L7F9J3wjO2s_0I4M2j3I4fDc1Lr_1Hq-FC1rOe6gJO_tqjJh3o1vJzHjA",
    weaponType: "knife",
    wear: "Minimal Wear",
    rarity: "Covert",
    quality: "Covert",
    isStattrak: true,
    isStar: true,
    priceAvg: 190.40,
    priceMedian: 185.00,
    priceLatest: 190.40
  }
];

async function insertTestSkins() {
  try {
    console.log("🔍 Inserting test skins...");
    
    // Check if skins already exist
    const existingCount = await prisma.skin.count();
    console.log(`📊 Existing skins: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log("✅ Skins already exist, skipping insertion");
      return;
    }
    
    // Insert test skins
    for (const skin of testSkins) {
      const created = await prisma.skin.create({
        data: skin
      });
      console.log(`✅ Created skin: ${created.name} (ID: ${created.id})`);
    }
    
    console.log("🎉 Test skins inserted successfully!");
    
    // Verify
    const finalCount = await prisma.skin.count();
    console.log(`📊 Final skin count: ${finalCount}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

insertTestSkins();
