const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const history = await prisma.portfolioHistory.findMany({
    where: { userId },
    orderBy: { date: 'asc' }
  });
  res.json(history);
});

module.exports = router;
