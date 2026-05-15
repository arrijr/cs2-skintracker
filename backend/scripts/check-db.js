import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const skinCount = await prisma.skin.count();
    const priceHistoryCount = await prisma.priceHistory.count();
    const userCount = await prisma.user.count();
    const portfolioCount = await prisma.portfolio.count();
    const subscriptionCount = await prisma.userSubscriptions.count();

    console.log('\n=== DATABASE STATUS ===');
    console.log(`Skins: ${skinCount}`);
    console.log(`Price History Entries: ${priceHistoryCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Portfolios: ${portfolioCount}`);
    console.log(`Subscriptions: ${subscriptionCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({ select: { id: true, email: true, createdAt: true } });
      console.log('\n=== EXISTING USERS ===');
      users.forEach(u => console.log(`ID ${u.id}: ${u.email} (created: ${u.createdAt})`));
    }

  } catch (error) {
    console.error('DB Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
