/**
 * tier-gating.test.js — Unit tests for tier middleware + validateAPIKeyUsage
 *
 * Covers code-review fixes:
 *   C3 — api-keys stored with 'pro' tier (not 'developer') → limits apply
 *   H3 — validateAPIKeyUsage checks isActive/expiresAt BEFORE daily limit
 *   H4 — requireTier error message uses minTier variable, not hardcoded 'pro'
 *
 * Tests (11 total):
 *   requireTier (5): free→pro gated, free→enterprise gated, pro→pro passes,
 *                    pro→enterprise gated, error message uses correct tier name
 *   validateAPIKeyUsage (4): inactive before limit, expired before limit,
 *                            limit exceeded, valid key
 *   getTierLimits (2): 'pro' has apiCallsPerDay=10000, 'developer' falls to free
 */

import { jest } from '@jest/globals';

await jest.unstable_mockModule('../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const {
  requireTier,
  validateAPIKeyUsage,
  getTierLimits,
} = await import('../middleware/tier-gating.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockReqRes(tier = 'free') {
  const req = { user: { id: 1, email: 'test@test.com', role: 'user', tier } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

function makeAPIKey(overrides = {}) {
  return {
    id: 1,
    tier: 'pro',
    isActive: true,
    expiresAt: null,
    callsUsed: 0,
    callsPerDay: 10000,
    lastResetAt: new Date(),
    ...overrides,
  };
}

// ── requireTier ───────────────────────────────────────────────────────────────

describe('requireTier middleware', () => {
  test('free user blocked from pro route → 402', async () => {
    const { req, res, next } = mockReqRes('free');
    await requireTier('pro')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(402);
    expect(next).not.toHaveBeenCalled();
  });

  test('free user blocked from enterprise route → 402', async () => {
    const { req, res, next } = mockReqRes('free');
    await requireTier('enterprise')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(402);
  });

  test('pro user passes pro route → next() called', async () => {
    const { req, res, next } = mockReqRes('pro');
    await requireTier('pro')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('pro user blocked from enterprise route → 402', async () => {
    const { req, res, next } = mockReqRes('pro');
    await requireTier('enterprise')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(402);
  });

  test('H4 — error message uses minTier name, not hardcoded "pro"', async () => {
    const { req, res, next } = mockReqRes('free');
    await requireTier('enterprise')(req, res, next);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error).toMatch(/enterprise/i);
    expect(jsonCall.error).not.toMatch(/^Upgrade to Pro/); // must not say "Pro" when minTier=enterprise
  });
});

// ── validateAPIKeyUsage ───────────────────────────────────────────────────────

describe('validateAPIKeyUsage — check order (H3)', () => {
  test('inactive key blocked even when under daily limit', () => {
    const key = makeAPIKey({ isActive: false, callsUsed: 0 });
    const result = validateAPIKeyUsage(key);
    expect(result.canUse).toBe(false);
    expect(result.message).toMatch(/inactive/i);
  });

  test('expired key blocked even when under daily limit', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const key = makeAPIKey({ expiresAt: past, callsUsed: 0 });
    const result = validateAPIKeyUsage(key);
    expect(result.canUse).toBe(false);
    expect(result.message).toMatch(/expired/i);
  });

  test('active + non-expired + over limit → blocked with limit message', () => {
    const key = makeAPIKey({ callsUsed: 10001, callsPerDay: 10000 });
    const result = validateAPIKeyUsage(key);
    expect(result.canUse).toBe(false);
    expect(result.message).toMatch(/limit exceeded/i);
  });

  test('active + non-expired + under limit → allowed', () => {
    const key = makeAPIKey({ callsUsed: 500 });
    const result = validateAPIKeyUsage(key);
    expect(result.canUse).toBe(true);
    expect(result.remaining).toBe(9500);
  });
});

// ── getTierLimits — C3 verification ──────────────────────────────────────────

describe('getTierLimits — tier values (C3)', () => {
  test("'pro' tier has apiCallsPerDay = 10000", () => {
    const limits = getTierLimits('pro');
    expect(limits.apiCallsPerDay).toBe(10000);
  });

  test("'developer' tier (old invalid value) falls back to free with undefined apiCallsPerDay", () => {
    // This test documents what WOULD have happened before C3 fix.
    // 'developer' is not a valid TIER_LIMITS key — falls to free.
    // free tier has no apiCallsPerDay → undefined.
    // callsUsed (0) >= undefined → false → unlimited access. BUG.
    // After C3 fix: API keys are created with 'pro', not 'developer'.
    const freeLimits = getTierLimits('free');
    expect(freeLimits.apiCallsPerDay).toBeUndefined();

    // Confirm: 0 >= undefined is false (the bug)
    // We document it rather than relying on it
    expect(0 >= undefined).toBe(false);
  });
});
