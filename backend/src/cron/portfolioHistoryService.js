const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateAndStorePortfolioValues() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    console.log("Prüfe User:", user.id, user.email);
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: user.id }
    });
    console.log("Portfolio-Einträge:", portfolio);

    let totalValue = 0;

    for (const entry of portfolio) {
      // Hole den neuesten Preis für diesen Skin
      console.log("Bearbeite Portfolio-Eintrag:", entry);
      const latestPrice = await prisma.priceHistory.findFirst({
        where: { skinId: entry.skinId },
        orderBy: { date: 'desc' }
      });
      console.log("Neuster Preis für Skin", entry.skinId, ":", latestPrice);
      const price = latestPrice ? latestPrice.price : 0;
      totalValue += entry.amount * price;
    }
    console.log(`Berechneter Portfolio-Gesamtwert für ${user.email}:`, totalValue);

    // Speichere einen neuen Eintrag in PortfolioHistory (nur, wenn Portfolio nicht leer)
    if (portfolio.length === 0) {
      console.log(`Kein Portfolio für User ${user.email}, überspringe...`);
      continue;
    }

    try {
      await prisma.portfolioHistory.create({
        data: {
          userId: user.id,
          date: new Date(),
          value: totalValue
        }
      });
      // Debug 6: Erfolgsmeldung
      console.log(`PortfolioHistory für User ${user.email} gespeichert: ${totalValue} €`);
    } catch (err) {
      // Debug 7: Fehler anzeigen
      console.error("Fehler beim Speichern in PortfolioHistory:", err);
    }
  }
}

// Damit du das Skript manuell testen kannst:
if (require.main === module) {
  calculateAndStorePortfolioValues()
    .then(() => {
      console.log('Fertig!');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { calculateAndStorePortfolioValues };