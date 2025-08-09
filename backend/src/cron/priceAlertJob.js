import prisma from "../../prisma/prismaClient.js";
import { sendPriceAlertEmail } from "../services/emailService.js";
import { fetchSteamPrice } from "../services/steamService.js";

async function checkPriceAlerts() {
  // Load all watchlist entries with an active price alert
  const alerts = await prisma.watchlist.findMany({
    where: {
      priceAlert: { not: null },
    },
    include: { user: true, skin: true },
  });

  for (const entry of alerts) {
    const currentPrice = await fetchSteamPrice(entry.skin.market_hash_name);
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
