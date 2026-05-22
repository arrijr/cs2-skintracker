// backend/src/cron/index.js
// {/* Zentraler Scheduler für alle Jobs */}
// Achtung: Zeiten sind in UTC, wenn der Server in UTC läuft (Render).
import cron from "node-cron";
import { spawn } from "node:child_process";
import checkPriceAlerts from "./priceAlertJob.js";
import { calculateAndStorePortfolioValues } from "../services/portfolioHistoryService.js";
import runPortfolioHistoryCron from "./portfolioHistoryCron.js";
// Dead SteamWebAPI.com crons removed 2026-05-22 — vendor API was decommissioned,
// causing every run to no-op while leaving sold7d/30d/priceMedian7d/30d/90d NULL
// across the whole catalogue. Backfill now comes from Skinport (see below).
import { dailyCasePriceHistory } from "./dailyCasePriceHistory.js";
import { dailySkinPriceHistory } from "./dailySkinPriceHistory.js";
import { dailySkinQuantityHistory } from "./dailySkinQuantityHistory.js";
import { runCatalogSync } from "../services/catalog/catalogSyncJob.js";
import { runPriceRefresh } from "../services/pricing/priceRefreshJob.js";
import { runSkinportBulkBackfill } from "./skinportBulkBackfill.js";
import logger from "../utils/logger.js";

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

// 03:00 + 06:00 UTC SteamWebAPI.com crons removed 2026-05-22 (vendor decommissioned).

// {/* alle 30 Minuten */} Price Alerts prüfen
cron.schedule("*/30 * * * *", async () => {
  console.log("[CRON] Checking price alerts...");
  await checkPriceAlerts();
  console.log("[CRON] Alerts check done.");
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

// {/* täglich um 07:30 UTC */} Daily Skin Quantity History
cron.schedule("30 7 * * *", async () => {
  console.log("[CRON] Starting daily skin quantity history...");
  try {
    const result = await dailySkinQuantityHistory();
    if (result.success) {
      console.log(`[CRON] Skin quantity history completed: ${result.successCount} skins updated`);
    } else {
      console.log("[CRON] Skin quantity history completed with errors:", result.error);
    }
  } catch (error) {
    console.error("[CRON] Error in daily skin quantity history:", error);
  }
});

// {/* 02:30 UTC daily */} Catalog sync (bymykel → DB) — staggered to avoid 02:00 updateSkinPrices slot
cron.schedule("30 2 * * *", async () => {
  logger.info("[CRON] Catalog sync starting");
  try {
    const summary = await runCatalogSync();
    logger.info("[CRON] Catalog sync done", { summary });
  } catch (err) {
    logger.error("[CRON] Catalog sync failed", { error: err.message });
  }
}, { timezone: "UTC" });

// {/* 03:30 UTC daily */} Price refresh (Steam Market → DB) — staggered to avoid 03:00 SteamWebAPI slot
cron.schedule("30 3 * * *", async () => {
  logger.info("[CRON] Price refresh starting");
  try {
    const summary = await runPriceRefresh();
    logger.info("[CRON] Price refresh done", { summary });
  } catch (err) {
    logger.error("[CRON] Price refresh failed", { error: err.message });
  }
}, { timezone: "UTC" });

// {/* 04:00 UTC daily */} Skinport bulk backfill — one HTTP call covers the full
// catalogue (~20k items in ~1 min). Populates priceMin/Max/Median7d/Median30d
// and priceUpdatedAt for every skin we can match. Decoupled from the slow
// Steam Market refresh above so we always have *something* fresh.
cron.schedule("0 4 * * *", async () => {
  logger.info("[CRON] Skinport bulk backfill starting");
  try {
    const summary = await runSkinportBulkBackfill();
    logger.info("[CRON] Skinport bulk backfill done", { summary });
  } catch (err) {
    logger.error("[CRON] Skinport bulk backfill failed", { error: err.message });
  }
}, { timezone: "UTC" });
