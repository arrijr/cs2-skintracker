import express from "express";
import { getUserTransactions, addTransaction, updateTransaction, deleteTransaction } from "../controllers/transactionController.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// All transaction routes require authentication
router.get('/', clerkAuth, getUserTransactions);
router.post('/', clerkAuth, addTransaction);
router.patch('/:id', clerkAuth, updateTransaction);
router.delete('/:id', clerkAuth, deleteTransaction);

export default router;
