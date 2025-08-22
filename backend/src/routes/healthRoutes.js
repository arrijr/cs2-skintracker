// backend/src/routes/healthRoutes.js
// --------------------------------------------------
// {/* Health: exposes last timestamps for PriceHistory & PortfolioHistory */}
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();

router.get("/cron-status", async (_req, res) => {
  try {
    const [lastPriceHistory] = await prisma.$queryRaw`
      SELECT MAX(date) AS last_date FROM "PriceHistory"
    `;
    const [lastPortfolioHistory] = await prisma.$queryRaw`
      SELECT MAX(date) AS last_date FROM "PortfolioHistory"
    `;

    res.json({
      ok: true,
      priceHistoryLastRun: lastPriceHistory?.last_date ?? null,
      portfolioHistoryLastRun: lastPortfolioHistory?.last_date ?? null,
      now: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[/cron-status] error:", e);
    res.status(500).json({ ok: false, error: "health-error" });
  }
});

export default router;
