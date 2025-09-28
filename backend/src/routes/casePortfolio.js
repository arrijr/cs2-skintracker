// /backend/src/routes/casePortfolio.js — [Backend]
// {/* Case Portfolio Routes - API endpoints for case portfolio management */}
import express from 'express';
import casePortfolioController from '../controllers/casePortfolioController.js';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';

const router = express.Router();

// All routes require authentication
router.use(verifyClerkJwt);

// GET /api/case-portfolio - Get user's case portfolio
router.get('/', casePortfolioController.getCasePortfolio);

// POST /api/case-portfolio - Add case to portfolio
router.post('/', casePortfolioController.addCaseToPortfolio);

// PATCH /api/case-portfolio/:caseId - Update case portfolio entry
router.patch('/:caseId', casePortfolioController.updateCasePortfolio);

// DELETE /api/case-portfolio/:caseId - Remove case from portfolio
router.delete('/:caseId', casePortfolioController.removeCaseFromPortfolio);

export default router;
