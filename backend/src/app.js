const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();
const skinRoutes = require('./routes/skinRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const portfolioHistoryRoutes = require('./routes/portfolioHistoryRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/skins', skinRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/portfolio/history', portfolioHistoryRoutes);
require('./cron/priceHistoryJob'); // Startet das Cron-Job-Scheduling

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
module.exports = app;
