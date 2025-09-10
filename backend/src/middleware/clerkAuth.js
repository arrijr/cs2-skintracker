// backend/src/middleware/clerkAuth.js — [Backend]
// {/* Clerk JWT Authentication Middleware */}
import { createVerifier } from '@clerk/backend';

// ENV:
// CLERK_ISSUER=https://clerk.skintrackr.io
// CLERK_JWKS_URL=https://clerk.skintrackr.io/.well-known/jwks.json
// (Optional) CLERK_ALLOWED_AUD=skintrackr-backend

const verify = createVerifier({
  issuer: process.env.CLERK_ISSUER,
  jwksUrl: process.env.CLERK_JWKS_URL,
  audience: process.env.CLERK_ALLOWED_AUD ? [process.env.CLERK_ALLOWED_AUD] : undefined,
  clockSkewInMs: 5000,
});

export async function clerkAuth(req, res, next) {
  try {
    const authz = req.headers.authorization ?? '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!token) throw new Error('missing token');

    const payload = await verify(token); // wirft bei Ungültigkeit
    // Claims verfügbar: sub (userId), email, etc.
    req.auth = { userId: payload.sub, email: payload.email };
    return next();
  } catch (e) {
    console.error('Clerk JWT verification failed:', e);
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }
}