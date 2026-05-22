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

function buildSteamAuthUrl(userId) {
  const state = signState({ userId, ts: Date.now() }, STATE_SECRET);
  const returnTo = `${BACKEND_BASE}/api/v1/steam/connect/callback?state=${encodeURIComponent(state)}`;
  const realm = BACKEND_BASE.endsWith('/') ? BACKEND_BASE : `${BACKEND_BASE}/`;
  return buildAuthRedirectUrl({ returnTo, realm });
}

// Legacy: GET /connect/redirect — kept for back-compat. The frontend now uses
// POST /connect/start (with Authorization header) to avoid leaking the JWT in
// the URL. This route still requires Clerk auth via the middleware. As of the
// 2026-05-22 security audit we no longer accept `?token=` in verifyClerkJwt,
// so this route is reachable only via an Authorization header on the GET,
// which browser-initiated top-level navigations cannot set. In practice
// nothing should hit this anymore; we log to confirm before removing.
export async function connectRedirect(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  logger.warn('[steam] legacy /connect/redirect called', { userId });
  return res.redirect(302, buildSteamAuthUrl(userId));
}

// POST /connect/start — returns the Steam OpenID URL as JSON so the client can
// navigate without exposing the Clerk JWT in the URL bar / proxy logs (Task 4).
export async function connectStart(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  return res.json({ url: buildSteamAuthUrl(userId) });
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

/**
 * POST /steam/inventory/resync
 *
 * Re-fetches the user's Steam inventory and reconciles it against the
 * Portfolio rows that originated from a previous Steam import.
 *
 * Semantics (v1 — skin-level, not per-row-amount):
 *   1. For each skinId in Steam that has NO active (removedFromSteamAt = null)
 *      imported Portfolio row → create a fresh row with importedFromSteamAt
 *      = now (cost basis = null; user can backfill later).
 *   2. For each skinId on an active imported Portfolio row that is NO LONGER
 *      in the Steam inventory → flag those rows removedFromSteamAt = now.
 *
 * Manual (non-imported) rows are NEVER touched, regardless of overlap.
 * History is preserved — we never delete portfolio rows.
 */
export async function resync(req, res, {
  prismaClient = defaultPrisma,
  fetchInventoryImpl = fetchInventory,
  matchInventoryImpl = matchInventory,
} = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { steamId: true },
  });
  if (!user?.steamId) {
    return res.status(400).json({ error: 'Steam account not connected' });
  }

  try {
    const items = await fetchInventoryImpl(user.steamId);
    const matchResult = await matchInventoryImpl(items, { prismaClient });

    const steamSkinIds = new Set(
      matchResult.matched
        .filter((m) => m.kind === 'skin' && m.skinId != null)
        .map((m) => m.skinId)
    );

    // Active rows = imported from Steam AND not already flagged removed.
    const activeRows = await prismaClient.portfolio.findMany({
      where: {
        userId,
        importedFromSteamAt: { not: null },
        removedFromSteamAt: null,
      },
      select: { id: true, skinId: true },
    });

    const activeSkinIds = new Set(activeRows.map((r) => r.skinId).filter(Boolean));
    const now = new Date();

    // 1. Add rows for newly-present Steam skins.
    let added = 0;
    for (const m of matchResult.matched) {
      if (m.kind !== 'skin' || m.skinId == null) continue;
      if (activeSkinIds.has(m.skinId)) continue;
      await prismaClient.portfolio.create({
        data: {
          userId,
          skinId: m.skinId,
          amount: m.amount,
          buyPrice: null,
          buyDate: now,
          importedFromSteamAt: now,
        },
      });
      added++;
    }

    // 2. Flag rows for skins no longer in Steam.
    const idsToRemove = activeRows
      .filter((r) => r.skinId != null && !steamSkinIds.has(r.skinId))
      .map((r) => r.id);
    let removed = 0;
    if (idsToRemove.length) {
      const result = await prismaClient.portfolio.updateMany({
        where: { id: { in: idsToRemove } },
        data: { removedFromSteamAt: now },
      });
      removed = result.count;
    }

    return res.json({
      added,
      removed,
      totals: {
        steamSkins: steamSkinIds.size,
        activeImported: activeRows.length,
      },
    });
  } catch (err) {
    logger.error('Steam resync failed', { userId, error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
