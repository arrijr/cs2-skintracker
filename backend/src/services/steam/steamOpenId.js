import crypto from 'node:crypto';

export const STEAM_OPENID_NS = 'http://specs.openid.net/auth/2.0';
export const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';

/**
 * Build the Steam OpenID 2.0 redirect URL.
 * The browser is sent here to log in on Steam.
 */
export function buildAuthRedirectUrl({ returnTo, realm }) {
  const params = new URLSearchParams({
    'openid.ns': STEAM_OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

/**
 * Verify a Steam OpenID 2.0 callback by re-posting params to Steam with mode=check_authentication.
 * Returns the steamId on success, throws on failure.
 *
 * `params` is a plain object built from the callback querystring.
 * `fetchImpl` is injectable for tests.
 */
export async function verifyAuthCallback(params, { fetchImpl = fetch } = {}) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(key, value);
  }
  body.set('openid.mode', 'check_authentication');

  const res = await fetchImpl(STEAM_OPENID_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Steam check_authentication HTTP ${res.status}`);
  }

  const text = await res.text();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const map = Object.fromEntries(lines.map(l => {
    const idx = l.indexOf(':');
    return [l.slice(0, idx), l.slice(idx + 1)];
  }));

  if (map.is_valid !== 'true') {
    throw new Error('Steam reports OpenID assertion invalid');
  }

  const steamId = parseSteamIdFromClaimedId(params['openid.claimed_id']);
  if (!steamId) {
    throw new Error('Could not parse steamId from claimed_id');
  }
  return steamId;
}

/** Extract the 17-digit steamId64 from a Steam claimed_id URL. Returns null on failure. */
export function parseSteamIdFromClaimedId(claimedId) {
  if (typeof claimedId !== 'string') return null;
  const m = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  return m ? m[1] : null;
}

/** HMAC-sign a JSON-serializable payload. Returns `<base64url-payload>.<base64url-sig>`. */
export function signState(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/** Verify and decode a state string. Throws on tampering or bad signature. */
export function verifyState(state, secret) {
  if (typeof state !== 'string' || !state.includes('.')) {
    throw new Error('Invalid state format');
  }
  const [data, sig] = state.split('.');
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('State signature mismatch');
  }
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
}
