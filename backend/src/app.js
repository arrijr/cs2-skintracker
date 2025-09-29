// /backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import "./cron/index.js";

import userRoutes from "./routes/userRoutes.js";
import skinRoutes from "./routes/skinRoutes.js";
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

dotenv.config();

const app = express();

// Force restart trigger for CORS fix
console.log("[APP] Starting with updated CORS configuration - v1.5");
console.log("[CORS] FIXED: Credentials + Origin function to resolve wildcard conflict");
console.log("[CORS] Removed conflicting wildcard headers that blocked credentials");

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

// {/* Build CORS whitelist from ENV */}
const parseCSV = (v) => (v || "").split(",").map(s => s.trim()).filter(Boolean);
const whitelist = [
  ...parseCSV(process.env.ALLOWED_ORIGINS), // e.g. https://cs2-skintracker-arrijrs-projects.vercel.app, http://localhost:3000
  process.env.FRONTEND_ORIGIN,              // optional single origin
  // Vercel domains
  "https://cs2-skintracker.vercel.app",
  "https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app",
  // Additional Vercel patterns
  "https://cs2-skintracker-git-*.arrijrs-projects.vercel.app"
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins for now, but handle credentials properly
    callback(null, true);
  },
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false
};

// {/* Global CORS for all requests */}
app.use(cors(corsOptions));

// {/* CORS handled by cors middleware above */}

// {/* Preflight for ALL paths (Regex, kein "*" mehr) */}
app.options(/.*/, cors(corsOptions));

// Routes (nur Pfade, keine URLs!)
app.use("/api/v1/users", sensitiveLimiter, userRoutes);
app.use("/api/v1/skins", skinRoutes);
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
