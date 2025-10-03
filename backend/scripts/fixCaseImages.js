// /backend/scripts/fixCaseImages.js — [Backend]
// {/* Fix case images with correct Steam CDN URLs */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixCaseImages() {
  console.log("🖼️ Fixing case images with correct Steam CDN URLs...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      // Use the correct Steam CDN URL format
      const imageUrl = `https://community.akamai.steamstatic.com/economy/image/${encodeURIComponent(caseItem.name)}/`;
      
      await prisma.case.update({
        where: { id: caseItem.id },
        data: { imageUrl: imageUrl }
      });
      
      console.log(`✅ Updated image for: ${caseItem.name}`);
    }
    
    console.log("🎉 All case images updated!");
    
  } catch (error) {
    console.error("❌ Error fixing case images:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCaseImages();
