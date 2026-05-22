import express from "express";
import { getUserTransactions, addTransaction, updateTransaction, deleteTransaction } from "../controllers/transactionController.js";
import { verifyClerkJwt } from "../middleware/verifyClerkJwt.js";

const router = express.Router();

// All transaction routes require authentication.
//
// SECURITY (2026-05-22 audit, finding #1): previously used `clerkAuth` which
// only set `req.auth.userId` (Clerk string id). Controllers here read
// `req.userId` (DB int) → `undefined` → Prisma `where: { userId: undefined }`
// silently matched ALL rows → cross-user IDOR (any signed-in user saw every
// user's transaction history). `verifyClerkJwt` does the DB lookup and
// populates `req.userId` correctly.
router.get('/', verifyClerkJwt, getUserTransactions);
router.post('/', verifyClerkJwt, addTransaction);
router.patch('/:id', verifyClerkJwt, updateTransaction);
router.delete('/:id', verifyClerkJwt, deleteTransaction);

export default router;
