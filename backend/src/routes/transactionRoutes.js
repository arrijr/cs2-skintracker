import express from "express";
import { getUserTransactions, addTransaction, updateTransaction, deleteTransaction } from "../controllers/transactionController.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

router.get('/', authenticateToken, getUserTransactions);
router.post('/', authenticateToken, addTransaction);
router.patch('/:id', authenticateToken, updateTransaction);
router.delete('/:id', authenticateToken, deleteTransaction);

export default router;
