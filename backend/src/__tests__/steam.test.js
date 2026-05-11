import { describe, it, expect, jest } from '@jest/globals';
import {
  buildAuthRedirectUrl,
  signState,
  verifyState,
  parseSteamIdFromClaimedId,
  STEAM_OPENID_NS,
} from '../services/steam/steamOpenId.js';

describe('steamOpenId — state HMAC', () => {
  it('signs and verifies a payload roundtrip', () => {
    const secret = 'unit-test-secret';
    const payload = { userId: 42, nonce: 'abc' };
    const state = signState(payload, secret);
    expect(typeof state).toBe('string');
    const verified = verifyState(state, secret);
    expect(verified.userId).toBe(42);
    expect(verified.nonce).toBe('abc');
  });

  it('rejects state signed with a different secret', () => {
    const state = signState({ userId: 1 }, 'secret-a');
    expect(() => verifyState(state, 'secret-b')).toThrow();
  });

  it('rejects tampered state', () => {
    const state = signState({ userId: 1 }, 'secret');
    const tampered = state.slice(0, -2) + 'xx';
    expect(() => verifyState(tampered, 'secret')).toThrow();
  });
});

describe('steamOpenId — buildAuthRedirectUrl', () => {
  it('produces a valid Steam OpenID 2.0 URL with required params', () => {
    const url = buildAuthRedirectUrl({
      returnTo: 'https://api.example.com/steam/connect/callback?state=abc',
      realm: 'https://api.example.com/',
    });
    expect(url).toMatch(/^https:\/\/steamcommunity\.com\/openid\/login\?/);
    expect(url).toContain('openid.ns=' + encodeURIComponent(STEAM_OPENID_NS));
    expect(url).toContain('openid.mode=checkid_setup');
    expect(url).toContain('openid.return_to=' + encodeURIComponent('https://api.example.com/steam/connect/callback?state=abc'));
    expect(url).toContain('openid.realm=' + encodeURIComponent('https://api.example.com/'));
    expect(url).toContain('openid.identity=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select'));
    expect(url).toContain('openid.claimed_id=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select'));
  });
});

describe('steamOpenId — parseSteamIdFromClaimedId', () => {
  it('extracts a 17-digit steamId from a valid claimed_id', () => {
    const id = parseSteamIdFromClaimedId('https://steamcommunity.com/openid/id/76561198000000001');
    expect(id).toBe('76561198000000001');
  });

  it('returns null for a non-Steam claimed_id', () => {
    expect(parseSteamIdFromClaimedId('https://example.com/openid/id/123')).toBeNull();
  });

  it('returns null for a malformed steamId', () => {
    expect(parseSteamIdFromClaimedId('https://steamcommunity.com/openid/id/notanumber')).toBeNull();
  });
});
