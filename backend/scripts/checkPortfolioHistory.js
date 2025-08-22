// backend/scripts/checkPortfolioHistory.js
// --------------------------------------------------
// {/* Sanity Check: show today's PortfolioHistory entries (user + value) */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function main() {
  const today = startOfDay();
  const rows = await prisma.portfolioHistory.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "desc" },
    take: 20,
    include: { user: { select: { email: true } } },
  });
  console.table(
    rows.map((r) => ({
      at: r.date.toISOString(),
      user: r.user?.email,
      value: r.value,
    }))
  );
  console.log(`Today entries: ${rows.length}`);
}
main().finally(() => prisma.$disconnect());
