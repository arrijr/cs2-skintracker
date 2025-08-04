const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateAndStorePortfolioValues() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: user.id }
    });

    let totalValue = 0;

    for (const entry of portfolio) {
      const latestPrice = await prisma.priceHistory.findFirst({
        where: { skinId: entry.skinId },
        orderBy: { date: 'desc' }
      });
      const price = latestPrice ? latestPrice.price : 0;
      totalValue += entry.amount * price;
    }

    // Portfolio evtl. leer?
    if (portfolio.length === 0) {
      continue;
    }

    // Heute (nur Jahr-Monat-Tag vergleichen, Zeit ignorieren)
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    // Gibt es heute schon einen Eintrag?
    const existing = await prisma.portfolioHistory.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    if (existing) {
      // Update!
      await prisma.portfolioHistory.update({
        where: { id: existing.id },
        data: { value: totalValue }
      });
      console.log(`PortfolioHistory für ${user.email} am ${todayStart.toISOString().slice(0,10)} überschrieben: ${totalValue} €`);
    } else {
      // Neu anlegen!
      await prisma.portfolioHistory.create({
        data: {
          userId: user.id,
          date: new Date(),
          value: totalValue
        }
      });
      console.log(`PortfolioHistory für ${user.email} am ${todayStart.toISOString().slice(0,10)} angelegt: ${totalValue} €`);
    }
  }
}

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
