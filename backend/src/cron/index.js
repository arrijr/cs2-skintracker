// backend/src/cron/index.js
// {/* Zentraler Scheduler für alle Jobs */}
// Achtung: Zeiten sind in UTC, wenn der Server in UTC läuft (Render).
import cron from "node-cron";
import { spawn } from "node:child_process";
import checkPriceAlerts from "./priceAlertJob.js";
import { calculateAndStorePortfolioValues } from "../services/portfolioHistoryService.js";
import runPortfolioHistoryCron from "./portfolioHistoryCron.js";
import { updateSteamWebAPIData } from "./steamWebAPIDataUpdate.js";
import { dailySteamWebAPIDataUpdate } from "./dailySteamWebAPIDataUpdate.js";
import { dailyCasePriceHistory } from "./dailyCasePriceHistory.js";
import { dailySkinPriceHistory } from "./dailySkinPriceHistory.js";

// {/* 02:00 UTC → z.B. 04:00 Berlin im Sommer */}
// Preise updaten über dein robustes Script (separater Prozess = stabiler)
// Environment-Variablen für bessere Kontrolle in Produktion
const UPDATE_ALL_SKINS = process.env.UPDATE_ALL_SKINS !== "false"; // Standard: true
const UPDATE_BATCH_SIZE = process.env.PRICE_UPDATE_BATCH_SIZE || 1000; // Batch-Größe
const UPDATE_DELAY = process.env.PRICE_UPDATE_GLOBAL_DELAY_MS || 40; // Delay zwischen API-Calls

cron.schedule("0 2 * * *", () => {
  console.log("[CRON] Starting updateSkinPrices.js...");
  
  // Environment-Variablen für den Cron-Job setzen
  const env = {
    ...process.env,
    PRICE_UPDATE_ONLY_ACTIVE: UPDATE_ALL_SKINS ? "false" : "true", // Alle Skins oder nur aktive
    PRICE_UPDATE_BATCH_SIZE: UPDATE_BATCH_SIZE.toString(),
    PRICE_UPDATE_GLOBAL_DELAY_MS: UPDATE_DELAY.toString(),
  };
  
  const p = spawn("node", ["scripts/updateSkinPrices.js"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
    env: env,
  });
  p.on("close", (code) => console.log(`[CRON] updateSkinPrices.js exited with ${code}`));
});

// {/* 02:10 UTC */} Portfolio-Historie schreiben (legacy daily)
cron.schedule("10 2 * * *", async () => {
  console.log("[CRON] Starting daily portfolio history...");
  await calculateAndStorePortfolioValues();
  console.log("[CRON] Portfolio history done.");
});

// {/* 12-stündlich */} Portfolio-Historie mit 12h Sampling
cron.schedule("0 0,12 * * *", async () => {
  console.log("[CRON] Starting 12-hourly portfolio history...");
  await runPortfolioHistoryCron();
  console.log("[CRON] 12-hourly portfolio history done.");
});

// {/* 03:00 UTC */} SteamWebAPI.com Daten aktualisieren (täglich)
cron.schedule("0 3 * * *", async () => {
  console.log("[CRON] Starting SteamWebAPI.com data update...");
  await updateSteamWebAPIData();
  console.log("[CRON] SteamWebAPI.com data update done.");
});

// {/* alle 30 Minuten */} Price Alerts prüfen
cron.schedule("*/30 * * * *", async () => {
  console.log("[CRON] Checking price alerts...");
  await checkPriceAlerts();
  console.log("[CRON] Alerts check done.");
});

// {/* täglich um 06:00 UTC */} Daily SteamWebAPI.com data update
cron.schedule("0 6 * * *", async () => {
  console.log("[CRON] Starting daily SteamWebAPI.com data update...");
  try {
    const result = await dailySteamWebAPIDataUpdate();
    if (result.success) {
      console.log("[CRON] Daily SteamWebAPI data update completed successfully");
    } else {
      console.log("[CRON] Daily SteamWebAPI data update completed with errors:", result.error);
    }
  } catch (error) {
    console.error("[CRON] Error in daily SteamWebAPI data update:", error);
  }
});

// {/* täglich um 06:30 UTC */} Daily Case Price History
cron.schedule("30 6 * * *", async () => {
  console.log("[CRON] Starting daily case price history...");
  try {
    const result = await dailyCasePriceHistory();
    if (result.success) {
      console.log(`[CRON] Case price history completed: ${result.successCount} cases updated`);
    } else {
      console.log("[CRON] Case price history completed with errors:", result.error);
    }
  } catch (error) {
    console.error("[CRON] Error in daily case price history:", error);
  }
});

// {/* täglich um 07:00 UTC */} Daily Skin Price History
cron.schedule("0 7 * * *", async () => {
  console.log("[CRON] Starting daily skin price history...");
  try {
    const result = await dailySkinPriceHistory();
    if (result.success) {
      console.log(`[CRON] Skin price history completed: ${result.successCount} skins updated`);
    } else {
      console.log("[CRON] Skin price history completed with errors:", result.error);
    }
  } catch (error) {
    console.error("[CRON] Error in daily skin price history:", error);
  }
});
