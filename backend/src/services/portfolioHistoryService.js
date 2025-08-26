import prisma from "../prisma/prismaClient.js";

export async function calculateAndStorePortfolioValues() {
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

    // Skip if portfolio is empty
    if (portfolio.length === 0) {
      continue;
    }

    // Today (compare only year-month-day, ignore time)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if there is already an entry for today
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
      console.log(`PortfolioHistory for ${user.email} on ${todayStart.toISOString().slice(0, 10)} overwritten: ${totalValue} €`);
    } else {
      // Create new entry!
      await prisma.portfolioHistory.create({
        data: {
          userId: user.id,
          date: new Date(),
          value: totalValue
        }
      });
      console.log(`PortfolioHistory for ${user.email} on ${todayStart.toISOString().slice(0, 10)} created: ${totalValue} €`);
    }
  }
}

// Allow manual script execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  calculateAndStorePortfolioValues()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
