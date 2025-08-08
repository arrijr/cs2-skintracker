import prisma from "../prisma/prismaClient.js";

export async function calculateAndStorePortfolioValues() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    console.log("Checking user:", user.id, user.email);
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: user.id }
    });
    console.log("Portfolio entries:", portfolio);

    let totalValue = 0;

    for (const entry of portfolio) {
      // Get the latest price for this skin
      console.log("Processing portfolio entry:", entry);
      const latestPrice = await prisma.priceHistory.findFirst({
        where: { skinId: entry.skinId },
        orderBy: { date: 'desc' }
      });
      console.log("Latest price for skin", entry.skinId, ":", latestPrice);
      const price = latestPrice ? latestPrice.price : 0;
      totalValue += entry.amount * price;
    }
    console.log(`Calculated total portfolio value for ${user.email}:`, totalValue);

    // Save new entry in PortfolioHistory (only if portfolio is not empty)
    if (portfolio.length === 0) {
      console.log(`No portfolio for user ${user.email}, skipping...`);
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
      // Success message
      console.log(`PortfolioHistory saved for user ${user.email}: ${totalValue} €`);
    } catch (err) {
      // Error message
      console.error("Error saving to PortfolioHistory:", err);
    }
  }
}

// Allow manual execution for testing
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
