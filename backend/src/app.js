// /backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
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

// CORS whitelist from ALLOWED_ORIGINS env (comma-separated)
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Routes (nur Pfade, keine URLs!)
app.use("/api/v1/users", sensitiveLimiter, userRoutes);
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

// 404
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: `No route for: ${req.method} ${req.originalUrl}` });
  }
});

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
