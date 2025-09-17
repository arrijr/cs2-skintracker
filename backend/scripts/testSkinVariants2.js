import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSkinVariants() {
  try {
    console.log("Testing skin variants with weapons...");
    
    // Get a weapon skin (not sticker)
    const weaponSkin = await prisma.skin.findFirst({
      where: {
        wear: { not: null },
        weaponType: { not: null }
      },
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
    
    if (!weaponSkin) {
      console.log("No weapon skins found in database");
      return;
    }
    
    console.log("Weapon skin:", weaponSkin);
    
    // Test variants query
    const variants = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: weaponSkin.id } },
          { weaponType: weaponSkin.weaponType },
          { itemName: weaponSkin.itemName }
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
    
    console.log(`Found ${variants.length} variants for weapon skin ${weaponSkin.id}`);
    console.log("Variants:", variants);
    
    // Test related skins
    const relatedSkins = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: weaponSkin.id } },
          {
            OR: [
              { weaponType: weaponSkin.weaponType },
              { itemName: weaponSkin.itemName }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        priceAvg: true,
        priceMedian: true,
        wear: true,
        rarity: true,
        isStattrak: true,
        isStar: true
      },
      orderBy: [
        { priceAvg: 'desc' }
      ],
      take: 12
    });
    
    console.log(`Found ${relatedSkins.length} related skins for weapon skin ${weaponSkin.id}`);
    console.log("Related skins:", relatedSkins);
    
  } catch (error) {
    console.error("Error testing skin variants:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSkinVariants();
