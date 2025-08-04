const cron = require('node-cron');
const { calculateAndStorePortfolioValues } = require('../services/portfolioHistoryService');

// Täglich um 03:00 Uhr morgens ausführen
cron.schedule('0 3 * * *', async () => {
  console.log('Starte täglichen PortfolioHistory-Cronjob...');
  await calculateAndStorePortfolioValues();
  console.log('PortfolioHistory-Cronjob abgeschlossen!');
});

// Damit das Script dauerhaft läuft (wenn du willst):
console.log('Cronjob läuft und wartet auf nächsten Termin...');
