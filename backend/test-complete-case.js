// Test complete case system
import prisma from "./src/prisma/prismaClient.js";

async function testCompleteCaseSystem() {
  try {
    console.log("=== TESTING COMPLETE CASE SYSTEM ===");
    
    // Test 1: Get a Fever Dream skin
    const feverSkin = await prisma.skin.findFirst({
      where: { 
        name: { contains: "Fever Dream", mode: 'insensitive' }
      },
      select: { id: true, name: true, weaponType: true }
    });
    
    if (feverSkin) {
      console.log(`\n1. TESTING SKIN: "${feverSkin.name}" (ID: ${feverSkin.id})`);
      
      // Test case resolution
      const caseMappings = {
        'fever dream': 'Fever Case',
        'neon revolution': 'Revolution Case', 
        'recoil': 'Recoil Case'
      };
      
      const skinNameLower = feverSkin.name.toLowerCase();
      let foundCase = null;
      
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
            foundCase = caseItem;
            console.log(`✅ Found case: ${caseItem.name} (ID: ${caseItem.id})`);
            break;
          }
        }
      }
      
      if (foundCase) {
        // Test getting skins for this case
        console.log(`\n2. TESTING CASE SKINS for "${foundCase.name}"`);
        
        const casePattern = 'fever dream';
        const caseSkins = await prisma.skin.findMany({
          where: {
            weaponType: { not: "case" },
            name: { contains: casePattern, mode: 'insensitive' }
          },
          select: {
            id: true,
            name: true,
            weaponType: true,
            rarity: true
          },
          take: 5
        });
        
        console.log(`Found ${caseSkins.length} skins in case:`);
        caseSkins.forEach(skin => {
          console.log(`  - "${skin.name}" (${skin.weaponType}, ${skin.rarity})`);
        });
      }
    }
    
    // Test 2: Test with Revolution Case
    console.log(`\n3. TESTING REVOLUTION CASE`);
    const revolutionCase = await prisma.skin.findFirst({
      where: {
        weaponType: "case",
        name: "Revolution Case"
      },
      select: {
        id: true,
        name: true
      }
    });
    
    if (revolutionCase) {
      console.log(`Found case: ${revolutionCase.name} (ID: ${revolutionCase.id})`);
      
      const caseSkins = await prisma.skin.findMany({
        where: {
          weaponType: { not: "case" },
          name: { contains: 'neon revolution', mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          weaponType: true,
          rarity: true
        },
        take: 5
      });
      
      console.log(`Found ${caseSkins.length} skins in Revolution Case:`);
      caseSkins.forEach(skin => {
        console.log(`  - "${skin.name}" (${skin.weaponType}, ${skin.rarity})`);
      });
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteCaseSystem();
