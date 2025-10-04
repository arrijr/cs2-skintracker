// /backend/scripts/resetCaseSkins.js — [Backend]
// {/* Reset all case-skin relationships to start fresh */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetCaseSkins() {
  console.log("🔄 Resetting all case-skin relationships...");
  
  try {
    // Delete all existing case-skin relationships
    const deletedCount = await prisma.caseSkin.deleteMany({});
    console.log(`✅ Deleted ${deletedCount} case-skin relationships`);
    
    // Get all cases and skins to verify
    const cases = await prisma.case.findMany();
    const skins = await prisma.skin.findMany();
    
    console.log(`📦 Found ${cases.length} cases`);
    console.log(`🎨 Found ${skins.length} skins`);
    
    // Show some sample data
    console.log("\n📋 Sample cases:");
    cases.slice(0, 5).forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
    });
    
    console.log("\n📋 Sample skins:");
    skins.slice(0, 5).forEach(s => {
      console.log(`  - ${s.name} (ID: ${s.id}, Rarity: ${s.rarity})`);
    });
    
  } catch (error) {
    console.error("❌ Error resetting case-skin relationships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCaseSkins();
