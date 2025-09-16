import express from "express";
import { getPortfolio, addToPortfolio, removeFromPortfolio, updatePortfolio, getPortfolioKPIs, getPortfolioContribution } from "../controllers/portfolioController.js";
import { clerkAuth, optionalClerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Portfolio routes - temporarily disabled auth for testing
router.get('/', (req, res, next) => {
  req.userId = 1;
  req.auth = { userId: 1 };
  next();
}, getPortfolio);
router.get('/kpis', (req, res, next) => {
  req.userId = 1;
  req.auth = { userId: 1 };
  next();
}, getPortfolioKPIs);
router.get('/contribution', (req, res, next) => {
  req.userId = 1;
  req.auth = { userId: 1 };
  next();
}, getPortfolioContribution);
router.post('/', (req, res, next) => {
  req.userId = 1;
  req.auth = { userId: 1 };
  next();
}, addToPortfolio);
router.delete('/:id', (req, res, next) => {
  req.userId = 1;
  req.auth = { userId: 1 };
  next();
}, removeFromPortfolio);
router.patch('/:id', (req, res, next) => {
  req.userId = 1;
  req.auth = { userId: 1 };
  next();
}, updatePortfolio);

export default router;
