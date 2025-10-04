// /backend/scripts/cleanupCaseDuplicates.js — [Backend]
// {/* Clean up case duplicates and fix naming */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupCaseDuplicates() {
  console.log("🧹 Cleaning up case duplicates and fixing naming...");
  
  try {
    // Get all cases
    const cases = await prisma.case.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Starting with ${cases.length} cases`);
    
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
    
    console.log(`🔄 Found ${duplicates.length} duplicate groups`);
    
    let removedCount = 0;
    let updatedCount = 0;
    
    // Process each duplicate group
    for (const [normalizedName, group] of duplicates) {
      console.log(`\n📦 Processing: "${normalizedName}"`);
      
      // Keep the one with proper case (if any), otherwise keep the first one
      const properCase = group.find(c => c.name !== c.name.toLowerCase());
      const keepCase = properCase || group[0];
      const removeCases = group.filter(c => c.id !== keepCase.id);
      
      console.log(`  ✅ Keeping: ID ${keepCase.id} - "${keepCase.name}"`);
      
      // Update the kept case to proper case if needed
      const properName = formatCaseName(keepCase.name);
      if (properName !== keepCase.name) {
        await prisma.case.update({
          where: { id: keepCase.id },
          data: { name: properName }
        });
        console.log(`  📝 Updated name: "${keepCase.name}" → "${properName}"`);
        updatedCount++;
      }
      
      // Remove duplicates
      for (const removeCase of removeCases) {
        console.log(`  🗑️  Removing: ID ${removeCase.id} - "${removeCase.name}"`);
        await prisma.case.delete({
          where: { id: removeCase.id }
        });
        removedCount++;
      }
    }
    
    // Fix remaining lowercase cases
    console.log("\n📝 Fixing remaining lowercase cases...");
    const remainingCases = await prisma.case.findMany();
    
    for (const caseItem of remainingCases) {
      const properName = formatCaseName(caseItem.name);
      if (properName !== caseItem.name) {
        await prisma.case.update({
          where: { id: caseItem.id },
          data: { name: properName }
        });
        console.log(`  📝 "${caseItem.name}" → "${properName}"`);
        updatedCount++;
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Removed: ${removedCount} duplicate cases`);
    console.log(`📝 Updated: ${updatedCount} case names`);
    console.log(`📊 Final count: ${remainingCases.length - removedCount} unique cases`);
    
  } catch (error) {
    console.error("❌ Error cleaning up cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function formatCaseName(name) {
  // Convert to proper case
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle special cases
      if (word === 'cs:go' || word === 'cs2') return word.toUpperCase();
      if (word === 'esports' || word === 'esport') return 'eSports';
      if (word === 'weapon') return 'Weapon';
      if (word === 'case') return 'Case';
      if (word === 'operation') return 'Operation';
      if (word === 'winter' || word === 'summer') return word.charAt(0).toUpperCase() + word.slice(1);
      if (word === 'offensive') return 'Offensive';
      if (word === 'bravo' || word === 'phoenix' || word === 'hydra' || word === 'riptide' || word === 'wildfire' || word === 'breakout' || word === 'vanguard') {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (word === 'chroma' || word === 'gamma' || word === 'spectrum' || word === 'prisma' || word === 'revolver' || word === 'falchion' || word === 'shadow' || word === 'snakebite' || word === 'fracture' || word === 'danger' || word === 'horizon' || word === 'recoil' || word === 'revolution' || word === 'clutch' || word === 'gallery' || word === 'fever') {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (word === 'zone') return 'Zone';
      if (word === 'dreams' || word === 'nightmares') return word.charAt(0).toUpperCase() + word.slice(1);
      if (word === 'shattered' || word === 'web') return word.charAt(0).toUpperCase() + word.slice(1);
      if (word === 'huntsman') return 'Huntsman';
      if (word === 'glove') return 'Glove';
      if (word === 'broken' || word === 'fang') return word.charAt(0).toUpperCase() + word.slice(1);
      if (word === 'kilowatt') return 'Kilowatt';
      if (word === 'winter' || word === 'summer') return word.charAt(0).toUpperCase() + word.slice(1);
      if (word === 'offensive') return 'Offensive';
      if (word === 'weapon') return 'Weapon';
      if (word === 'case') return 'Case';
      
      // Default: capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

cleanupCaseDuplicates();
