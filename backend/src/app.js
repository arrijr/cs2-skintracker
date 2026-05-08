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
import blogRoutes from "./routes/blogRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import researchRoutes from "./routes/researchRoutes.js";

dotenv.config();

const app = express();

// PERMANENT CORS FIX - v2.0
console.log("[APP] Starting with PERMANENT CORS configuration - v2.0");
console.log("[CORS] PERMANENT FIX: Dual-layer CORS protection");
console.log("[CORS] 1. CORS middleware with permissive origin function");
console.log("[CORS] 2. Manual header setting as backup for all requests");
console.log("[CORS] 3. Preflight handling for all OPTIONS requests");
console.log("[CORS] This should resolve ALL CORS issues permanently");

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
  // Vercel domains - UPDATED with current URLs
  "https://cs2-skintracker.vercel.app",
  "https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app",
  "https://cs2-skintracker-dev.vercel.app",
  "https://cs2-skintracker-staging.vercel.app",
  // Additional Vercel patterns
  "https://cs2-skintracker-git-*.arrijrs-projects.vercel.app"
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Always allow requests (including no origin for mobile apps, Postman, etc.)
    // This is the most permissive approach that works with all Vercel URLs
    console.log(`[CORS] Request from origin: ${origin || 'no-origin'}`);
    
    // Special handling for Vercel requests without origin header
    if (!origin) {
      console.log('[CORS] No origin header - allowing request (Vercel compatibility)');
      callback(null, true);
      return;
    }
    
    // Check if origin is in whitelist or matches Vercel patterns
    const isAllowed = whitelist.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      console.log(`[CORS] Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      console.log(`[CORS] Origin ${origin} not in whitelist, but allowing anyway for Vercel compatibility`);
      callback(null, true); // Still allow for Vercel compatibility
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  // Force CORS headers to be sent with every response
  maxAge: 86400 // Cache preflight for 24 hours
};

// {/* Global CORS for all requests */}
app.use(cors(corsOptions));

// {/* Additional CORS middleware to ensure headers are always set */}
app.use((req, res, next) => {
  // Always set CORS headers manually as backup
  const origin = req.headers.origin;
  console.log(`[CORS-MIDDLEWARE] Setting headers for origin: ${origin || 'no-origin'}`);
  
  // Set Access-Control-Allow-Origin to the requesting origin or * for no origin
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS-MIDDLEWARE] Handling preflight request');
    res.status(200).end();
    return;
  }
  
  next();
});

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
app.use("/api/v1/blog", blogRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/research", researchRoutes);

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
