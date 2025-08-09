import cron from "node-cron";
import { calculateAndStorePortfolioValues } from "../services/portfolioHistoryService.js";

// Run every day at 03:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Starting daily portfolio history cron job...');
  await calculateAndStorePortfolioValues();
  console.log('Portfolio history cron job finished!');
});
await prisma.$disconnect();

// Keep the script running (if needed)
console.log('Cron job running, waiting for next scheduled execution...');
