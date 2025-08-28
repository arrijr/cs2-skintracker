import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminStatus() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "test@test.de" },
      select: { id: true, email: true, role: true, isPremium: true }
    });

    if (user) {
      console.log("✅ User gefunden:");
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Premium: ${user.isPremium}`);
      
      if (user.role === 'admin') {
        console.log("🎉 User ist Admin!");
      } else {
        console.log("❌ User ist KEIN Admin!");
        console.log("   Aktualisiere auf Admin...");
        
        await prisma.user.update({
          where: { email: "test@test.de" },
          data: { role: 'admin' }
        });
        
        console.log("✅ User erfolgreich auf Admin aktualisiert!");
      }
    } else {
      console.log("❌ User test@test.de nicht gefunden!");
    }

    // Alle Admin-User anzeigen
    console.log("\n📊 Alle Admin-User:");
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true, role: true }
    });
    
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (ID: ${admin.id})`);
    });

  } catch (error) {
    console.error("❌ Fehler:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminStatus();
