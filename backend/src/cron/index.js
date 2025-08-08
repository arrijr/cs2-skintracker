import cron from "node-cron";
import checkPriceAlerts from "./priceAlertJob.js";

// Check price alerts every 30 minutes (Cron: */30 * * * *)
cron.schedule('*/30 * * * *', async () => {
  console.log('Checking price alerts...');
  await checkPriceAlerts();
});
