// /backend/scripts/cleanupCaseDuplicatesSafe.js — [Backend]
// {/* Clean up case duplicates safely by merging data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupCaseDuplicatesSafe() {
  console.log("🧹 Cleaning up case duplicates safely...");
  
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
    
    let mergedCount = 0;
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
      
      // Merge data from duplicates into the kept case
      for (const removeCase of removeCases) {
        console.log(`  🔄 Merging data from: ID ${removeCase.id} - "${removeCase.name}"`);
        
        // Update the kept case with better data from the duplicate
        const mergedData = {
          // Use the higher price
          price: Math.max(keepCase.price || 0, removeCase.price || 0),
          // Use the higher market cap
          marketCap: Math.max(keepCase.marketCap || 0, removeCase.marketCap || 0),
          // Use the higher remaining count
          remaining: Math.max(keepCase.remaining || 0, removeCase.remaining || 0),
          // Sum up dropped and unboxed
          dropped: (keepCase.dropped || 0) + (removeCase.dropped || 0),
          unboxed: (keepCase.unboxed || 0) + (removeCase.unboxed || 0),
          // Use the more recent update time
          lastUpdated: new Date(Math.max(
            new Date(keepCase.lastUpdated || 0).getTime(),
            new Date(removeCase.lastUpdated || 0).getTime()
          )),
          // Use the better image URL (prefer non-placeholder)
          imageUrl: removeCase.imageUrl?.includes('placeholder') ? keepCase.imageUrl : removeCase.imageUrl || keepCase.imageUrl
        };
        
        await prisma.case.update({
          where: { id: keepCase.id },
          data: mergedData
        });
        
        // Now safely delete the duplicate (after merging data)
        await prisma.case.delete({
          where: { id: removeCase.id }
        });
        
        console.log(`  🗑️  Removed duplicate: ID ${removeCase.id}`);
        mergedCount++;
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
    console.log(`✅ Merged and removed: ${mergedCount} duplicate cases`);
    console.log(`📝 Updated: ${updatedCount} case names`);
    console.log(`📊 Final count: ${remainingCases.length - mergedCount} unique cases`);
    
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

cleanupCaseDuplicatesSafe();
