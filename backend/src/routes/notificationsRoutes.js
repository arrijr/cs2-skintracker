// backend/src/routes/notificationsRoutes.js — [Backend]
// Aggregated notifications feed for the authenticated user.
// Currently sources from AlertEvent. Designed to extend with portfolio events later.
import { Router } from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import prisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';

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
      // Evaluators emit `currentPrice` (price_threshold/volatility/float_tier)
      // or `casePrice` (case_ev). Old fallbacks (`price`, `triggerPrice`, `value`)
      // never matched a real key, so every body fell through to the generic copy.
      const price = payload.currentPrice ?? payload.casePrice ?? payload.price;
      const body = price != null
        ? `${skinName} triggered your alert at €${Number(price).toFixed(2)}.`
        : `${skinName} matched your alert criteria.`;
      const href = skin?.slug && skin?.weaponSlug
        ? `/skins/${skin.weaponSlug}/${skin.slug}`
        : skin?.id
          ? `/skins/${skin.id}`
          : `/alerts/${ev.alertId}`;
      return {
        id: `alert-event-${ev.id}`,
        kind: 'alert_fired',
        title: `Alert fired: ${skinName}`,
        body,
        href,
        ts: ev.triggeredAt.toISOString(),
        read: ev.readAt != null,
      };
    });

    return res.json({ items });
  } catch (err) {
    logger.error('notifications.list failed', { userId, err: err.message });
    // Fail open so the bell doesn't break the header on schema drift —
    // but the logger.error call above surfaces this to monitoring instead
    // of swallowing it silently like the old console.error did.
    return res.json({ items: [] });
  }
});

router.post('/mark-all-read', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });

  try {
    const result = await prisma.alertEvent.updateMany({
      where: {
        alert: { userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return res.json({ ok: true, updated: result.count });
  } catch (err) {
    logger.error('notifications.markAllRead failed', { userId, err: err.message });
    return res.status(500).json({ error: 'failed to mark notifications read' });
  }
});

// Mark a single event read. Frontend can use this on per-item click if it
// wants finer-grained read tracking than "mark all read on dropdown open".
router.post('/:id/read', async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });

  // Accept both raw `42` and the `alert-event-42` shape the GET handler emits.
  const raw = String(req.params.id || '');
  const idNum = parseInt(raw.replace(/^alert-event-/, ''), 10);
  if (!Number.isFinite(idNum)) return res.status(400).json({ error: 'invalid id' });

  try {
    const result = await prisma.alertEvent.updateMany({
      where: {
        id: idNum,
        alert: { userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'event not found or already read' });
    }
    return res.json({ ok: true });
  } catch (err) {
    logger.error('notifications.markOneRead failed', { userId, idNum, err: err.message });
    return res.status(500).json({ error: 'failed to mark notification read' });
  }
});

export default router;
