// /backend/scripts/checkAllCases.js — [Backend]
// {/* Check all cases and their skin relationships */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAllCases() {
  try {
    console.log("🔍 Checking all cases and their skin relationships...\n");
    
    // Get all cases
    const cases = await prisma.case.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 ALL CASES IN DATABASE: ${cases.length}`);
    console.log("=".repeat(50));
    
    cases.forEach(c => {
      console.log(`${c.id.toString().padStart(2)}: ${c.name}`);
    });
    
    // Check case-skin relationships
    const relationships = await prisma.caseSkin.groupBy({
      by: ['caseId'],
      _count: { skinId: true },
      orderBy: { caseId: 'asc' }
    });
    
    console.log("\n🎨 CASE-SKIN RELATIONSHIPS:");
    console.log("=".repeat(50));
    
    const caseMap = new Map(cases.map(c => [c.id, c.name]));
    const casesWithSkins = new Set();
    
    relationships.forEach(rel => {
      const caseName = caseMap.get(rel.caseId);
      console.log(`${rel.caseId.toString().padStart(2)}: ${caseName} - ${rel._count.skinId} skins`);
      casesWithSkins.add(rel.caseId);
    });
    
    // Find cases without skins
    const casesWithoutSkins = cases.filter(c => !casesWithSkins.has(c.id));
    
    console.log("\n📊 SUMMARY:");
    console.log("=".repeat(50));
    console.log(`Total cases: ${cases.length}`);
    console.log(`Cases with skins: ${casesWithSkins.size}`);
    console.log(`Cases without skins: ${casesWithoutSkins.length}`);
    
    if (casesWithoutSkins.length > 0) {
      console.log("\n❌ CASES WITHOUT SKINS:");
      console.log("-".repeat(30));
      casesWithoutSkins.forEach(c => {
        console.log(`${c.id}: ${c.name}`);
      });
    } else {
      console.log("\n✅ ALL CASES HAVE SKINS!");
    }
    
    // Show top cases by skin count
    const topCases = relationships
      .sort((a, b) => b._count.skinId - a._count.skinId)
      .slice(0, 10);
    
    console.log("\n🏆 TOP 10 CASES BY SKIN COUNT:");
    console.log("-".repeat(40));
    topCases.forEach(rel => {
      const caseName = caseMap.get(rel.caseId);
      console.log(`${rel._count.skinId.toString().padStart(2)} skins: ${caseName}`);
    });
    
  } catch (error) {
    console.error("❌ Error checking cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllCases();
