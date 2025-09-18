// Test case resolution for Bayonet | Case Hardened
import prisma from "./src/prisma/prismaClient.js";

async function testBayonetCase() {
  try {
    console.log("=== TESTING BAYONET CASE RESOLUTION ===");
    
    // Find a Bayonet | Case Hardened skin
    const bayonetSkin = await prisma.skin.findFirst({
      where: { 
        name: { contains: "Bayonet | Case Hardened", mode: 'insensitive' }
      },
      select: { id: true, name: true, weaponType: true }
    });
    
    if (bayonetSkin) {
      console.log(`\nFound skin: "${bayonetSkin.name}" (ID: ${bayonetSkin.id})`);
      
      // Test the case mapping logic
      const caseMappings = {
        'fever dream': 'Fever Case',
        'neon revolution': 'Revolution Case', 
        'recoil': 'Recoil Case',
        'fracture': 'Fracture Case',
        'kilowatt': 'Kilowatt Case',
        'snakebite': 'Snakebite Case',
        'gallery': 'Gallery Case',
        'clutch': 'Clutch Case',
        'cs20': 'CS20 Case',
        'shadow': 'Shadow Case'
      };
      
      const finishToCaseMappings = {
        'case hardened': 'Operation Bravo Case',
        'fade': 'Operation Bravo Case',
        'crimson web': 'Operation Bravo Case',
        'slaughter': 'Operation Bravo Case',
        'night': 'Operation Bravo Case',
        'blue steel': 'Operation Bravo Case'
      };
      
      const skinNameLower = bayonetSkin.name.toLowerCase();
      console.log(`Skin name lower: "${skinNameLower}"`);
      
      let foundCase = null;
      
      // Check case mappings first
      for (const [pattern, caseName] of Object.entries(caseMappings)) {
        if (skinNameLower.includes(pattern)) {
          console.log(`✅ MATCH! Pattern "${pattern}" found in skin name`);
          
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
            console.log(`✅ CASE FOUND: ${caseItem.name} (ID: ${caseItem.id})`);
            break;
          } else {
            console.log(`❌ Case "${caseName}" not found in database`);
          }
        } else {
          console.log(`❌ Pattern "${pattern}" not found in skin name`);
        }
      }
      
      // Check finish mappings if no case found
      if (!foundCase) {
        console.log(`\nChecking finish mappings...`);
        for (const [finish, caseName] of Object.entries(finishToCaseMappings)) {
          if (skinNameLower.includes(finish)) {
            console.log(`✅ FINISH MATCH! "${finish}" found in skin name`);
            
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
              console.log(`✅ CASE FOUND via finish: ${caseItem.name} (ID: ${caseItem.id})`);
              break;
            } else {
              console.log(`❌ Case "${caseName}" not found in database`);
            }
          } else {
            console.log(`❌ Finish "${finish}" not found in skin name`);
          }
        }
      }
      
      if (!foundCase) {
        console.log(`\n❌ NO CASE FOUND for "${bayonetSkin.name}"`);
        console.log(`This explains why the CaseSection doesn't show up!`);
        
        // Check if there are any cases that might contain this skin
        console.log(`\nChecking for potential cases...`);
        const allCases = await prisma.skin.findMany({
          where: { weaponType: "case" },
          select: { id: true, name: true },
          take: 10
        });
        
        console.log(`Available cases:`);
        allCases.forEach(case_ => {
          console.log(`  - ${case_.name} (ID: ${case_.id})`);
        });
      }
    } else {
      console.log("No Bayonet | Case Hardened skin found");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testBayonetCase();
