import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n=== DATABASE CONNECTION TEST ===\n');

    const counts = {
      skins: await prisma.skin.count(),
      priceHistory: await prisma.priceHistory.count(),
      users: await prisma.user.count(),
      portfolios: await prisma.portfolio.count(),
      subscriptions: await prisma.userSubscriptions.count(),
    };

    console.log('Database Status:');
    console.log(`  Skins: ${counts.skins}`);
    console.log(`  Price History: ${counts.priceHistory}`);
    console.log(`  Users: ${counts.users}`);
    console.log(`  Portfolios: ${counts.portfolios}`);
    console.log(`  Subscriptions: ${counts.subscriptions}`);

    if (counts.users > 0) {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, createdAt: true },
        take: 5,
      });
      console.log('\nFirst 5 Users:');
      users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} (ID: ${u.id})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
