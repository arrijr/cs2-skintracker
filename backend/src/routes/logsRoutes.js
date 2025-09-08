// backend/src/routes/logsRoutes.js — [Backend]
// {/* Logs API Routes for Error Tracking & Monitoring */}
import express from "express";
import logger from "../utils/logger.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// POST /api/logs - Receive logs from frontend
router.post('/', async (req, res) => {
  try {
    const logEntry = req.body;
    
    // Validate log entry structure
    if (!logEntry.level || !logEntry.message || !logEntry.timestamp) {
      return res.status(400).json({
        error: 'Invalid log entry structure',
        required: ['level', 'message', 'timestamp']
      });
    }

    // Log to backend logger
    logger.info('Frontend Log', {
      level: logEntry.level,
      message: logEntry.message,
      timestamp: logEntry.timestamp,
      context: logEntry.context,
      error: logEntry.error,
      url: logEntry.url,
      userAgent: logEntry.userAgent,
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
