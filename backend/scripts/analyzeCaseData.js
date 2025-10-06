// /backend/scripts/analyzeCaseData.js — [Backend]
// {/* Analyze current case data and discontinued status */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyzeCaseData() {
  console.log("🔍 Analyzing current case data and discontinued status...");
  
  try {
    const cases = await prisma.case.findMany({
      include: {
        caseSupply: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { releaseDate: 'asc' }
    });
    
    console.log(`\n📊 Found ${cases.length} cases total\n`);
    
    // Analyze by release year
    const casesByYear = {};
    const discontinuedCases = [];
    const activeCases = [];
    
    cases.forEach(caseItem => {
      const releaseYear = caseItem.releaseDate ? caseItem.releaseDate.getFullYear() : 'Unknown';
      if (!casesByYear[releaseYear]) casesByYear[releaseYear] = [];
      casesByYear[releaseYear].push(caseItem);
      
      // Check if case should be discontinued based on age
      if (caseItem.releaseDate) {
        const yearsSinceRelease = (new Date() - caseItem.releaseDate) / (1000 * 60 * 60 * 24 * 365);
        
        // Cases older than 3 years should likely be discontinued
        if (yearsSinceRelease > 3) {
          discontinuedCases.push({
            name: caseItem.name,
            releaseDate: caseItem.releaseDate,
            yearsOld: Math.round(yearsSinceRelease * 10) / 10,
            isDiscontinued: caseItem.isDiscontinued,
            lastSupply: caseItem.caseSupply[0]
          });
        } else {
          activeCases.push({
            name: caseItem.name,
            releaseDate: caseItem.releaseDate,
            yearsOld: Math.round(yearsSinceRelease * 10) / 10,
            isDiscontinued: caseItem.isDiscontinued
          });
        }
      }
    });
    
    // Display analysis
    console.log("📅 Cases by Release Year:");
    Object.keys(casesByYear).sort().forEach(year => {
      console.log(`  ${year}: ${casesByYear[year].length} cases`);
    });
    
    console.log(`\n🚫 Cases that should be DISCONTINUED (${discontinuedCases.length}):`);
    discontinuedCases.forEach(caseItem => {
      const status = caseItem.isDiscontinued ? "✅ Already marked" : "❌ NOT marked";
      console.log(`  ${caseItem.name} (${caseItem.yearsOld}y old) - ${status}`);
    });
    
    console.log(`\n✅ ACTIVE Cases (${activeCases.length}):`);
    activeCases.forEach(caseItem => {
      const status = caseItem.isDiscontinued ? "❌ Incorrectly marked" : "✅ Correctly active";
      console.log(`  ${caseItem.name} (${caseItem.yearsOld}y old) - ${status}`);
    });
    
    // Check supply history patterns
    console.log(`\n📈 Supply History Analysis:`);
    const casesWithSupply = cases.filter(c => c.caseSupply.length > 0);
    console.log(`  Cases with supply data: ${casesWithSupply.length}`);
    
    if (casesWithSupply.length > 0) {
      const sampleCase = casesWithSupply[0];
      console.log(`  Sample case: ${sampleCase.name}`);
      console.log(`  Latest supply data: ${JSON.stringify(sampleCase.caseSupply[0], null, 2)}`);
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    console.log(`  1. Mark ${discontinuedCases.filter(c => !c.isDiscontinued).length} cases as discontinued`);
    console.log(`  2. Update supply history logic to stop drops for discontinued cases`);
    console.log(`  3. Only show unboxings for discontinued cases`);
    
  } catch (error) {
    console.error("❌ Error analyzing case data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCaseData();
