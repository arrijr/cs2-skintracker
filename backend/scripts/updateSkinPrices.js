import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const API_KEY = process.env.STEAM_API_KEY;

// Dynamischer Import von node-fetch (ESM-freundlich)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ---------------- Helpers ----------------
function parsePrice(val) {
  if (val == null) return null;
  // Strings wie "€12,34", "$1.23", "12.34" → Zahl
  const s = String(val).replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseIntSafe(val) {
  if (val == null) return null;
  const m = String(val).match(/\d+/g);
  return m ? parseInt(m.join(""), 10) : null;
}

// ---------------- API Calls ----------------
async function fetchFromExternal(marketHashName) {
  if (!API_KEY) return null;
  const url =
    `https://www.steamwebapi.com/steam/api/item` +
    `?key=${API_KEY}&game=cs2&market_hash_name=${encodeURIComponent(marketHashName)}`;

  try {
    const res = await fetch(url, { timeout: 15000 });
    if (!res.ok) {
      // z.B. 429/403/500 → null
      return null;
    }
    const data = await res.json();

    // Viele mögliche Felder, wir nehmen das „beste“ verfügbare:
    // bevorzugt: price → pricemedian → lowest_price → priceavg → pricemin
    const price =
      parsePrice(data.price) ??
      parsePrice(data.pricemedian) ??
      parsePrice(data.lowest_price) ??
      parsePrice(data.priceavg) ??
      parsePrice(data.pricemin);

    // Volumes können verschieden heißen
    const offerVolume =
      parseIntSafe(data.offervolume) ??
      parseIntSafe(data.volume) ??
      null;

    if (!price) return null;
    return { price, offerVolume };
  } catch {
    return null;
  }
}

async function fetchFromSteamOfficial(marketHashName) {
  // currency=3 -> EUR, appid=730 -> CS2
  const url =
    `https://steamcommunity.com/market/priceoverview/` +
    `?currency=3&appid=730&market_hash_name=${encodeURIComponent(marketHashName)}`;

  try {
    const res = await fetch(url, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const data = await res.json();

    if (!data || data.success === false) return null;

    const price =
      parsePrice(data.lowest_price) ??
      parsePrice(data.median_price);

    const offerVolume = parseIntSafe(data.volume);
    if (!price) return null;
    return { price, offerVolume };
  } catch {
    return null;
  }
}

// ---------------- Main Update ----------------
async function updateAllSkinPrices() {
  // Optional: testweise limitieren
  // const skins = await prisma.skin.findMany({ select: { id: true, marketHashName: true }, take: 200 });
  const skins = await prisma.skin.findMany({ select: { id: true, marketHashName: true } });

  let ok = 0, miss = 0, i = 0;

  for (const skin of skins) {
    i++;

    // 1) Externe API
    let result = await fetchFromExternal(skin.marketHashName);

    // 2) Fallback Steam priceoverview
    if (!result) {
      result = await fetchFromSteamOfficial(skin.marketHashName);
    }

    if (result && result.price) {
      try {
        // PriceHistory schreiben
        await prisma.priceHistory.create({
          data: {
            skinId: skin.id,
            date: new Date(),
            price: result.price,
          },
        });

        // Skin-Addons aktualisieren (z. B. offerVolume)
        await prisma.skin.update({
          where: { id: skin.id },
          data: { offerVolume: result.offerVolume },
        });

        ok++;
        if (ok % 50 === 0) {
          console.log(`✅ ${ok} Preise aktualisiert (von ${i})`);
        }
      } catch (e) {
        // DB-Fehler loggen, aber nicht abbrechen
        console.error(`❌ DB-Fehler bei "${skin.marketHashName}":`, e.message);
      }
    } else {
      miss++;
      console.log(`[${skin.marketHashName}] ❌ Kein Preis gefunden!`);
    }

    // Rate Limit schonen (optional)
    // await new Promise(r => setTimeout(r, 60));
  }

  console.log(`\n✅ Fertig. ${ok} erfolgreich, ${miss} ohne Preis.`);
}

updateAllSkinPrices()
  .catch((err) => {
    console.error("❌ Fehler beim Update:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });