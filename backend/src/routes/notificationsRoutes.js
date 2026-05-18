// backend/src/routes/notificationsRoutes.js — [Backend]
// Aggregated notifications feed for the authenticated user.
// Currently sources from AlertEvent. Designed to extend with portfolio events later.
import { Router } from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import prisma from '../prisma/prismaClient.js';

const router = Router();

router.use(verifyClerkJwt);

router.get('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });

  try {
    // TODO: extend with PortfolioEvent / system notifications once those exist.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.alertEvent.findMany({
      where: {
        alert: { userId },
        triggeredAt: { gte: thirtyDaysAgo },
      },
      include: {
        alert: {
          include: { skin: true },
        },
      },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
    });

    const items = events.map((ev) => {
      const skin = ev.alert?.skin;
      const skinName = skin?.name ?? 'a skin';
      const payload = (ev.payload && typeof ev.payload === 'object') ? ev.payload : {};
      const price = payload.price ?? payload.triggerPrice ?? payload.value;
      const body = price != null
        ? `${skinName} triggered your alert at €${Number(price).toFixed(2)}.`
        : `${skinName} matched your alert criteria.`;
      const href = skin?.id ? `/skins/${skin.id}` : `/alerts/${ev.alertId}`;
      return {
        id: `alert-event-${ev.id}`,
        kind: 'alert_fired',
        title: `Alert fired: ${skinName}`,
        body,
        href,
        ts: ev.triggeredAt.toISOString(),
        // No `read` field on AlertEvent yet — treat all as unread until mark-all-read tracking lands.
        read: false,
      };
    });

    return res.json({ items });
  } catch (err) {
    console.error('[notifications] list error', err);
    // Fail open so the bell doesn't break the header on schema drift.
    return res.json({ items: [] });
  }
});

// No-op for now (no `read` column on AlertEvent yet).
router.post('/mark-all-read', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  // TODO: persist read state once we add a NotificationRead table or read flag.
  return res.status(200).json({ ok: true });
});

export default router;
