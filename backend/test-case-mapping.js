// Test case mapping with real skin
import prisma from "./src/prisma/prismaClient.js";

async function testCaseMapping() {
  try {
    console.log("=== TESTING CASE MAPPING ===");
    
    // Test with a Fever Dream skin (should map to Fever Case)
    const feverSkin = await prisma.skin.findFirst({
      where: { 
        name: { contains: "Fever Dream", mode: 'insensitive' }
      },
      select: { id: true, name: true, weaponType: true }
    });
    
    if (feverSkin) {
      console.log(`\nTesting with skin: "${feverSkin.name}" (ID: ${feverSkin.id})`);
      
      // Test the case mapping logic
      const caseMappings = {
        'fever dream': 'Fever Case',
        'neon revolution': 'Revolution Case', 
        'recoil': 'Recoil Case'
      };
      
      const skinNameLower = feverSkin.name.toLowerCase();
      console.log(`Skin name lower: "${skinNameLower}"`);
      
      for (const [pattern, caseName] of Object.entries(caseMappings)) {
        console.log(`Checking pattern "${pattern}" -> "${caseName}"`);
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
            console.log(`✅ CASE FOUND: ${caseItem.name} (ID: ${caseItem.id})`);
          } else {
            console.log(`❌ Case "${caseName}" not found in database`);
          }
        } else {
          console.log(`❌ Pattern "${pattern}" not found in skin name`);
        }
      }
    } else {
      console.log("No Fever Dream skin found");
    }
    
    // Test with a Neon Revolution skin
    const revolutionSkin = await prisma.skin.findFirst({
      where: { 
        name: { contains: "Neon Revolution", mode: 'insensitive' }
      },
      select: { id: true, name: true, weaponType: true }
    });
    
    if (revolutionSkin) {
      console.log(`\nTesting with skin: "${revolutionSkin.name}" (ID: ${revolutionSkin.id})`);
      
      const skinNameLower = revolutionSkin.name.toLowerCase();
      console.log(`Skin name lower: "${skinNameLower}"`);
      
      if (skinNameLower.includes('neon revolution')) {
        console.log(`✅ MATCH! "neon revolution" found in skin name`);
        
        const caseItem = await prisma.skin.findFirst({
          where: {
            weaponType: "case",
            name: "Revolution Case"
          },
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        });
        
        if (caseItem) {
          console.log(`✅ CASE FOUND: ${caseItem.name} (ID: ${caseItem.id})`);
        } else {
          console.log(`❌ Case "Revolution Case" not found in database`);
        }
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCaseMapping();
