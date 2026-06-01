// backend/src/routes/admin/insightsRoutes.js
// Phase-3 monitoring insights (tiers, steam adoption, notifications, snapshot
// freshness). Single read endpoint, behind clerkAdminAuth.
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import prisma from '../../prisma/prismaClient.js';
import { AdminInsightsService } from '../../services/adminInsightsService.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/insights', async (req, res) => {
  try {
    const insights = await AdminInsightsService.getInsights();
    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'view', resource: 'admin_insights', details: 'Admin insights accessed' },
    });
    res.json(insights);
  } catch (error) {
    console.error('Admin insights error:', error);
    res.status(500).json({ error: 'Failed to load insights' });
  }
});

export default router;
