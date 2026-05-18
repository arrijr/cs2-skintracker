import prisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';

const TIER_QUOTA = { free: 1, lite: 5, pro: 999 };
const VALID_TYPES = ['price_threshold', 'volatility', 'float_tier', 'case_ev'];
// in_app = bell notification via AlertEvent rows + frontend SWR poll
// discord kept for backwards compat with legacy alerts; not exposed in new UI
const VALID_CHANNELS = ['email', 'in_app', 'discord'];

function getTierFromUser(user) {
  // TODO: when Lite tier is distinct in DB, return 'lite' for those users.
  return user?.isPremium ? 'pro' : 'free';
}

export async function listAlerts(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const alerts = await prisma.alert.findMany({
    where: { userId },
    include: { skin: true, case: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ alerts });
}

export async function createAlert(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });

  const { type, skinId, caseId, config, channels, cooldownMinutes } = req.body || {};
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'invalid alert type', validTypes: VALID_TYPES });
  }
  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ error: 'at least one channel required' });
  }
  for (const ch of channels) {
    if (!VALID_CHANNELS.includes(ch)) {
      return res.status(400).json({ error: `invalid channel: ${ch}`, validChannels: VALID_CHANNELS });
    }
  }
  if (config == null || typeof config !== 'object') {
    return res.status(400).json({ error: 'config object required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  const tier = getTierFromUser(user);
  const existing = await prisma.alert.count({ where: { userId, isActive: true } });
  const quota = TIER_QUOTA[tier];
  if (existing >= quota) {
    return res.status(403).json({
      error: 'alert quota exceeded for tier',
      tier,
      quota,
      current: existing,
    });
  }

  // Validate type-specific FK requirements + existence
  if (type === 'case_ev') {
    if (caseId == null) {
      return res.status(400).json({ error: 'case_ev alert requires caseId' });
    }
    const exists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: `case ${caseId} not found` });
  } else {
    // price_threshold, volatility, float_tier all require skinId
    if (skinId == null) {
      return res.status(400).json({ error: `${type} alert requires skinId` });
    }
    const exists = await prisma.skin.findUnique({ where: { id: skinId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: `skin ${skinId} not found` });
  }

  try {
    const alert = await prisma.alert.create({
      data: {
        userId,
        skinId: skinId ?? null,
        caseId: caseId ?? null,
        type,
        config,
        channels,
        cooldownMinutes: cooldownMinutes ?? 60,
      },
      include: { skin: true, case: true },
    });
    return res.status(201).json({ alert });
  } catch (err) {
    logger.error('createAlert failed', { userId, err: err.message });
    return res.status(500).json({ error: 'failed to create alert' });
  }
}

export async function updateAlert(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    return res.status(404).json({ error: 'alert not found' });
  }
  const { config, channels, isActive, cooldownMinutes } = req.body || {};

  // Validate channels if provided
  if (channels !== undefined) {
    if (!Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ error: 'channels must be a non-empty array' });
    }
    for (const ch of channels) {
      if (!VALID_CHANNELS.includes(ch)) {
        return res.status(400).json({ error: `invalid channel: ${ch}`, validChannels: VALID_CHANNELS });
      }
    }
  }

  // Validate config shape if provided
  if (config !== undefined && (config === null || typeof config !== 'object')) {
    return res.status(400).json({ error: 'config must be an object' });
  }

  // If reactivating, enforce quota (matches createAlert logic)
  if (isActive === true && alert.isActive === false) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tier = getTierFromUser(user);
    const activeCount = await prisma.alert.count({ where: { userId, isActive: true } });
    const quota = TIER_QUOTA[tier];
    if (activeCount >= quota) {
      return res.status(403).json({
        error: 'alert quota exceeded for tier — cannot reactivate',
        tier,
        quota,
        current: activeCount,
      });
    }
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: {
      ...(config !== undefined ? { config } : {}),
      ...(channels !== undefined ? { channels } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(cooldownMinutes !== undefined ? { cooldownMinutes } : {}),
    },
    include: { skin: true, case: true },
  });
  return res.json({ alert: updated });
}

export async function deleteAlert(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    return res.status(404).json({ error: 'alert not found' });
  }
  await prisma.alert.delete({ where: { id } });
  return res.status(204).send();
}

export async function getAlertEvents(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    return res.status(404).json({ error: 'alert not found' });
  }
  const events = await prisma.alertEvent.findMany({
    where: { alertId: id },
    orderBy: { triggeredAt: 'desc' },
    take: 50,
  });
  return res.json({ events });
}
