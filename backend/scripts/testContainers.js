// /backend/scripts/testContainers.js — [Backend]
// {/* Test containers from skins */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testContainers() {
  try {
    console.log("🔍 Testing containers from skins...");
    
    // Test skins with container weapon type
    const containerSkins = await prisma.skin.findMany({
      select: { 
        name: true,
        weaponType: true,
        itemName: true,
        itemGroup: true
      },
      where: { 
        weaponType: 'container'
      },
      take: 20
    });
    
    console.log(`📦 Found ${containerSkins.length} container skins`);
    console.log("📦 Container skins:");
    containerSkins.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.itemName})`);
    });
    
    // Test distinct item names for containers
    const containerNames = await prisma.skin.findMany({
      select: { itemName: true },
      distinct: ['itemName'],
      where: { 
        weaponType: 'container',
        itemName: { not: null },
        itemName: { not: '' }
      },
      orderBy: { itemName: 'asc' }
    });
    
    console.log(`\n🎯 Found ${containerNames.length} distinct container names`);
    console.log("🎯 Container names:");
    containerNames.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemName}`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testContainers();
