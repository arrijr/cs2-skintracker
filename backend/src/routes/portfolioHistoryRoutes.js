import express from "express";
import prisma from "../prisma/prismaClient.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const history = await prisma.portfolioHistory.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });
  res.json(history);
});

export default router;
