import cron from "node-cron";
import prisma from "../prisma/prismaClient.js";
import axios from "axios";
import { sendPriceAlertEmail } from "../services/emailService.js"; // <- Richtiger Name!

async function fetchSteamPrice(marketHashName) {
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&market_hash_name=${encodeURIComponent(marketHashName)}&currency=3`;
  try {
    console.log("Steam API Call:", url);
    const res = await axios.get(url);
    console.log("Steam response:", res.data);

    let price = null;
    if (res.data && res.data.lowest_price) {
      price = parseFloat(
        res.data.lowest_price.replace('€', '').replace(',', '.').trim()
      );
    } else if (res.data && res.data.median_price) {
      price = parseFloat(
        res.data.median_price.replace('€', '').replace(',', '.').trim()
      );
      console.log("No lowest_price – using median_price:", price);
    }

    return price;
  } catch (e) {
    console.error(`Price fetch failed for ${marketHashName}:`, e.message);
  }
  return null;
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
    const price = await fetchSteamPrice(skin.marketHashName);
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
