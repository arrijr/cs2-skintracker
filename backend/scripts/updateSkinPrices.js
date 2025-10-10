// backend/scripts/updateSkinPrices.js
// --------------------------------------------------
// Update Skin Prices (Cron-compatible, robust):
// - Holt Preise primär von steamwebapi.com (mit Key)
// - Fällt auf offizielle Steam "priceoverview" zurück
// - Schreibt PriceHistory + aktualisiert alle Skin-Felder
// - Batch-Verarbeitung, Retry, optional Delay & Filter

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fetchSkinPrice } from "../src/services/steamService.js";

const prisma = new PrismaClient();

// {/* Config (via ENV überschreibbar) */}
const BATCH_SIZE = Number(process.env.PRICE_UPDATE_BATCH_SIZE || 1000);       // Batch-Größe
const ONLY_ACTIVE_ITEMS =
  (process.env.PRICE_UPDATE_ONLY_ACTIVE ?? "true").toLowerCase() !== "false"; // nur offerVolume > 0
const RETRIES = Number(process.env.PRICE_UPDATE_RETRIES || 2);                // API-Retries
const RETRY_DELAY_MS = Number(process.env.PRICE_UPDATE_RETRY_DELAY_MS || 200);
const GLOBAL_DELAY_MS = Number(process.env.PRICE_UPDATE_GLOBAL_DELAY_MS || 40); // 0 = aus
const TEST_TAKE = process.env.PRICE_UPDATE_TAKE ? Number(process.env.PRICE_UPDATE_TAKE) : undefined; // nur X Skins total
const TEST_SKIP = process.env.PRICE_UPDATE_SKIP ? Number(process.env.PRICE_UPDATE_SKIP) : 0;

// ---------------- Helpers ----------------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function parsePrice(val) {
  if (val == null) return null;
  // "€12,34" | "$1.23" | "12.34" → Float
  const s = String(val).replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseIntSafe(val) {
  if (val == null) return null;
  const m = String(val).match(/\d+/g);
  return m ? parseInt(m.join(""), 10) : null;
}

function parseDate(val) {
  if (!val) return null;
  try {
    return new Date(val);
  } catch {
    return null;
  }
}

async function withRetry(fn, retries = 2, pauseMs = 200) {
  for (let i = 0; i <= retries; i++) {
    const out = await fn();
    if (out) return out;
    if (i < retries) await wait(pauseMs);
  }
  return null;
}

// ---------------- Enhanced API Call ----------------
async function fetchEnhancedSkinData(marketHashName) {
  try {
    const result = await fetchSkinPrice(marketHashName);
    
    if (!result) return null;
    
    console.log(`[DEBUG] Enhanced API result for ${marketHashName}:`, {
      source: result.source,
      hasPrices: !!(result.pricelatest || result.pricemedian),
      hasDetails: !!(result.wear || result.rarity),
      hasStats: !!(result.soldtoday || result.offervolume)
    });
    
    return result;
  } catch (error) {
    console.log(`[ERROR] Enhanced API failed for ${marketHashName}:`, error.message);
    return null;
  }
}

