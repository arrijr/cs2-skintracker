import express from "express";
import { getPortfolio, addToPortfolio, removeFromPortfolio, updatePortfolio, getPortfolioKPIs, getPortfolioContribution } from "../controllers/portfolioController.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// All portfolio routes require authentication
router.get('/', clerkAuth, getPortfolio);
router.get('/kpis', clerkAuth, getPortfolioKPIs);
router.get('/contribution', clerkAuth, getPortfolioContribution);
router.post('/', clerkAuth, addToPortfolio);
router.delete('/:id', clerkAuth, removeFromPortfolio);
router.patch('/:id', clerkAuth, updatePortfolio);

export default router;
