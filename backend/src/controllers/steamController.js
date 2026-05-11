import defaultPrisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';
import {
  buildAuthRedirectUrl,
  verifyAuthCallback,
  signState,
  verifyState,
} from '../services/steam/steamOpenId.js';
import { fetchInventory } from '../services/steam/steamInventoryClient.js';
import { matchInventory } from '../services/steam/inventoryMatcher.js';
import { importSkinMatches } from '../services/steam/portfolioImporter.js';

const BACKEND_BASE = process.env.STEAM_OPENID_RETURN_BASE_URL || 'http://localhost:5000';
const FRONTEND_BASE = process.env.FRONTEND_URL || 'http://localhost:3000';
const STATE_SECRET = process.env.STEAM_OPENID_STATE_SECRET || 'dev-state-secret-replace-in-prod';

export async function connectRedirect(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });

  const state = signState({ userId, ts: Date.now() }, STATE_SECRET);
  const returnTo = `${BACKEND_BASE}/api/v1/steam/connect/callback?state=${encodeURIComponent(state)}`;
  const realm = BACKEND_BASE.endsWith('/') ? BACKEND_BASE : `${BACKEND_BASE}/`;
  const url = buildAuthRedirectUrl({ returnTo, realm });
  return res.redirect(302, url);
}

export async function connectCallback(req, res, { prismaClient = defaultPrisma, openIdVerify = verifyAuthCallback } = {}) {
  try {
    const state = req.query.state;
    if (!state) throw new Error('missing state');
    const { userId } = verifyState(String(state), STATE_SECRET);

    const openidParams = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (k.startsWith('openid.')) openidParams[k] = String(v);
    }

    const steamId = await openIdVerify(openidParams);
    await prismaClient.user.update({
      where: { id: userId },
      data: { steamId, steamConnectedAt: new Date() },
    });

    return res.redirect(302, `${FRONTEND_BASE}/account?steam=connected`);
  } catch (err) {
    logger.error('Steam connect callback failed', { error: err.message });
    return res.redirect(302, `${FRONTEND_BASE}/account?steam=error&reason=${encodeURIComponent(err.message)}`);
  }
}

export async function disconnect(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  await prismaClient.user.update({
    where: { id: userId },
    data: { steamId: null, steamConnectedAt: null },
  });
  return res.json({ disconnected: true });
}

export async function status(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { steamId: true, steamConnectedAt: true },
  });
  if (!user) return res.status(404).json({ error: 'user not found' });

  let lastImportedAt = null;
  if (user.steamId) {
    const last = await prismaClient.portfolio.findFirst({
      where: { userId, importedFromSteamAt: { not: null } },
      orderBy: { importedFromSteamAt: 'desc' },
      select: { importedFromSteamAt: true },
    });
    lastImportedAt = last?.importedFromSteamAt ?? null;
  }

  return res.json({
    connected: !!user.steamId,
    steamId: user.steamId,
    steamConnectedAt: user.steamConnectedAt,
    lastImportedAt,
  });
}

export async function preview(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: { steamId: true } });
  if (!user?.steamId) return res.status(400).json({ error: 'Steam account not connected' });
  try {
    const items = await fetchInventory(user.steamId);
    const result = await matchInventory(items, { prismaClient });
    return res.json({
      totals: {
        fetched: items.length,
        matched: result.matched.length,
        skipped: result.skipped.length,
      },
      matched: result.matched,
      skipped: result.skipped,
    });
  } catch (err) {
    logger.error('Steam preview failed', { userId, error: err.message });
    return res.status(502).json({ error: err.message });
  }
}

export async function importInventory(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: { steamId: true } });
  if (!user?.steamId) return res.status(400).json({ error: 'Steam account not connected' });

  const { costBasisMode, custom } = req.body || {};
  try {
    const items = await fetchInventory(user.steamId);
    const matchResult = await matchInventory(items, { prismaClient });
    const importResult = await importSkinMatches(
      { userId, matches: matchResult.matched, costBasisMode, custom },
      { prismaClient }
    );
    return res.status(201).json({
      created: importResult.created,
      matched: matchResult.matched.length,
      skipped: matchResult.skipped.length,
    });
  } catch (err) {
    logger.error('Steam import failed', { userId, error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
