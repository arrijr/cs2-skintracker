// [Backend] Script zum täglichen Speichern der Price History
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function savePriceHistory() {
  console.log("[SavePriceHistory] Starting daily price history save...");
  const startTime = Date.now();
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Midnight
    
    // Hole alle Skins mit aktuellen Preisen
    const skins = await prisma.skin.findMany({
      where: {
        priceLatest: { not: null },
        priceUpdatedAt: {
          // Nur Skins, die heute aktualisiert wurden
          gte: today,
        },
      },
      select: {
        id: true,
        name: true,
        priceLatest: true,
        priceMedian: true,
        priceAvg: true,
        priceMin: true,
        priceMax: true,
        offerVolume: true,
        sold24h: true,
        sold7d: true,
      },
    });

    if (skins.length === 0) {
      console.log("[SavePriceHistory] No skins found with updated prices today.");
      return;
    }

    console.log(`[SavePriceHistory] Found ${skins.length} skins with updated prices.`);
    
    let savedCount = 0;
    let errorCount = 0;
    const batchSize = 100;
    
    // Verarbeite Skins in Batches
    for (let i = 0; i < skins.length; i += batchSize) {
      const batch = skins.slice(i, i + batchSize);
      
      try {
        // Erstelle PriceHistory-Einträge für jeden Skin im Batch
        const historyData = batch.map((skin) => ({
          skinId: skin.id,
          date: today,
          price: skin.priceLatest || skin.priceMedian || skin.priceAvg || 0,
          // Zusätzliche Felder für detaillierte History
          priceMedian: skin.priceMedian,
          priceAvg: skin.priceAvg,
          priceMin: skin.priceMin,
          priceMax: skin.priceMax,
          offerVolume: skin.offerVolume,
          sold24h: skin.sold24h,
          sold7d: skin.sold7d,
        }));

        // Speichere Batch
        await prisma.priceHistory.createMany({
          data: historyData,
          skipDuplicates: true, // Verhindere Duplikate
        });

        savedCount += batch.length;
        
        if (i % (batchSize * 5) === 0 && i > 0) {
          console.log(`[SavePriceHistory] Progress: ${i}/${skins.length} skins processed...`);
        }
      } catch (error) {
        errorCount += batch.length;
        console.error(`[SavePriceHistory] Error saving batch ${i / batchSize + 1}:`, error);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log("[SavePriceHistory] ====== SUMMARY ======");
    console.log(`[SavePriceHistory] Total Skins: ${skins.length}`);
    console.log(`[SavePriceHistory] Saved: ${savedCount}`);
    console.log(`[SavePriceHistory] Errors: ${errorCount}`);
    console.log(`[SavePriceHistory] Duration: ${duration}s`);
    console.log("[SavePriceHistory] =====================");
    
  } catch (error) {
    console.error("[SavePriceHistory] Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script ausführen
savePriceHistory()
  .then(() => {
    console.log("[SavePriceHistory] Completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[SavePriceHistory] Failed:", error);
    process.exit(1);
  });

