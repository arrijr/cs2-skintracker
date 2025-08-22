// backend/scripts/checkPriceHistory.js
// --------------------------------------------------
// {/* Sanity Check: show last 10 PriceHistory entries (skin + price + timestamp) */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.priceHistory.findMany({
    orderBy: { date: "desc" },
    take: 10,
    include: { skin: { select: { marketHashName: true } } },
  });
  console.table(
    rows.map((r) => ({
      at: r.date.toISOString(),
      skin: r.skin?.marketHashName,
      price: r.price,
    }))
  );
}
main().finally(() => prisma.$disconnect());
