// {/* Daily Portfolio-Historie um 03:00 (Serverzeit/UTC auf Render beachten) */}
import cron from "node-cron";
import { calculateAndStorePortfolioValues } from "../services/portfolioHistoryService.js";

// Run every day at 03:00 AM (Cron im Web-Service)
cron.schedule("0 3 * * *", async () => {
  console.log("Starting daily portfolio history cron job...");
  await calculateAndStorePortfolioValues();
  console.log("Portfolio history cron job finished!");
});