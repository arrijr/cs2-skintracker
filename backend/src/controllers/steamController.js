import crypto from 'crypto';
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

// SECURITY (2026-05-22 audit, finding #2): Steam OpenID state secret used a
// public hardcoded fallback ('dev-state-secret-replace-in-prod'). If
// STEAM_OPENID_STATE_SECRET was missing in prod (still TODO on CEO checklist
// §5b at audit time), an attacker could forge a `state` JWT with arbitrary
// `userId`, complete the Steam OpenID round-trip themselves, and have
// `connectCallback` write THEIR steamId onto the victim's account — full
// account-takeover of the Steam link and enables inventory exfiltration via
// `/inventory/preview`.
//
// New behaviour:
//   - production:   throw at module load if env var is missing (fail closed)
//   - non-prod:     log loud warning + use random per-process fallback so
//                   forged state JWTs can't survive a restart and devs
//                   can't accidentally ship the same predictable secret
// SECURITY: previously this threw at module load when STEAM_OPENID_STATE_SECRET
// was missing in production. That brought down the entire backend (verified
// 2026-05-22: env-var injection on Render is flaky and the throw kept
// triggering even after the env was set service-level). The crash blocked
// EVERY page (portfolio, dashboard, profile, items) — a 5-minute Steam
// account-takeover risk became a multi-hour outage of every authed feature.
//
// Compromise: don't crash. ALWAYS generate a per-process random fallback if
// the env var is missing. Log a loud WARN so it shows in Render logs without
// killing the process. Existing in-flight Steam state JWTs invalidate on
// each restart (user would need to retry the connect flow) but no
// account-takeover is possible because the secret isn't predictable.
//
// The original audit finding remains valid — fix it by SETTING the env var
// reliably, not by re-enabling the fail-closed throw. Tracker: CEO checklist
// §5b "STEAM_OPENID_STATE_SECRET required in prod".
// NOTE: `crypto` is already imported at the top of this file (line 1,
// `import crypto from 'crypto'`). Do NOT re-import it here — a second
// `import crypto from 'node:crypto'` is a duplicate identifier and crashes
// the whole backend at boot with "Identifier 'crypto' has already been
// declared" (took down prod 2026-05-31).
const ENV_STATE_SECRET = process.env.STEAM_OPENID_STATE_SECRET;
if (!ENV_STATE_SECRET) {
  const where = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'dev';
  console.warn(
    `[steam] ⚠️  STEAM_OPENID_STATE_SECRET unset in ${where} — using random per-process fallback. ` +
      'Steam OpenID state JWTs invalidate on every restart. Set this env var to a stable 32-byte hex string ' +
      'to make sessions survive restarts. No account-takeover risk (the random fallback is unpredictable).'
  );
}
const STATE_SECRET =
  ENV_STATE_SECRET || `auto-${crypto.randomBytes(32).toString('hex')}`;

// Frontend paths the post-connect redirect is allowed to land on. Anything
// not on this list collapses to the safe default. Prevents open-redirect
// abuse where a malicious link starts the Steam flow with `returnTo=
// https://evil.com/?steam=connected` and exfiltrates the success state.
const SAFE_RETURN_PATHS = ['/account', '/profile', '/onboarding', '/dashboard'];

function isSafeReturnPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  const base = path.split('?')[0].split('#')[0];
  return SAFE_RETURN_PATHS.some((p) => base === p || base.startsWith(`${p}/`) || base.startsWith(`${p}?`));
}

function buildSteamAuthUrl(userId, requestedReturnPath) {
  // Bake the desired post-callback redirect path into the signed state JWT
  // so a stateless flow can recover it after the Steam round-trip.
  const safeReturn = isSafeReturnPath(requestedReturnPath) ? requestedReturnPath : '/account';
  const state = signState({ userId, returnPath: safeReturn, ts: Date.now() }, STATE_SECRET);
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
  const requestedReturn = typeof req.query.returnPath === 'string' ? req.query.returnPath : undefined;
  return res.redirect(302, buildSteamAuthUrl(userId, requestedReturn));
}

// POST /connect/start — returns the Steam OpenID URL as JSON so the client can
// navigate without exposing the Clerk JWT in the URL bar / proxy logs (Task 4).
// Caller may pass `returnPath` in the body to control where the success
// redirect lands (e.g. `/onboarding?step=2` to keep onboarding flow state).
export async function connectStart(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const requestedReturn = typeof req.body?.returnPath === 'string' ? req.body.returnPath : undefined;
  return res.json({ url: buildSteamAuthUrl(userId, requestedReturn) });
}

export async function connectCallback(req, res, { prismaClient = defaultPrisma, openIdVerify = verifyAuthCallback } = {}) {
  try {
    const state = req.query.state;
    if (!state) throw new Error('missing state');
    const { userId, returnPath } = verifyState(String(state), STATE_SECRET);

    const openidParams = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (k.startsWith('openid.')) openidParams[k] = String(v);
    }

    const steamId = await openIdVerify(openidParams);
    await prismaClient.user.update({
      where: { id: userId },
      data: { steamId, steamConnectedAt: new Date() },
    });

    // Trust returnPath only because it was signed into the state JWT —
    // re-validate against the safe-path list in case the signing rule changes.
    const safeReturn = isSafeReturnPath(returnPath) ? returnPath : '/account';
    const sep = safeReturn.includes('?') ? '&' : '?';
    return res.redirect(302, `${FRONTEND_BASE}${safeReturn}${sep}steam=connected`);
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
  // console.log (not logger) so the line always appears in Render's stdout
  // even when winston rate-limits or DB transport fails.
  console.log('[steamController.preview] start', { userId, steamId: user.steamId });
  const startedAt = Date.now();
  try {
    const items = await fetchInventory(user.steamId);
    const matchStartedAt = Date.now();
    const result = await matchInventory(items, { prismaClient });
    console.log('[steamController.preview] ok', {
      userId,
      items: items.length,
      matched: result.matched.length,
      skipped: result.skipped.length,
      fetchMs: matchStartedAt - startedAt,
      matchMs: Date.now() - matchStartedAt,
    });
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
    const elapsedMs = Date.now() - startedAt;
    // Map upstream Steam failures to clearer HTTP codes so the frontend can
    // show a helpful message instead of a generic "502 Bad Gateway".
    //   private inventory       → 409 Conflict (config issue, user fixable)
    //   Steam rate-limited      → 503 Service Unavailable (transient)
    //   Steam refused / 400/5xx → 502 Bad Gateway (upstream broken)
    let status = 502;
    if (/private/i.test(err.message)) status = 409;
    else if (/rate-limit/i.test(err.message)) status = 503;
    console.error('[steamController.preview] fail', {
      userId,
      steamId: user.steamId,
      status,
      elapsedMs,
      error: err.message,
    });
    logger.error('Steam preview failed', { userId, status, error: err.message });
    return res.status(status).json({ error: err.message });
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
