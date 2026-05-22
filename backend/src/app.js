// /backend/src/app.js
// IMPORTANT: dotenv must load + Sentry must initialise BEFORE any other
// module imports run, so @sentry/node can patch http / express before route
// modules are evaluated. We do this via a tiny side-effect bootstrap module.
import "./instrumentation/sentry-bootstrap.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { Sentry, isSentryEnabled } from "./instrumentation/sentry.js";
import "./cron/index.js";

import userRoutes from "./routes/userRoutes.js";
import skinRoutes from "./routes/skinRoutes.js";
import marketItemRoutes from "./routes/marketItemRoutes.js";
import caseRoutes from "./routes/cases.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import portfolioHistoryRoutes from "./routes/portfolioHistoryRoutes.js";
import casePortfolioRoutes from "./routes/casePortfolio.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminMetricsRoutes from "./routes/adminMetricsRoutes.js";
import logsRoutes from "./routes/logsRoutes.js";
import marketSnapshotRoutes from "./routes/marketSnapshotRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import researchRoutes from "./routes/researchRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import steamRoutes from "./routes/steamRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import skinDetailRoutes, { caseRouter } from "./routes/skinDetailRoutes.js";

// Inngest — background job orchestration (ADR-004)
import { serve as inngestServe } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { allFunctions as inngestFunctions } from "./inngest/functions.js";

dotenv.config();

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// IMPORTANT: Stripe webhook signature verification needs the RAW request body.
// `express.json()` consumes the body stream and replaces it with parsed JSON,
// which breaks `stripe.webhooks.constructEvent`. Mount a raw-body parser ONLY
// on the webhook path and let everything else use JSON. Express runs the
// first matching middleware in registration order, so this must come before
// `app.use(express.json())`.
app.use('/api/v1/subscriptions/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Rate limiting for sensitive endpoints
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for admin
  message: { error: 'Too many admin requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS whitelist from ALLOWED_ORIGINS env (comma-separated).
// Plus a hardcoded safety net for the canonical production domains so a
// misconfigured/missing env var can never blackhole the live site again.
// Without this fallback we had a multi-hour outage (commit a7855d8) where
// `ALLOWED_ORIGINS` was set correctly in the Render env-group but the
// running process didn't see `https://www.skintrackr.io` — symptom was
// every preflight returning 500 from `callback(new Error(…))`.
const HARDCODED_PROD_ORIGINS = [
  'https://skintrackr.io',
  'https://www.skintrackr.io',
  'https://api.skintrackr.io',
];
const ALLOWED = Array.from(new Set([
  ...HARDCODED_PROD_ORIGINS,
  ...(process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',').map(s => s.trim()).filter(Boolean),
]));
console.log('[CORS] ALLOWED origins:', JSON.stringify(ALLOWED));

// Vercel preview deployments for this project. Matches any branch / sha preview
// URL like `cs2-skintracker-<hash>-arrijrs-projects.vercel.app` or
// `cs2-skintracker-git-<branch>-arrijrs-projects.vercel.app`. Production
// domains (skintrackr.io / api.skintrackr.io / etc.) still come from
// ALLOWED_ORIGINS — preview URLs are matched here so we don't have to add a
// new env var entry for every PR.
const VERCEL_PREVIEW_PATTERNS = [
  /^https:\/\/cs2-skintracker(-[a-z0-9-]+)?-arrijrs-projects\.vercel\.app$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED.includes(origin)) return callback(null, true);
    if (VERCEL_PREVIEW_PATTERNS.some((p) => p.test(origin))) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

// `app.use(cors())` handles OPTIONS preflight automatically. The
// previously-explicit `app.options(/.*/, cors(corsOptions))` line caused
// Express 5 + path-to-regexp v6 to throw 500 on preflight (incompatible
// regex semantics), which broke www.skintrackr.io → api.skintrackr.io
// cross-origin requests entirely. Removed 2026-05-22.
app.use(cors(corsOptions));

// Routes (nur Pfade, keine URLs!)
app.use("/api/v1/users", sensitiveLimiter, userRoutes);

// Sprint 2 SEO-Routes MUST come BEFORE legacy `skinRoutes` because they share
// the `/api/v1/skins` mount path. Sprint 2 handlers are slug-aware and call
// `next()` for numeric inputs so the legacy integer-id router still serves
// `/api/v1/skins/123/price-history` etc.
app.use("/api/v1/skins", skinDetailRoutes);
app.use("/api/v1/cases", caseRouter);

app.use("/api/v1/skins", skinRoutes);
app.use("/api/v1/market-items", marketItemRoutes);
app.use("/api/v1/cases", caseRoutes);
app.use("/api/v1/watchlist", watchlistRoutes);
app.use("/api/v1/portfolio", portfolioRoutes);
app.use("/api/v1/portfolio/history", portfolioHistoryRoutes);
app.use("/api/v1/case-portfolio", casePortfolioRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/logs", logsRoutes);
app.use("/api/v1", marketSnapshotRoutes);
app.use("/api/v1/admin", adminLimiter, adminRoutes);
app.use("/api/v1/admin/metrics", adminLimiter, adminMetricsRoutes);
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/research", researchRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/steam", steamRoutes);
app.use("/api/v1/notifications", notificationsRoutes);

// Inngest webhook endpoint — receives cron triggers + manual events. (ADR-004)
// In dev (no signing key) Inngest CLI handles auth via local dev server (http://127.0.0.1:8288).
// In prod, INNGEST_SIGNING_KEY verifies webhook signatures.
app.use(
  "/api/inngest",
  inngestServe({
    client: inngest,
    functions: inngestFunctions,
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

// 404
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: `No route for: ${req.method} ${req.originalUrl}` });
  }
});

// Sentry Express error handler — must come BEFORE any other error middleware
// and AFTER all routes. v8+ API: setupExpressErrorHandler(app).
// No-op when SENTRY_DSN is unset (init was skipped, so the handler attaches
// but has nothing to send).
if (isSentryEnabled()) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handler
app.use((err, req, res, next) => {
  // Import logger here to avoid circular dependencies
  import("./utils/logger.js").then(({ default: logger }) => {
    logger.error("Uncaught error in Express", err, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId,
    });
  }).catch(() => {
    console.error("UNCAUGHT ERROR:", err?.message || err);
  });
  
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
