// backend/src/routes/healthRoutes.js
// --------------------------------------------------
// {/* Health: exposes last timestamps for PriceHistory & PortfolioHistory */}
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();

// General health check
router.get("/", (_req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    service: "CS2 Skin Tracker API"
  });
});

// Build info endpoint
router.get("/build-info", (_req, res) => {
  try {
    const startTime = process.hrtime();
    const uptime = process.uptime();
    
    res.json({
      ok: true,
      version: process.env.APP_VERSION || '1.0.0',
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      gitCommit: process.env.GIT_COMMIT || 'unknown',
      gitBranch: process.env.GIT_BRANCH || 'main',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      lastDeploy: process.env.LAST_DEPLOY || new Date().toISOString(),
      uptime: Math.floor(uptime).toString(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      platform: {
        os: process.platform,
        arch: process.arch,
        pid: process.pid
      },
      ts: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting build info:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get build info',
      ts: new Date().toISOString()
    });
  }
});

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
