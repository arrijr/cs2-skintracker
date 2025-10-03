// /backend/scripts/testCollections.js — [Backend]
// {/* Test collections from skins */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCollections() {
  try {
    console.log("🔍 Testing collections from skins...");
    
    // Test distinct collections
    const collections = await prisma.skin.findMany({
      select: { collection: true },
      distinct: ['collection'],
      where: { 
        collection: { not: null },
        collection: { not: '' }
      },
      orderBy: { collection: 'asc' }
    });
    
    console.log(`📦 Found ${collections.length} distinct collections`);
    console.log("📦 Collections:");
    collections.forEach((item, index) => {
      console.log(`${index + 1}. ${item.collection}`);
    });
    
    // Test weapon types
    const weaponTypes = await prisma.skin.findMany({
      select: { weaponType: true },
      distinct: ['weaponType'],
      where: { 
        weaponType: { not: null },
        weaponType: { not: '' }
      },
      orderBy: { weaponType: 'asc' }
    });
    
    console.log(`\n🎯 Found ${weaponTypes.length} distinct weapon types`);
    console.log("🎯 Weapon types:");
    weaponTypes.forEach((item, index) => {
      console.log(`${index + 1}. ${item.weaponType}`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCollections();
