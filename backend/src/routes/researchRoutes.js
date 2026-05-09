/**
 * Research Routes
 * Pro-tier research tools endpoints
 */

import express from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import {
  getPortfolioResearch,
  getSkinResearch,
  getSkinVolatility,
  getSkinRarity
} from '../controllers/researchController.js';

const router = express.Router();

// Pro-tier endpoints (require authentication + Pro subscription)
router.get('/portfolio', verifyClerkJwt, getPortfolioResearch);
router.get('/skins/:id', verifyClerkJwt, getSkinResearch);

// Public endpoints (authentication optional, no tier check)
router.get('/volatility/:id', getSkinVolatility);
router.get('/rarity/:id', getSkinRarity);

export default router;
