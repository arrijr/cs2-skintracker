import prisma from "../../prisma/prismaClient.js";
import { sendPriceAlertEmail } from "../services/emailService.js";
import { fetchSkinPrice } from "../services/steamService.js";

async function checkPriceAlerts() {
  const alerts = await prisma.watchlist.findMany({
    where: { 
      priceAlert: { not: null },
      user: { emailAlerts: { equals: true } } // Fixed: Proper Prisma syntax for boolean field
    },
    include: { user: true, skin: true },
  });

  for (const entry of alerts) {
    const priceData = await fetchSkinPrice(entry.skin.marketHashName);
    if (!priceData || !priceData.lowest_price) continue;

    const currentPrice = parseFloat(priceData.lowest_price.replace(/[€$]/g, ''));
    if (currentPrice <= entry.priceAlert) {
      await sendPriceAlertEmail(entry.user.email, entry.skin.name, currentPrice, entry.priceAlert);
      await prisma.watchlist.update({ where: { id: entry.id }, data: { priceAlert: null } });
      console.log(`Alert sent for ${entry.skin.name} to ${entry.user.email}`);
    }
  }
}

export default checkPriceAlerts;