// ---------------- Batch Update ----------------
async function updateBatch(skip, take, filterActive) {
  const where = filterActive ? { offerVolume: { gt: 0 } } : {};
  const select = { 
    id: true, 
    marketHashName: true, 
    offerVolume: true,
    // Include existing fields for comparison
    priceMedian: true,
    priceAvg: true,
    priceMin: true,
    priceMax: true,
    wear: true,
    rarity: true,
    quality: true,
    isStattrak: true,
    isStar: true
  };

  let skins = await prisma.skin.findMany({ select, where, skip, take });

  // Falls durch den Filter nichts kommt: einmal ohne Filter versuchen
  if (skins.length === 0 && filterActive) {
    skins = await prisma.skin.findMany({ select, skip, take });
  }

  let ok = 0, miss = 0, updated = 0, i = 0;

  for (const skin of skins) {
    i++;

    const result = await withRetry(
      () => fetchEnhancedSkinData(skin.marketHashName),
      RETRIES,
      RETRY_DELAY_MS
    );

    if (result && (result.pricelatest || result.pricemedian || result.priceavg)) {
      try {
        // 1. Create PriceHistory entry
        const price = result.pricelatest || result.pricemedian || result.priceavg;
        if (price) {
          await prisma.priceHistory.create({
            data: {
              skinId: skin.id,
              date: new Date(),
              price: parsePrice(price),
            },
          });
        }

        // 2. Update Skin with comprehensive data
        const updateData = {
          // Current prices
          priceLatest: parsePrice(result.pricelatest),
          priceLatestSell: parsePrice(result.pricelatestsell),
          priceMedian: parsePrice(result.pricemedian),
          priceAvg: parsePrice(result.priceavg),
          priceSafe: parsePrice(result.pricesafe),
          priceMin: parsePrice(result.pricemin),
          priceMax: parsePrice(result.pricemax),
          
          // Historical prices
          priceMedian24h: parsePrice(result.pricemedian24h),
          priceMedian7d: parsePrice(result.pricemedian7d),
          priceMedian30d: parsePrice(result.pricemedian30d),
          priceMedian90d: parsePrice(result.pricemedian90d),
          priceAvg24h: parsePrice(result.priceavg24h),
          priceAvg7d: parsePrice(result.priceavg7d),
          priceAvg30d: parsePrice(result.priceavg30d),
          priceAvg90d: parsePrice(result.priceavg90d),
          
          // Sales statistics
          soldToday: parseIntSafe(result.soldtoday),
          sold24h: parseIntSafe(result.sold24h),
          sold7d: parseIntSafe(result.sold7d),
          sold30d: parseIntSafe(result.sold30d),
          sold90d: parseIntSafe(result.sold90d),
          soldTotal: parseIntSafe(result.soldtotal),
          hoursToSold: parseFloat(result.hourstosold),
          
          // Steam market data
          buyOrderPrice: parsePrice(result.buyorderprice),
          buyOrderMedian: parsePrice(result.buyordermedian),
          buyOrderAvg: parsePrice(result.buyorderavg),
          buyOrderVolume: parseIntSafe(result.buyordervolume),
          offerVolume: parseIntSafe(result.offervolume),
          
          // Item details (only update if we have new data)
          ...(result.wear && { wear: result.wear }),
          ...(result.itemgroup && { itemGroup: result.itemgroup }),
          ...(result.itemtype && { itemType: result.itemtype }),
          ...(result.itemname && { itemName: result.itemname }),
          ...(result.rarity && { rarity: result.rarity }),
          ...(result.quality && { quality: result.quality }),
          ...(result.isstattrack !== undefined && { isStattrak: result.isstattrack }),
          ...(result.isstar !== undefined && { isStar: result.isstar }),
          ...(result.itemimage && { imageUrl: result.itemimage }),
          
          // Market metadata
          priceUpdatedAt: parseDate(result.priceupdatedat),
          ...(result.unstable !== undefined && { unstable: result.unstable }),
          ...(result.unstablereason && { unstableReason: result.unstablereason }),
        };

        // Only update if we have meaningful changes
        const hasChanges = Object.values(updateData).some(val => val !== null && val !== undefined);
        
        if (hasChanges) {
          await prisma.skin.update({
            where: { id: skin.id },
            data: updateData,
          });
          updated++;
        }

        ok++;
        if (ok % 50 === 0) {
          console.log(`✅ ${ok} Preise aktualisiert (batch offset ${skip})`);
        }
        
        const priceDisplay = price ? parsePrice(price) : 'N/A';
        console.log(
          `✓ [${result.source}] ${skin.marketHashName} → ${priceDisplay} | offers: ${
            result.offervolume ?? "n/a"
          } | sold7d: ${result.sold7d ?? "n/a"} | buyOrders: ${
            result.buyordervolume ?? "n/a"
          } | wear: ${result.wear || 'n/a'} | rarity: ${result.rarity || 'n/a'}`
        );
        
      } catch (e) {
        console.error(`❌ DB-Fehler bei "${skin.marketHashName}":`, e.message);
      }
    } else {
      miss++;
      console.log(
        `[${skin.marketHashName}] ❌ Kein Preis gefunden! (source=${result?.source ?? "none"})`
      );
    }

    if (GLOBAL_DELAY_MS > 0) await wait(GLOBAL_DELAY_MS);
  }

  return { count: skins.length, ok, miss, updated };
}

// ---------------- Main ----------------
async function main() {
  // Kleiner Check: auf welchen Port connecten wir? (5432 = direct, 6543 = pooled)
  try {
    const u = new URL(process.env.DATABASE_URL || "");
    console.log(`DB: ${u.hostname}:${u.port}`);
  } catch {}

  console.log("🚀 Enhanced Skin Price Update Started");
  console.log("📊 Will update comprehensive skin data including:");
  console.log("   - Current & historical prices (24h, 7d, 30d, 90d)");
  console.log("   - Sales statistics & market data");
  console.log("   - Item details (wear, rarity, quality, StatTrak, Star)");
  console.log("   - Steam market data (buy orders, offer volume)");
  console.log("");

  let skip = TEST_SKIP || 0;
  let remaining = TEST_TAKE ?? Infinity;

  let totalProcessed = 0,
    totalOk = 0,
    totalMiss = 0,
    totalUpdated = 0;

  while (true) {
    const take = Number.isFinite(remaining) ? Math.min(BATCH_SIZE, remaining) : BATCH_SIZE;
    const out = await updateBatch(skip, take, ONLY_ACTIVE_ITEMS);

    if (out.count === 0) break;

    skip += out.count;
    totalProcessed += out.count;
    totalOk += out.ok;
    totalMiss += out.miss;
    totalUpdated += out.updated;

    if (Number.isFinite(remaining)) {
      remaining -= out.count;
      if (remaining <= 0) break;
    }

    console.log(
      `Batch fertig: processed=${totalProcessed}, ok=${totalOk}, miss=${totalMiss}, updated=${totalUpdated}`
    );
  }

  console.log(`\n✅ Fertig. Gesamt: processed=${totalProcessed}, ok=${totalOk}, miss=${totalMiss}, updated=${totalUpdated}`);
  console.log(`📈 Enhanced data updated for ${totalUpdated} skins`);
}

main()
  .catch((err) => {
    console.error("❌ Fehler beim Update:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
