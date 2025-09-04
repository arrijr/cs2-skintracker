import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserData() {
  try {
    console.log("🔍 Checking user data...");
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: "test@test.de" },
      include: {
        portfolio: {
          include: { skin: true }
        },
        watchlist: {
          include: { skin: true }
        }
      }
    });

    if (!user) {
      console.log("❌ User test@test.de not found");
      return;
    }

    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    console.log(`📊 Role: ${user.role}`);
    console.log(`📦 Portfolio entries: ${user.portfolio.length}`);
    console.log(`👀 Watchlist entries: ${user.watchlist.length}`);

    if (user.portfolio.length > 0) {
      console.log("\n📦 Portfolio entries:");
      user.portfolio.forEach((entry, i) => {
        console.log(`  ${i + 1}. ${entry.skin.name} - Amount: ${entry.amount}, Price: $${entry.buyPrice}`);
      });
    }

    if (user.watchlist.length > 0) {
      console.log("\n👀 Watchlist entries:");
      user.watchlist.forEach((entry, i) => {
        console.log(`  ${i + 1}. ${entry.skin.name} - Alert: $${entry.priceAlert || 'None'}`);
      });
    }

    // Check if there are any skins in the database
    const skinCount = await prisma.skin.count();
    console.log(`\n🎨 Total skins in database: ${skinCount}`);

    if (skinCount > 0) {
      const sampleSkins = await prisma.skin.findMany({ take: 3 });
      console.log("Sample skins:");
      sampleSkins.forEach(skin => {
        console.log(`  - ${skin.name} (${skin.marketHashName})`);
      });
    }

  } catch (error) {
    console.error("❌ Error checking user data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
