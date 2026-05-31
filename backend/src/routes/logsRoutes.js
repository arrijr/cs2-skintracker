// backend/src/routes/logsRoutes.js — [Backend]
// {/* Logs API Routes for Error Tracking & Monitoring */}
import express from "express";
import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";
import { verifyClerkJwt } from "../middleware/verifyClerkJwt.js";

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

// NOTE (2026-05-31, audit finding #12): the GET /stats and GET /recent admin
// endpoints were removed. They were dead code — gated on `req.user?.role`
// which `verifyClerkJwt` never sets (it sets `req.userId` + `req.auth`), so
// they returned 403 unconditionally, AND referenced `prisma` without importing
// it (ReferenceError if the gate ever passed). No frontend called them. If an
// admin audit-log viewer is needed later, build it on `clerkAdminAuth` + the
// shared prisma singleton, with the auditLog query properly scoped.

export default router;
