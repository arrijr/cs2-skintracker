// backend/src/middleware/clerkAuth.js
import { verifyToken } from '@clerk/backend';

export async function clerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const payload = await verifyToken(token, {
      issuer: process.env.CLERK_ISSUER,           // z.B. https://clerk.skintrackr.io
      jwksUrl: process.env.CLERK_JWKS_URL,        // z.B. https://clerk.skintrackr.io/.well-known/jwks.json
      audience: process.env.CLERK_ALLOWED_AUD,    // MUSS mit deinem JWT-Template-Audience matchen
      clockSkewInMs: 5000,
    });

    req.auth = {
      userId: payload.sub,
      email: payload.email,
      sid: payload.sid,
    };

    return next();
  } catch (err) {
    console.error('[clerkAuth] verify failed:', err?.message || err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalClerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      // No token provided, continue without auth
      req.auth = null;
      return next();
    }

    const payload = await verifyToken(token, {
      issuer: process.env.CLERK_ISSUER,
      jwksUrl: process.env.CLERK_JWKS_URL,
      audience: process.env.CLERK_ALLOWED_AUD,
      clockSkewInMs: 5000,
    });

    req.auth = {
      userId: payload.sub,
      email: payload.email,
      sid: payload.sid,
    };

    return next();
  } catch (err) {
    console.error('[optionalClerkAuth] verify failed:', err?.message || err);
    // Optional auth failed, continue without auth
    req.auth = null;
    return next();
  }
}