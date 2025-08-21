// backend/src/cron/index.js
// {/* Zentraler Scheduler für alle Jobs */}
// Achtung: Zeiten sind in UTC, wenn der Server in UTC läuft (Render).
import cron from "node-cron";
import { spawn } from "node:child_process";
import checkPriceAlerts from "./priceAlertJob.js";
import { calculateAndStorePortfolioValues } from "../services/portfolioHistoryService.js";

// {/* 02:00 UTC → z.B. 04:00 Berlin im Sommer */}
// Preise updaten über dein robustes Script (separater Prozess = stabiler)
cron.schedule("0 2 * * *", () => {
  console.log("[CRON] Starting updateSkinPrices.js...");
  const p = spawn("node", ["scripts/updateSkinPrices.js"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  p.on("close", (code) => console.log(`[CRON] updateSkinPrices.js exited with ${code}`));
});

// {/* 02:10 UTC */} Portfolio-Historie schreiben
cron.schedule("10 2 * * *", async () => {
  console.log("[CRON] Starting daily portfolio history...");
  await calculateAndStorePortfolioValues();
  console.log("[CRON] Portfolio history done.");
});

// {/* alle 30 Minuten */} Price Alerts prüfen
cron.schedule("*/30 * * * *", async () => {
  console.log("[CRON] Checking price alerts...");
  await checkPriceAlerts();
  console.log("[CRON] Alerts check done.");
});
