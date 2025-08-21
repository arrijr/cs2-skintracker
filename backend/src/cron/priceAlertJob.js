import prisma from "../../prisma/prismaClient.js";
import { sendPriceAlertEmail } from "../services/emailService.js";
import { fetchSkinPrice } from "../services/steamService.js";

async function checkPriceAlerts() {
  // Load all watchlist entries with an active price alert
  const alerts = await prisma.watchlist.findMany({
    where: {
      priceAlert: { not: null },
    },
    include: { user: true, skin: true },
  });

  for (const entry of alerts) {
    const currentPriceData = await fetchSkinPrice(entry.skin.market_hash_name);
    // The service returns an object like { lowest_price: '...' }, not just a number.
    // We need to parse it, just like in portfolioController.
    let currentPrice = null;
    if (currentPriceData && currentPriceData.lowest_price) {
      currentPrice = parseFloat(currentPriceData.lowest_price.replace('€', '').replace(',', '.').trim());
    } else if (currentPriceData && currentPriceData.median_price) {
      currentPrice = parseFloat(currentPriceData.median_price.replace('€', '').replace(',', '.').trim());
    }

    // If no price is available, continue
    if (!currentPrice) continue;

    // Trigger alert if current price <= target price
    if (currentPrice <= entry.priceAlert) {
      // Send email to user
      await sendPriceAlertEmail(
        entry.user.email,
        entry.skin.name,
        currentPrice,
        entry.priceAlert
      );

      // Optionally, deactivate price alert
      await prisma.watchlist.update({
        where: { id: entry.id },
        data: { priceAlert: null },
      });

      console.log(`Alert sent for ${entry.skin.name} to ${entry.user.email}`);
    }
  }
}
await prisma.$disconnect();

export default checkPriceAlerts;
