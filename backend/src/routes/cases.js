// /backend/src/routes/cases.js — [Backend]
// {/* Case Routes - API endpoints for case management */}
import express from 'express';
import caseController from '../controllers/caseController.js';

const router = express.Router();

// GET /api/cases - Get all cases with filtering and sorting
router.get('/', caseController.getAllCases);

// GET /api/cases/stats - Get case statistics and market overview
router.get('/stats', caseController.getCaseStats);

// GET /api/cases/:id - Get specific case by ID
router.get('/:id', caseController.getCaseById);

// GET /api/cases/:id/supply - Get case supply history
router.get('/:id/supply', caseController.getCaseSupply);

// GET /api/cases/:id/price-history - Get case price history
router.get('/:id/price-history', caseController.getCasePriceHistory);

// GET /api/cases/:id/skins - Get skins contained in case
router.get('/:id/skins', caseController.getCaseSkins);

export default router;
