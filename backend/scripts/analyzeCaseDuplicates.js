// /backend/scripts/analyzeCaseDuplicates.js — [Backend]
// {/* Analyze case duplicates and naming issues */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyzeCaseDuplicates() {
  console.log("🔍 Analyzing case duplicates and naming issues...");
  
  try {
    // Get all cases
    const cases = await prisma.case.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Total cases in database: ${cases.length}`);
    console.log("");
    
    // Group by normalized name to find duplicates
    const normalizedGroups = {};
    cases.forEach(caseItem => {
      const normalized = caseItem.name.toLowerCase().trim();
      if (!normalizedGroups[normalized]) {
        normalizedGroups[normalized] = [];
      }
      normalizedGroups[normalized].push(caseItem);
    });
    
    // Find duplicates
    const duplicates = Object.entries(normalizedGroups).filter(([key, group]) => group.length > 1);
    
    console.log("🔄 Duplicates found:");
    duplicates.forEach(([normalizedName, group]) => {
      console.log(`\n📦 "${normalizedName}" (${group.length} duplicates):`);
      group.forEach((caseItem, index) => {
        console.log(`  ${index + 1}. ID: ${caseItem.id} | Name: "${caseItem.name}" | Price: $${caseItem.price}`);
      });
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`- Total cases: ${cases.length}`);
    console.log(`- Unique normalized names: ${Object.keys(normalizedGroups).length}`);
    console.log(`- Duplicate groups: ${duplicates.length}`);
    console.log(`- Cases to remove: ${duplicates.reduce((sum, [, group]) => sum + group.length - 1, 0)}`);
    
    // Check naming patterns
    console.log("\n📝 Naming patterns:");
    const allLowercase = cases.filter(c => c.name === c.name.toLowerCase());
    const allUppercase = cases.filter(c => c.name === c.name.toUpperCase());
    const properCase = cases.filter(c => c.name !== c.name.toLowerCase() && c.name !== c.name.toUpperCase());
    
    console.log(`- All lowercase: ${allLowercase.length}`);
    console.log(`- All uppercase: ${allUppercase.length}`);
    console.log(`- Proper case: ${properCase.length}`);
    
    if (allLowercase.length > 0) {
      console.log("\n🔤 Lowercase cases:");
      allLowercase.slice(0, 10).forEach(c => console.log(`  - "${c.name}"`));
    }
    
  } catch (error) {
    console.error("❌ Error analyzing cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCaseDuplicates();
