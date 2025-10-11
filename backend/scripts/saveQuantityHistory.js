// [Backend] Script zum täglichen Speichern der Quantity History (Offer Volume)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function saveQuantityHistory() {
  console.log("[SaveQuantityHistory] Starting daily quantity history save...");
  const startTime = Date.now();
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Midnight
    
    // Hole alle Skins mit Offer Volume
    const skins = await prisma.skin.findMany({
      where: {
        offerVolume: { not: null },
        priceUpdatedAt: {
          // Nur Skins, die heute aktualisiert wurden
          gte: today,
        },
      },
      select: {
        id: true,
        name: true,
        offerVolume: true,
        sold24h: true,
      },
    });

    if (skins.length === 0) {
      console.log("[SaveQuantityHistory] No skins found with offer volume data today.");
      return;
    }

    console.log(`[SaveQuantityHistory] Found ${skins.length} skins with offer volume data.`);
    
    let savedCount = 0;
    let errorCount = 0;
    const batchSize = 100;
    
    // Verarbeite Skins in Batches
    for (let i = 0; i < skins.length; i += batchSize) {
      const batch = skins.slice(i, i + batchSize);
      
      try {
        // Erstelle SkinQuantityHistory-Einträge für jeden Skin im Batch
        const historyData = batch
          .filter((skin) => skin.offerVolume && skin.offerVolume > 0) // Nur Skins mit Offer Volume
          .map((skin) => ({
            skinId: skin.id,
            date: today,
            quantity: skin.offerVolume || 0,
            activeListings: skin.offerVolume || 0,
            soldVolume24h: skin.sold24h || 0,
          }));

        if (historyData.length === 0) {
          console.log(`[SaveQuantityHistory] Batch ${i / batchSize + 1}: No valid data to save.`);
          continue;
        }

        // Speichere Batch
        await prisma.skinQuantityHistory.createMany({
          data: historyData,
          skipDuplicates: true, // Verhindere Duplikate
        });

        savedCount += historyData.length;
        
        if (i % (batchSize * 5) === 0 && i > 0) {
          console.log(`[SaveQuantityHistory] Progress: ${i}/${skins.length} skins processed...`);
        }
      } catch (error) {
        errorCount += batch.length;
        console.error(`[SaveQuantityHistory] Error saving batch ${i / batchSize + 1}:`, error);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("[SaveQuantityHistory] ====== SUMMARY ======");
    console.log(`[SaveQuantityHistory] Total Skins: ${skins.length}`);
    console.log(`[SaveQuantityHistory] Saved: ${savedCount}`);
    console.log(`[SaveQuantityHistory] Errors: ${errorCount}`);
    console.log(`[SaveQuantityHistory] Duration: ${duration}s`);
    console.log("[SaveQuantityHistory] =====================");
    
  } catch (error) {
    console.error("[SaveQuantityHistory] Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script ausführen
saveQuantityHistory()
  .then(() => {
    console.log("[SaveQuantityHistory] Completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[SaveQuantityHistory] Failed:", error);
    process.exit(1);
  });

