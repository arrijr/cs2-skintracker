// /backend/scripts/checkDatabase.js (Backend)
// {/* Check database connection and data */}

import "dotenv/config";
import prisma from "../prisma/prismaClient.js";

async function checkDatabase() {
  try {
    console.log("🔍 Checking database connection...");
    
    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
    // Check skins count
    const skinsCount = await prisma.skin.count();
    console.log(`📊 Skins in database: ${skinsCount}`);
    
    // Check users count
    const usersCount = await prisma.user.count();
    console.log(`👥 Users in database: ${usersCount}`);
    
    // Check portfolio count
    const portfolioCount = await prisma.portfolio.count();
    console.log(`📈 Portfolio entries: ${portfolioCount}`);
    
    // Get sample skins
    const sampleSkins = await prisma.skin.findMany({
      take: 3,
      select: { id: true, name: true, marketHashName: true }
    });
    console.log("🎮 Sample skins:", sampleSkins);
    
    // Get sample users
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: { id: true, email: true, clerkId: true }
    });
    console.log("👤 Sample users:", sampleUsers);
    
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
