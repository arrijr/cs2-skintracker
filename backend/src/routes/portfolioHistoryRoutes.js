import express from "express";
import prisma from "../prisma/prismaClient.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  // Quick fix: If user has no portfolio items, return empty history
  const portfolioCount = await prisma.portfolio.count({ where: { userId } });
  if (portfolioCount === 0) {
    return res.json([]);
  }

  const history = await prisma.portfolioHistory.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });
  res.json(history);
});

export default router;
