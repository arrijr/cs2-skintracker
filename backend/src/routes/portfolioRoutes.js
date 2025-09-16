import express from "express";
import { getPortfolio, addToPortfolio, removeFromPortfolio, updatePortfolio, getPortfolioKPIs, getPortfolioContribution } from "../controllers/portfolioController.js";
import { clerkAuth, optionalClerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Portfolio routes - temporarily using optional auth for testing
router.get('/', optionalClerkAuth, getPortfolio);
router.get('/kpis', optionalClerkAuth, getPortfolioKPIs);
router.get('/contribution', optionalClerkAuth, getPortfolioContribution);
router.post('/', clerkAuth, addToPortfolio);
router.delete('/:id', clerkAuth, removeFromPortfolio);
router.patch('/:id', clerkAuth, updatePortfolio);

export default router;
