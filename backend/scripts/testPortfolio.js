// /backend/scripts/testPortfolio.js (Backend)
// {/* Test script to add portfolio entries for debugging */}

import "dotenv/config";
import prisma from "../prisma/prismaClient.js";

async function testPortfolio() {
  try {
    console.log("🔍 Checking portfolio data...");
    
    // Check if there are any users
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, email: true, clerkId: true }
    });
    
    console.log(`📊 Found ${users.length} users:`, users);
    
    if (users.length === 0) {
      console.log("❌ No users found! Cannot test portfolio without users.");
      return;
    }
    
    const userId = users[0].id;
    console.log(`👤 Using user ID: ${userId}`);
    
    // Check if there are any skins
    const skins = await prisma.skin.findMany({
      take: 5,
      select: { id: true, name: true, marketHashName: true }
    });
    
    console.log(`🎮 Found ${skins.length} skins:`, skins);
    
    if (skins.length === 0) {
      console.log("❌ No skins found! Cannot test portfolio without skins.");
      return;
    }
    
    // Check existing portfolio entries
    const existingPortfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true }
    });
    
    console.log(`📈 Found ${existingPortfolio.length} existing portfolio entries:`, existingPortfolio);
    
    if (existingPortfolio.length === 0) {
      console.log("➕ Adding test portfolio entries...");
      
      // Add test portfolio entries
      const testEntries = [
        {
          userId,
          skinId: skins[0].id,
          amount: 2,
          buyPrice: 15.50,
          buyDate: new Date('2024-01-15')
        },
        {
          userId,
          skinId: skins[1]?.id || skins[0].id,
          amount: 1,
          buyPrice: 25.00,
          buyDate: new Date('2024-02-01')
        }
      ];
      
      for (const entry of testEntries) {
        if (entry.skinId) {
          await prisma.portfolio.create({ data: entry });
          console.log(`✅ Added portfolio entry for skin ${entry.skinId}`);
        }
      }
      
      console.log("🎉 Test portfolio entries added!");
    } else {
      console.log("✅ Portfolio entries already exist");
    }
    
    // Final check
    const finalPortfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true }
    });
    
    console.log(`📊 Final portfolio count: ${finalPortfolio.length}`);
    console.log("📋 Portfolio entries:", finalPortfolio);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPortfolio();
