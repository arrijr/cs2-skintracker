// /backend/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import skinRoutes from "./routes/skinRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import portfolioHistoryRoutes from "./routes/portfolioHistoryRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// {/* Build CORS whitelist from ENV */}
const parseCSV = (v) => (v || "").split(",").map(s => s.trim()).filter(Boolean);
const whitelist = [
  ...parseCSV(process.env.ALLOWED_ORIGINS), // e.g. https://cs2-skintracker-arrijrs-projects.vercel.app, http://localhost:3000
  process.env.FRONTEND_ORIGIN,              // optional single origin
].filter(Boolean);

const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "true";

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // server-to-server/no-origin
    if (whitelist.includes(origin)) return cb(null, true);
    if (allowVercelPreviews && /\.vercel\.app$/.test(origin)) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

// {/* Global CORS for all requests */}
app.use(cors(corsOptions));

// {/* Preflight for ALL paths (Regex, kein "*" mehr) */}
app.options(/.*/, cors(corsOptions));

// Routes (nur Pfade, keine URLs!)
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/skins", skinRoutes);
app.use("/api/v1/watchlist", watchlistRoutes);
app.use("/api/v1/portfolio", portfolioRoutes);
app.use("/api/v1/portfolio/history", portfolioHistoryRoutes);

// 404
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ error: `No route for: ${req.method} ${req.originalUrl}` });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("UNCAUGHT ERROR:", err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
