import express from "express";
import { getPortfolio, addToPortfolio, removeFromPortfolio, updatePortfolio, getPortfolioKPIs, getPortfolioContribution, getPortfolioSummary, exportPortfolio } from "../controllers/portfolioController.js";
import { clerkAuth, optionalClerkAuth } from "../middleware/clerkAuth.js";
import { verifyClerkJwt } from "../middleware/verifyClerkJwt.js";

const router = express.Router();

// Portfolio routes - using real JWT authentication
router.get('/summary', verifyClerkJwt, getPortfolioSummary);
router.get('/export', verifyClerkJwt, exportPortfolio);
router.get('/', verifyClerkJwt, getPortfolio);
router.get('/kpis', verifyClerkJwt, getPortfolioKPIs);
router.get('/contribution', verifyClerkJwt, getPortfolioContribution);
router.post('/', verifyClerkJwt, addToPortfolio);
router.delete('/:id', verifyClerkJwt, removeFromPortfolio);
router.patch('/:id', verifyClerkJwt, updatePortfolio);

export default router;
