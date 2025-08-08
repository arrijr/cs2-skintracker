import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import skinRoutes from "./routes/skinRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import portfolioHistoryRoutes from "./routes/portfolioHistoryRoutes.js";
import dotenv from "dotenv";
import "./cron/priceHistoryJob.js"; // Start cron job scheduler

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/skins', skinRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/portfolio/history', portfolioHistoryRoutes);

// 404-Handler
app.use((req, res, next) => {
  if (!res.headersSent) {
    res.status(404).json({ error: `No route for: ${req.method} ${req.originalUrl}` });
  }
});

// Fehler-Handler
app.use((err, req, res, next) => {
  console.error('UNCAUGHT ERROR:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
