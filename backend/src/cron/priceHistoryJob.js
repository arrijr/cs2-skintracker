const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const { sendPriceAlertMail } = require('../services/emailService');


async function fetchSteamPrice(marketHashName) {
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&market_hash_name=${encodeURIComponent(marketHashName)}&currency=3`;
  try {
    console.log("Steam API Call:", url);
    const res = await axios.get(url);
    console.log("Steam Antwort:", res.data);

    let price = null;
    if (res.data && res.data.lowest_price) {
      price = parseFloat(
        res.data.lowest_price.replace('€', '').replace(',', '.').trim()
      );
    } else if (res.data && res.data.median_price) {
      price = parseFloat(
        res.data.median_price.replace('€', '').replace(',', '.').trim()
      );
      console.log("Kein lowest_price – nehme median_price:", price);
    }

    return price;
  } catch (e) {
    console.error(`Preisabfrage fehlgeschlagen für ${marketHashName}:`, e.message);
  }
  return null;
}



async function saveAllSkinPrices() {
  // Alle Skins aus Portfolio & Watchlist, distinct
  const skins = await prisma.skin.findMany({
    where: {
      OR: [
        { watchlist: { some: {} } },
        { portfolio: { some: {} } }
      ]
    }
  });

  for (const skin of skins) {
    const price = await fetchSteamPrice(skin.marketHashName);
    if (price) {
      await prisma.priceHistory.create({
        data: {
          skinId: skin.id,
          date: new Date(),
          price
        }
      });
      console.log(`[${skin.marketHashName}] Preis gespeichert: ${price}`);

      // --- Preisalarme prüfen (NEU!) ---
      const alerts = await prisma.watchlist.findMany({
        where: {
          skinId: skin.id,
          priceAlert: { not: null }
        },
        include: { user: true }
      });

      for (const alert of alerts) {
        if (price <= alert.priceAlert) {
          // Mail senden!
          if (process.env.ENABLE_EMAILS === "true") {
            await sendPriceAlertMail(alert.user.email, skin.marketHashName, price, alert.priceAlert);

            // Preis-Alarm zurücksetzen (damit User nicht täglich erneut die Mail bekommt)
            await prisma.watchlist.update({
              where: { id: alert.id },
              data: { priceAlert: null }
            });

            console.log(`🔔 Preisalarm ausgelöst für ${skin.marketHashName} bei User ${alert.user.email}`);
          }
        }
      }
      // --- Ende Preisalarme ---

    } else {
      console.log(`[${skin.marketHashName}] Preis konnte nicht abgerufen werden.`);
    }
  }
}

// Jeden Tag um 2:00 Uhr morgens
cron.schedule('0 2 * * *', saveAllSkinPrices);

// Optional: Beim Starten gleich einmal laufen lassen (nur für Entwicklung!)
saveAllSkinPrices();

module.exports = { saveAllSkinPrices };
