// backend/src/routes/healthRoutes.js — [Backend]
// {/* Health: exposes last timestamps for PriceHistory & PortfolioHistory */}
import { Router } from "express";
import prisma from "../prisma/prismaClient.js";
import logger from "../utils/logger.js";
import { verifyClerkJwt } from "../middleware/verifyClerkJwt.js";
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

router.get("/cron-status", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const [lastPriceHistory] = await prisma.$queryRaw`
      SELECT MAX(date) AS last_date FROM "PriceHistory"
    `;
    const [lastPortfolioHistory] = await prisma.$queryRaw`
      SELECT MAX(date) AS last_date FROM "PortfolioHistory"
    `;

    const duration = Date.now() - startTime;
    
    logger.apiRequest(req, res, duration);
    logger.debug('Cron status check', {
      priceHistoryLastRun: lastPriceHistory?.last_date,
      portfolioHistoryLastRun: lastPortfolioHistory?.last_date,
      duration,
    });

    res.json({
      ok: true,
      priceHistoryLastRun: lastPriceHistory?.last_date ?? null,
      portfolioHistoryLastRun: lastPortfolioHistory?.last_date ?? null,
      now: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.apiError(req, error, 500);
    logger.error('Cron status check failed', error, {
      duration,
    });
    
    res.status(500).json({ ok: false, error: "health-error" });
  }
});

// Log system health and statistics
router.get("/logs", (req, res) => {
  try {
    const logStats = logger.getLogStats();
    
    res.json({
      ok: true,
      logs: logStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get log stats', error, {
      ip: req.ip,
    });
    
    res.status(500).json({ 
      ok: false, 
      error: "Failed to get log statistics" 
    });
  }
});

// Clerk JWT verification health check
router.get("/clerk", verifyClerkJwt, (req, res) => {
  // Wenn verifyClerkJwt passiert → OK
  res.json({ 
    ok: true, 
    sub: req.clerkJwt?.sub || null,
    message: "Clerk JWT verification successful"
  });
});

export default router;
