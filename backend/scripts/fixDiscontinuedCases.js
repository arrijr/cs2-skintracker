// /backend/scripts/fixDiscontinuedCases.js — [Backend]
// {/* Fix discontinued status for old cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDiscontinuedCases() {
  console.log("🔧 Fixing discontinued status for old cases...");
  
  try {
    const cases = await prisma.case.findMany({
      orderBy: { releaseDate: 'asc' }
    });
    
    console.log(`📦 Found ${cases.length} cases to analyze\n`);
    
    let updatedCount = 0;
    const discontinuedCases = [];
    const activeCases = [];
    
    for (const caseItem of cases) {
      if (!caseItem.releaseDate) {
        console.log(`⚠️ Skipping case without release date: ${caseItem.name}`);
        continue;
      }
      
      const yearsSinceRelease = (new Date() - caseItem.releaseDate) / (1000 * 60 * 60 * 24 * 365);
      const shouldBeDiscontinued = yearsSinceRelease > 3; // Cases older than 3 years
      
      if (shouldBeDiscontinued && !caseItem.isDiscontinued) {
        // Mark as discontinued
        await prisma.case.update({
          where: { id: caseItem.id },
          data: {
            isDiscontinued: true,
            discontinuedDate: new Date(caseItem.releaseDate.getTime() + (3 * 365 * 24 * 60 * 60 * 1000)) // 3 years after release
          }
        });
        
        discontinuedCases.push({
          name: caseItem.name,
          releaseDate: caseItem.releaseDate,
          yearsOld: Math.round(yearsSinceRelease * 10) / 10,
          discontinuedDate: new Date(caseItem.releaseDate.getTime() + (3 * 365 * 24 * 60 * 60 * 1000))
        });
        
        updatedCount++;
        console.log(`✅ Marked as discontinued: ${caseItem.name} (${Math.round(yearsSinceRelease * 10) / 10}y old)`);
        
      } else if (!shouldBeDiscontinued && caseItem.isDiscontinued) {
        // Mark as active (shouldn't happen based on our analysis, but just in case)
        await prisma.case.update({
          where: { id: caseItem.id },
          data: {
            isDiscontinued: false,
            discontinuedDate: null
          }
        });
        
        activeCases.push({
          name: caseItem.name,
          releaseDate: caseItem.releaseDate,
          yearsOld: Math.round(yearsSinceRelease * 10) / 10
        });
        
        console.log(`🔄 Marked as active: ${caseItem.name} (${Math.round(yearsSinceRelease * 10) / 10}y old)`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Marked as discontinued: ${discontinuedCases.length} cases`);
    console.log(`  🔄 Marked as active: ${activeCases.length} cases`);
    console.log(`  📈 Total updated: ${updatedCount} cases`);
    
    if (discontinuedCases.length > 0) {
      console.log(`\n🚫 Discontinued Cases:`);
      discontinuedCases.forEach(caseItem => {
        console.log(`  ${caseItem.name} (${caseItem.yearsOld}y old) - discontinued ${caseItem.discontinuedDate.toISOString().split('T')[0]}`);
      });
    }
    
    if (activeCases.length > 0) {
      console.log(`\n✅ Active Cases:`);
      activeCases.forEach(caseItem => {
        console.log(`  ${caseItem.name} (${caseItem.yearsOld}y old)`);
      });
    }
    
    console.log(`\n🎉 Discontinued status fix completed!`);
    
  } catch (error) {
    console.error("❌ Error fixing discontinued cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDiscontinuedCases();
