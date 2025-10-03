// /backend/scripts/simpleCaseImport.js — [Backend]
// {/* Simple case import */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function simpleCaseImport() {
  try {
    console.log("🎲 Starting simple case import...");

    // Get all distinct container names
    const containers = await prisma.skin.findMany({
      select: { itemName: true },
      distinct: ['itemName'],
      where: { 
        weaponType: 'container',
        itemName: { not: null },
        itemName: { not: '' }
      },
      orderBy: { itemName: 'asc' }
    });

    console.log(`📦 Found ${containers.length} container names`);

    // Filter for real cases
    const realCases = containers.filter(container => {
      const name = container.itemName.toLowerCase();
      return (
        name.includes('case') && 
        !name.includes('sticker') &&
        !name.includes('capsule') &&
        !name.includes('souvenir') &&
        !name.includes('autograph') &&
        !name.includes('patch') &&
        !name.includes('graffiti') &&
        !name.includes('music') &&
        !name.includes('pin') &&
        !name.includes('package') &&
        !name.includes('box') &&
        !name.includes('kit')
      );
    });

    console.log(`🎯 Found ${realCases.length} real cases`);
    console.log("🎯 Real cases:");
    realCases.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemName}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCaseImport();
