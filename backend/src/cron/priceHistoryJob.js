import cron from "node-cron";
import prisma from "../prisma/prismaClient.js";
import { fetchSkinPrice } from "../services/steamService.js";
import { sendPriceAlertEmail } from "../services/emailService.js";

async function getSteamPrice(marketHashName) {
  const priceData = await fetchSkinPrice(marketHashName);
  if (!priceData) return null;

  let price = null;
  if (priceData.lowest_price) {
    price = parseFloat(
      priceData.lowest_price.replace('€', '').replace(',', '.').trim()
    );
  } else if (priceData.median_price) {
    price = parseFloat(
      priceData.median_price.replace('€', '').replace(',', '.').trim()
    );
    console.log("No lowest_price – using median_price:", price);
  }

  return price;
}

export async function saveAllSkinPrices() {
  // All skins from portfolio & watchlist, distinct
  const skins = await prisma.skin.findMany({
    where: {
      OR: [
        { watchlist: { some: {} } },
        { portfolio: { some: {} } }
      ]
    }
  });

  for (const skin of skins) {
    const price = await getSteamPrice(skin.marketHashName);
    if (price) {
      await prisma.priceHistory.create({
        data: {
          skinId: skin.id,
          date: new Date(),
          price
        }
      });
      console.log(`[${skin.marketHashName}] Price saved: ${price}`);

      // --- Check price alerts ---
      const alerts = await prisma.watchlist.findMany({
        where: {
          skinId: skin.id,
          priceAlert: { not: null }
        },
        include: { user: true }
      });

      for (const alert of alerts) {
        if (price <= alert.priceAlert) {
          // Send mail!
          if (process.env.ENABLE_EMAILS === "true") {
            await sendPriceAlertEmail(alert.user.email, skin.marketHashName, price, alert.priceAlert); // <- HIER!
            // Reset price alert so user doesn't get duplicate emails
            await prisma.watchlist.update({
              where: { id: alert.id },
              data: { priceAlert: null }
            });

            console.log(`🔔 Price alert triggered for ${skin.marketHashName} to user ${alert.user.email}`);
          }
        }
      }
      // --- End price alerts ---

    } else {
      console.log(`[${skin.marketHashName}] Price could not be fetched.`);
    }
  }
}
await prisma.$disconnect();

// Every day at 2:00 AM
cron.schedule('0 2 * * *', saveAllSkinPrices);

// Optionally: Run once at startup (for development)
saveAllSkinPrices();
