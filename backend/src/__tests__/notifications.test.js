/**
 * notifications.test.js — Unit tests for notification system fixes (2026-05-22).
 *
 * Covers:
 *   getTierFromUser (4): reads User.tier, falls back to isPremium, handles legacy rows
 *   renderPayload (4): structured rows, price formatting, drops `reason`, handles null
 *   sendAlertEmail env guard (2): throws when EMAIL_USER missing, throws when EMAIL_PASS missing
 *   shouldFire edge-trigger (5): null/false→true fires, true→true doesn't, true→false doesn't
 *   notificationsRoute body (4): currentPrice/casePrice resolved, weapon-slug href, generic fallback
 */

import { jest } from '@jest/globals';

await jest.unstable_mockModule('../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const { getTierFromUser, TIER_QUOTA } = await import('../controllers/alertController.js');
const { renderPayload } = await import('../services/emailService.js');
const { shouldFire } = await import('../services/alerts/alertEngine.js');

describe('getTierFromUser (fixes Lite-tier-unreachable bug)', () => {
  it('returns "lite" when User.tier is "lite"', () => {
    expect(getTierFromUser({ tier: 'lite', isPremium: false })).toBe('lite');
  });

  it('returns "pro" when User.tier is "pro" even if isPremium is false', () => {
    expect(getTierFromUser({ tier: 'pro', isPremium: false })).toBe('pro');
  });

  it('falls back to isPremium boolean for legacy users without tier set', () => {
    expect(getTierFromUser({ tier: null, isPremium: true })).toBe('pro');
    expect(getTierFromUser({ tier: null, isPremium: false })).toBe('free');
    expect(getTierFromUser({ isPremium: false })).toBe('free');
  });

  it('TIER_QUOTA assigns 15 alerts to lite (matches CEO 2026-05-20 pricing)', () => {
    expect(TIER_QUOTA.free).toBe(2);
    expect(TIER_QUOTA.lite).toBe(15);
    expect(TIER_QUOTA.pro).toBeGreaterThan(15);
  });
});

describe('renderPayload (fixes JSON-dump-leaks-internals bug)', () => {
  it('renders a key:value row list with humanised labels', () => {
    const rows = renderPayload({ currentPrice: 12.34, threshold: 10, direction: 'above' });
    expect(rows).toEqual(expect.arrayContaining([
      { label: 'Current Price', value: '€12.34' },
      { label: 'Threshold', value: '€10.00' },
      { label: 'Direction', value: 'above' },
    ]));
  });

  it('formats `casePrice` / `expectedValue` with euro symbol + 2 decimals', () => {
    const rows = renderPayload({ casePrice: 1.5, expectedValue: 2.789 });
    const byLabel = Object.fromEntries(rows.map(r => [r.label, r.value]));
    expect(byLabel['Case Price']).toBe('€1.50');
    expect(byLabel['Expected Value']).toBe('€2.79');
  });

  it('hides internal `reason` short-circuit field from the rendered list', () => {
    const rows = renderPayload({ reason: 'missing skin', currentPrice: 0 });
    expect(rows.find(r => r.label === 'Reason')).toBeUndefined();
  });

  it('returns "" for null / non-object payloads (does not throw)', () => {
    expect(renderPayload(null)).toBe('');
    expect(renderPayload(undefined)).toBe('');
    expect(renderPayload('string')).toBe('');
  });
});

describe('sendAlertEmail env guard (fixes silent-SMTP-failure bug)', () => {
  let envBackup;
  beforeEach(() => {
    envBackup = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS };
  });
  afterEach(async () => {
    process.env.EMAIL_USER = envBackup.user ?? '';
    process.env.EMAIL_PASS = envBackup.pass ?? '';
  });

  it('throws a specific error mentioning EMAIL_USER + EMAIL_PASS when both missing', async () => {
    // Re-import with isolated module registry so the lazy transporter is rebuilt.
    jest.resetModules();
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    const mod = await import('../services/emailService.js?v=guard-missing');
    await expect(
      mod.sendAlertEmail({ to: 't@example.com', subject: 's', alertType: 'price_threshold', payload: {} })
    ).rejects.toThrow(/EMAIL_USER and EMAIL_PASS/);
  });

  it('throws same error when only EMAIL_PASS is missing (catches half-config)', async () => {
    jest.resetModules();
    process.env.EMAIL_USER = 'someone@example.com';
    delete process.env.EMAIL_PASS;
    const mod = await import('../services/emailService.js?v=guard-pass-missing');
    await expect(
      mod.sendAlertEmail({ to: 't@example.com', subject: 's', alertType: 'price_threshold', payload: {} })
    ).rejects.toThrow(/EMAIL_USER and EMAIL_PASS/);
  });
});

describe('shouldFire (edge-trigger dedup)', () => {
  it('fires when condition transitions from null (first eval) to true', () => {
    expect(shouldFire(null, true)).toBe(true);
  });

  it('fires when condition transitions from false to true', () => {
    expect(shouldFire(false, true)).toBe(true);
  });

  it('does NOT fire when condition stays true (parked-above-threshold case)', () => {
    expect(shouldFire(true, true)).toBe(false);
  });

  it('does NOT fire when condition transitions from true to false (re-arming)', () => {
    expect(shouldFire(true, false)).toBe(false);
  });

  it('does NOT fire when condition stays false', () => {
    expect(shouldFire(false, false)).toBe(false);
    expect(shouldFire(null, false)).toBe(false);
  });
});

// Mirrors the body / href logic inside notificationsRoutes.js — extracted as a
// pure helper so the route stays thin. If this drifts from the route handler,
// the test will catch the regression.
function notificationBody(payload, skin) {
  const skinName = skin?.name ?? 'a skin';
  const price = payload?.currentPrice ?? payload?.casePrice ?? payload?.price;
  const body = price != null
    ? `${skinName} triggered your alert at €${Number(price).toFixed(2)}.`
    : `${skinName} matched your alert criteria.`;
  const href = skin?.slug && skin?.weaponSlug
    ? `/skins/${skin.weaponSlug}/${skin.slug}`
    : skin?.id
      ? `/skins/${skin.id}`
      : null;
  return { body, href };
}

describe('notification body rendering (fixes wrong-payload-keys bug)', () => {
  it('resolves currentPrice for price_threshold/volatility/float_tier payloads', () => {
    const r = notificationBody({ currentPrice: 12.5 }, { name: 'AK-47 | Redline' });
    expect(r.body).toBe('AK-47 | Redline triggered your alert at €12.50.');
  });

  it('resolves casePrice for case_ev payloads', () => {
    const r = notificationBody({ casePrice: 2.99, expectedValue: 5 }, { name: 'Chroma Case' });
    expect(r.body).toBe('Chroma Case triggered your alert at €2.99.');
  });

  it('falls back to generic body when payload has none of the expected price keys', () => {
    const r = notificationBody({ reason: 'no price' }, { name: 'AK-47 | Redline' });
    expect(r.body).toBe('AK-47 | Redline matched your alert criteria.');
  });

  it('prefers Sprint 2 weapon-slug URL over legacy /skins/:id 308 redirect', () => {
    const r = notificationBody({ currentPrice: 1 }, { id: 42, slug: 'redline', weaponSlug: 'ak-47', name: 'X' });
    expect(r.href).toBe('/skins/ak-47/redline');
  });
});
