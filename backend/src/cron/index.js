const cron = require('node-cron');
const checkPriceAlerts = require('./priceAlertJob');

// Alle 30 Minuten prüfen (Cron-Syntax: */30 * * * *)
cron.schedule('*/30 * * * *', async () => {
  console.log('Checking price alerts...');
  await checkPriceAlerts();
});