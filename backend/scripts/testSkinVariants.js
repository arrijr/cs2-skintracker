import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSkinVariants() {
  try {
    console.log("Testing skin variants...");
    
    // Get a sample skin
    const sampleSkin = await prisma.skin.findFirst({
      select: {
        id: true,
        name: true,
        weaponType: true,
        itemName: true,
        itemGroup: true,
        wear: true,
        quality: true
      }
    });
    
    if (!sampleSkin) {
      console.log("No skins found in database");
      return;
    }
    
    console.log("Sample skin:", sampleSkin);
    
    // Test variants query
    const variants = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: sampleSkin.id } },
          { weaponType: sampleSkin.weaponType },
          { itemName: sampleSkin.itemName },
          { itemGroup: sampleSkin.itemGroup }
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
        priceMedian: true
      },
      orderBy: [
        { wear: 'asc' },
        { isStattrak: 'asc' }
      ]
    });
    
    console.log(`Found ${variants.length} variants for skin ${sampleSkin.id}`);
    console.log("Variants:", variants);
    
    // Test case query
    const caseSkins = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: sampleSkin.id } },
          { itemGroup: sampleSkin.itemGroup }
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
        priceMedian: true
      },
      take: 10
    });
    
    console.log(`Found ${caseSkins.length} case skins for skin ${sampleSkin.id}`);
    console.log("Case skins:", caseSkins);
    
  } catch (error) {
    console.error("Error testing skin variants:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSkinVariants();
