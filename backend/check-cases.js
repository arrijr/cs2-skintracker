// Check what cases we have in the database
import prisma from "./src/prisma/prismaClient.js";

async function checkCases() {
  try {
    console.log("=== CHECKING CASES IN DATABASE ===");
    
    // 1. Check for real cases (weaponType: "case")
    const realCases = await prisma.skin.findMany({
      where: { weaponType: "case" },
      select: { id: true, name: true, weaponType: true },
      take: 10
    });
    
    console.log(`\n1. REAL CASES (weaponType: "case"): ${realCases.length}`);
    realCases.forEach(case_ => {
      console.log(`  - ID: ${case_.id}, Name: "${case_.name}"`);
    });
    
    // 2. Check for skins that might be from cases
    const sampleSkins = await prisma.skin.findMany({
      where: { 
        weaponType: { not: "case" },
        name: { contains: "case", mode: 'insensitive' }
      },
      select: { id: true, name: true, weaponType: true },
      take: 5
    });
    
    console.log(`\n2. SKINS WITH "case" IN NAME: ${sampleSkins.length}`);
    sampleSkins.forEach(skin => {
      console.log(`  - ID: ${skin.id}, Name: "${skin.name}", Type: "${skin.weaponType}"`);
    });
    
    // 3. Check for common case patterns
    const casePatterns = ['recoil', 'fracture', 'fever', 'clutch', 'revolution'];
    console.log(`\n3. CHECKING CASE PATTERNS:`);
    
    for (const pattern of casePatterns) {
      const skins = await prisma.skin.findMany({
        where: { 
          name: { contains: pattern, mode: 'insensitive' },
          weaponType: { not: "case" }
        },
        select: { id: true, name: true, weaponType: true },
        take: 3
      });
      
      console.log(`  - Pattern "${pattern}": ${skins.length} skins`);
      skins.forEach(skin => {
        console.log(`    * "${skin.name}" (${skin.weaponType})`);
      });
    }
    
    // 4. Check total counts
    const totalSkins = await prisma.skin.count();
    const totalCases = await prisma.skin.count({ where: { weaponType: "case" } });
    
    console.log(`\n4. TOTALS:`);
    console.log(`  - Total skins: ${totalSkins}`);
    console.log(`  - Total cases: ${totalCases}`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCases();
