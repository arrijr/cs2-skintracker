// /backend/scripts/debugCaseFilter.js — [Backend]
// {/* Debug case filtering logic */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugCaseFilter() {
  console.log("🔍 Debugging case filter logic...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Total cases in DB: ${cases.length}`);
    
    // Simulate frontend filter logic
    const searchTerm = "";
    const priceRange = { min: 0, max: 1000 };
    const extinctionRange = { min: 0, max: 200 };
    
    let filtered = cases.filter(caseItem => {
      const matchesSearch = caseItem.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiscontinued = true; // Always show all cases
      const matchesPriceRange = caseItem.price ? 
        caseItem.price >= priceRange.min && caseItem.price <= priceRange.max : true;
      const matchesExtinctionRange = caseItem.timeToExtinction ? 
        caseItem.timeToExtinction >= extinctionRange.min && caseItem.timeToExtinction <= extinctionRange.max : true;
      
      return matchesSearch && matchesDiscontinued && matchesPriceRange && matchesExtinctionRange;
    });
    
    console.log(`🎯 After filtering: ${filtered.length} cases`);
    
    // Check for cases that might be filtered out
    const filteredOut = cases.filter(caseItem => {
      const matchesSearch = caseItem.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDiscontinued = true;
      const matchesPriceRange = caseItem.price ? 
        caseItem.price >= priceRange.min && caseItem.price <= priceRange.max : true;
      const matchesExtinctionRange = caseItem.timeToExtinction ? 
        caseItem.timeToExtinction >= extinctionRange.min && caseItem.timeToExtinction <= extinctionRange.max : true;
      
      return !(matchesSearch && matchesDiscontinued && matchesPriceRange && matchesExtinctionRange);
    });
    
    if (filteredOut.length > 0) {
      console.log(`❌ Filtered out ${filteredOut.length} cases:`);
      filteredOut.forEach(c => {
        console.log(`- ${c.name}: price=${c.price}, timeToExtinction=${c.timeToExtinction}`);
      });
    }
    
    // Show first 10 cases that would be displayed
    console.log(`📋 First 10 cases that would be displayed:`);
    filtered.slice(0, 10).forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} (price: $${c.price}, discontinued: ${c.isDiscontinued})`);
    });
    
  } catch (error) {
    console.error("❌ Error debugging case filter:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCaseFilter();
