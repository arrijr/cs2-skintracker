// backend/src/routes/logsRoutes.js — [Backend]
// {/* Logs API Routes for Error Tracking & Monitoring */}
import express from "express";
import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Anyone (including bots) can POST here, so:
//  - tight per-IP rate limit (prevents log-flood DoS + cost amplification),
//  - hard cap on payload size enforced via body length,
//  - level allow-list and length caps on free-text fields so an attacker
//    can't pollute downstream log infra with megabyte messages or smuggle
//    CRLF / ANSI escapes / fake log lines into structured logs.
const frontendLogLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const ALLOWED_LEVELS = new Set(['debug', 'info', 'warn', 'error']);
const MAX_FIELD_LEN = 1000;

function sanitizeField(v, max = MAX_FIELD_LEN) {
  if (v == null) return undefined;
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  // Strip CR/LF/tab/ANSI escapes that could forge log lines, then truncate.
  const stripped = s.replace(/[\r\n\t]/g, ' ');
  return stripped.length > max ? stripped.slice(0, max) : stripped;
}

// POST /api/logs - Receive logs from frontend
router.post('/', frontendLogLimiter, async (req, res) => {
  try {
    const logEntry = req.body || {};

    if (!ALLOWED_LEVELS.has(logEntry.level) || !logEntry.message || !logEntry.timestamp) {
      return res.status(400).json({
        error: 'Invalid log entry structure',
        required: ['level (debug|info|warn|error)', 'message', 'timestamp'],
      });
    }

    logger.info('Frontend Log', {
      level: logEntry.level,
      message: sanitizeField(logEntry.message),
      timestamp: sanitizeField(logEntry.timestamp, 64),
      context: sanitizeField(logEntry.context, 2000),
      error: sanitizeField(logEntry.error, 2000),
      url: sanitizeField(logEntry.url, 500),
      userAgent: sanitizeField(req.get('User-Agent'), 300),
      ip: req.ip,
    });

    res.json({ success: true });

  } catch (error) {
    logger.error('Failed to process frontend log', error, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(500).json({ error: 'Failed to process log entry' });
  }
});

// GET /api/logs/health - Logs system health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'logs-api',
  });
});

// GET /api/logs/stats - Log statistics (admin only)
router.get('/stats', clerkAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get log statistics from database
    const stats = await prisma.auditLog.groupBy({
      by: ['level'],
      _count: {
        level: true,
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    res.json({
      stats,
      period: '24h',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    logger.error('Failed to get log stats', error, {
      userId: req.userId,
      ip: req.ip,
    });
    
    res.status(500).json({ error: 'Failed to get log statistics' });
  }
});

// GET /api/logs/recent - Recent logs (admin only)
router.get('/recent', clerkAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const level = req.query.level;

    const where = {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    };

    if (level) {
      where.level = level;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Max 100 logs
      select: {
        id: true,
        level: true,
        message: true,
        metadata: true,
        userId: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    res.json({
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    logger.error('Failed to get recent logs', error, {
      userId: req.userId,
      ip: req.ip,
    });
    
    res.status(500).json({ error: 'Failed to get recent logs' });
  }
});

export default router;
