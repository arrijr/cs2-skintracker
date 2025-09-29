// /backend/scripts/force-render-restart.js
// Script to force Render to restart with latest code
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function forceRestart() {
  console.log("🔄 [FORCE RESTART] Triggering Render restart...");
  
  // Create a dummy database operation to force restart
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ [FORCE RESTART] Database connection successful");
    console.log("🚀 [FORCE RESTART] This should trigger Render to restart with latest code");
  } catch (error) {
    console.error("❌ [FORCE RESTART] Database error:", error);
  }
  
  await prisma.$disconnect();
  process.exit(0);
}

forceRestart();
