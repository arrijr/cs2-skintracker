import express from "express";
import { getPortfolio, addToPortfolio, removeFromPortfolio, updatePortfolio } from "../controllers/portfolioController.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

router.get('/', authenticateToken, getPortfolio);
router.post('/', authenticateToken, addToPortfolio);
router.delete('/:id', authenticateToken, removeFromPortfolio);
router.patch('/:id', authenticateToken, updatePortfolio);

export default router;
