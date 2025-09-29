// /backend/scripts/checkRenderDatabase.js (Backend)
// {/* Check the actual Render database that the backend uses */}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Use the same DATABASE_URL that the backend uses
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkRenderDatabase() {
  try {
    console.log("🔍 Checking Render database connection...");
    console.log("📊 DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    
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

checkRenderDatabase();
