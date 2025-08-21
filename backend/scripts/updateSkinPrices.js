// backend/scripts/updateSkinPrices.js
// --------------------------------------------------
// Update Skin Prices (Cron-compatible, robust):
// - Holt Preise primär von steamwebapi.com (mit Key)
// - Fällt auf offizielle Steam "priceoverview" zurück
// - Schreibt PriceHistory + aktualisiert offerVolume
// - Batch-Verarbeitung, Retry, optional Delay & Filter

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// {/* Config (via ENV überschreibbar) */}
const API_KEY = process.env.STEAM_API_KEY;

const BATCH_SIZE = Number(process.env.PRICE_UPDATE_BATCH_SIZE || 1000);       // Batch-Größe
const ONLY_ACTIVE_ITEMS =
  (process.env.PRICE_UPDATE_ONLY_ACTIVE ?? "true").toLowerCase() !== "false"; // nur offerVolume > 0
const RETRIES = Number(process.env.PRICE_UPDATE_RETRIES || 2);                // API-Retries
const RETRY_DELAY_MS = Number(process.env.PRICE_UPDATE_RETRY_DELAY_MS || 200);
const GLOBAL_DELAY_MS = Number(process.env.PRICE_UPDATE_GLOBAL_DELAY_MS || 40); // 0 = aus
const TEST_TAKE = process.env.PRICE_UPDATE_TAKE ? Number(process.env.PRICE_UPDATE_TAKE) : undefined; // nur X Skins total
const TEST_SKIP = process.env.PRICE_UPDATE_SKIP ? Number(process.env.PRICE_UPDATE_SKIP) : 0;

// {/* ESM-freundlicher fetch */}
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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

async function withRetry(fn, retries = 2, pauseMs = 200) {
  for (let i = 0; i <= retries; i++) {
    const out = await fn();
    if (out) return out;
    if (i < retries) await wait(pauseMs);
  }
  return null;
}

// ---------------- API Calls ----------------
async function fetchFromExternal(marketHashName) {
  if (!API_KEY) return null;
  const url =
    `https://www.steamwebapi.com/steam/api/item` +
    `?key=${API_KEY}&game=cs2&market_hash_name=${encodeURIComponent(marketHashName)}`;

  try {
    const res = await fetch(url, { timeout: 15000 });
    if (!res.ok) return null;
    const data = await res.json();

    // Mögliche Felder berücksichtigen
    const price =
      parsePrice(data.price) ??
      parsePrice(data.pricemedian) ??
      parsePrice(data.lowest_price) ??
      parsePrice(data.priceavg) ??
      parsePrice(data.pricemin) ??
      parsePrice(data.median_price);

    const offerVolume =
      parseIntSafe(data.offervolume) ??
      parseIntSafe(data.volume) ??
      null;

    if (!price) return null;
    return { price, offerVolume, source: "external" };
  } catch {
    return null;
  }
}

async function fetchFromSteamOfficial(marketHashName) {
  // currency=3 → EUR, appid=730 → CS2
  const url =
    `https://steamcommunity.com/market/priceoverview/` +
    `?currency=3&appid=730&market_hash_name=${encodeURIComponent(marketHashName)}`;

  try {
    const res = await fetch(url, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" }, // hilft gegen sporadische Blockaden
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.success === false) return null;

    const price =
      parsePrice(data.lowest_price) ??
      parsePrice(data.median_price);

    const offerVolume = parseIntSafe(data.volume);
    if (!price) return null;
    return { price, offerVolume, source: "steam" };
  } catch {
    return null;
  }
}

// ---------------- Batch Update ----------------
async function updateBatch(skip, take, filterActive) {
  const where = filterActive ? { offerVolume: { gt: 0 } } : {};
  const select = { id: true, marketHashName: true, offerVolume: true };

  let skins = await prisma.skin.findMany({ select, where, skip, take });

  // Falls durch den Filter nichts kommt: einmal ohne Filter versuchen
  if (skins.length === 0 && filterActive) {
    skins = await prisma.skin.findMany({ select, skip, take });
  }

  let ok = 0,
    miss = 0,
    i = 0;

  for (const skin of skins) {
    i++;

    let result = await withRetry(
      () => fetchFromExternal(skin.marketHashName),
      RETRIES,
      RETRY_DELAY_MS
    );

    if (!result) {
      result = await withRetry(
        () => fetchFromSteamOfficial(skin.marketHashName),
        RETRIES,
        RETRY_DELAY_MS
      );
    }

    if (result && result.price) {
      try {
        await prisma.priceHistory.create({
          data: {
            skinId: skin.id,
            date: new Date(),
            price: result.price,
          },
        });

        await prisma.skin.update({
          where: { id: skin.id },
          data: { offerVolume: result.offerVolume },
        });

        ok++;
        if (ok % 50 === 0) {
          console.log(`✅ ${ok} Preise aktualisiert (batch offset ${skip})`);
        }
        console.log(
          `✓ [${result.source}] ${skin.marketHashName} → ${result.price} | offers: ${
            result.offerVolume ?? "n/a"
          }`
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

  return { count: skins.length, ok, miss };
}

// ---------------- Main ----------------
async function main() {
  // Kleiner Check: auf welchen Port connecten wir? (5432 = direct, 6543 = pooled)
  try {
    const u = new URL(process.env.DATABASE_URL || "");
    console.log(`DB: ${u.hostname}:${u.port}`);
  } catch {}

  let skip = TEST_SKIP || 0;
  let remaining = TEST_TAKE ?? Infinity;

  let totalProcessed = 0,
    totalOk = 0,
    totalMiss = 0;

  while (true) {
    const take = Number.isFinite(remaining) ? Math.min(BATCH_SIZE, remaining) : BATCH_SIZE;
    const out = await updateBatch(skip, take, ONLY_ACTIVE_ITEMS);

    if (out.count === 0) break;

    skip += out.count;
    totalProcessed += out.count;
    totalOk += out.ok;
    totalMiss += out.miss;

    if (Number.isFinite(remaining)) {
      remaining -= out.count;
      if (remaining <= 0) break;
    }

    console.log(
      `Batch fertig: processed=${totalProcessed}, ok=${totalOk}, miss=${totalMiss}`
    );
  }

  console.log(`\n✅ Fertig. Gesamt: processed=${totalProcessed}, ok=${totalOk}, miss=${totalMiss}`);
}

main()
  .catch((err) => {
    console.error("❌ Fehler beim Update:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
