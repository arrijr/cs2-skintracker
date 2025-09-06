// backend/src/cron/index.js
// {/* Zentraler Scheduler für alle Jobs */}
// Achtung: Zeiten sind in UTC, wenn der Server in UTC läuft (Render).
import cron from "node-cron";
import { spawn } from "node:child_process";
import checkPriceAlerts from "./priceAlertJob.js";
import { calculateAndStorePortfolioValues } from "../services/portfolioHistoryService.js";
import runPortfolioHistoryCron from "./portfolioHistoryCron.js";

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

// {/* alle 30 Minuten */} Price Alerts prüfen
cron.schedule("*/30 * * * *", async () => {
  console.log("[CRON] Checking price alerts...");
  await checkPriceAlerts();
  console.log("[CRON] Alerts check done.");
});
