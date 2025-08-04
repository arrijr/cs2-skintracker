// /backend/src/cron/priceAlertJob.js

const prisma = require('../../prisma/client');
const { sendPriceAlertEmail } = require('../services/emailService');
const { fetchSteamPrice } = require('../services/steamService');

async function checkPriceAlerts() {
  // Alle Watchlist-Einträge mit aktivem Preisalarm laden
  const alerts = await prisma.watchlist.findMany({
    where: {
      priceAlert: { not: null },
    },
    include: { user: true, skin: true },
  });

  for (const entry of alerts) {
    const currentPrice = await fetchSteamPrice(entry.skin.market_hash_name);
    // Wenn kein Preis abrufbar, weiter
    if (!currentPrice) continue;

    // Alarm auslösen, wenn der aktuelle Preis <= Zielpreis ist
    if (currentPrice <= entry.priceAlert) {
      // E-Mail an User senden
      await sendPriceAlertEmail(entry.user.email, entry.skin.name, currentPrice, entry.priceAlert);

      // Preisalarm deaktivieren (optional)
      await prisma.watchlist.update({
        where: { id: entry.id },
        data: { priceAlert: null },
      });

      console.log(`Alert sent for ${entry.skin.name} to ${entry.user.email}`);
    }
  }
}

module.exports = checkPriceAlerts;
