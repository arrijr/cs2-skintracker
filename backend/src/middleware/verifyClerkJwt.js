// backend/src/middleware/verifyClerkJwt.js — [Backend]
// {/* JWT-Verifikation für Clerk Tokens mit JWKS */}
import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";
import prisma from "../prisma/prismaClient.js";

const {
  CLERK_JWKS_URL,
  CLERK_ISSUER,
  CLERK_AUDIENCE,
  NODE_ENV,
} = process.env;

// Fallback values used when the corresponding env var isn't set at process
// start (we hit a Render env-injection bug where ALLOWED_ORIGINS and these
// fields were undefined even though the env-group listed them).
//
// AUDIENCE history: the brand is `SkinTrackr` (one `e`, no second), domain
// `skintrackr.io`. The Clerk JWT template + Render env were CORRECTLY set
// to `cs2-skintrackr-api-dev` from the start. A previous "fix" mistakenly
// added an extra `e` (`skintracker`) to this fallback constant under the
// belief that `skintracker` was the brand — that introduced the JWT
// audience mismatch that took us 3 hours to diagnose. Reverted 2026-05-22:
// brand is `skintrackr`, fallbacks reflect that, no aliases needed.
const FALLBACK_ISSUER = "https://leading-bug-60.clerk.accounts.dev";
const FALLBACK_JWKS_URL = "https://leading-bug-60.clerk.accounts.dev/.well-known/jwks.json";
const FALLBACK_AUDIENCE = ["cs2-skintrackr-api-dev", "cs2-skintrackr-api"];

// Prüfe ob alle ENV-Variablen gesetzt sind
if (!CLERK_JWKS_URL || !CLERK_ISSUER || !CLERK_AUDIENCE) {
  console.error("[JWT VERIFY] Missing required ENV variables:", {
    CLERK_JWKS_URL: !!CLERK_JWKS_URL,
    CLERK_ISSUER: !!CLERK_ISSUER,
    CLERK_AUDIENCE: !!CLERK_AUDIENCE,
  });
  console.warn("[JWT VERIFY] Continuing without JWT verification - this is NOT secure for production!");
}

const jwksUrl = CLERK_JWKS_URL || FALLBACK_JWKS_URL;
const issuer = CLERK_ISSUER || FALLBACK_ISSUER;
// Accept the env value AND all known transitional spellings — jwt.verify
// matches if the token's `aud` claim equals any string in the array.
const audience = CLERK_AUDIENCE
  ? [CLERK_AUDIENCE, ...FALLBACK_AUDIENCE.filter((a) => a !== CLERK_AUDIENCE)]
  : FALLBACK_AUDIENCE;

const client = jwksUrl ? jwksClient({
  jwksUri: jwksUrl,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  timeout: 8000,
}) : null;

function getKey(header, cb) {
  if (!client) {
    return cb(new Error("JWKS client not configured"));
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err);
    const signingKey = key.getPublicKey();
    cb(null, signingKey);
  });
}

export async function verifyClerkJwt(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    // Note: previously also accepted `?token=` query param so the GET-redirect
    // Steam OpenID flow could carry the JWT in the URL. That route is now
    // legacy (POST /connect/start replaces it) and putting JWTs in query
    // strings leaks them into Render/Vercel/Sentry logs, browser history,
    // referer headers. Header-only from here on.

    if (process.env.NODE_ENV !== 'production') {
      console.log('[JWT VERIFY] Debug info:', {
        hasAuth: !!auth,
        hasToken: !!token,
        tokenLength: token?.length,
        issuer,
        audience,
        jwksUrl,
        hasClient: !!client,
      });
    }

    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: "NO_BEARER_TOKEN",
        message: "Authorization header missing or invalid"
      });
    }

    // Skip JWT verification if JWKS ENV vars are not configured.
    if (!CLERK_JWKS_URL || !CLERK_ISSUER || !CLERK_AUDIENCE) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[AUTH] FATAL: Missing Clerk env vars in production');
        return res.status(500).json({ error: 'Server misconfigured' });
      }
      // Dev fallback: hardcoded userId=1 bypass. EXPLICITLY OPT-IN via env
      // var so missing Clerk config in dev doesn't silently give every
      // request full access to user 1. Set DEV_BYPASS_AUTH=1 in your local
      // .env if you genuinely want this for testing without Clerk.
      if (process.env.DEV_BYPASS_AUTH !== '1') {
        console.error('[JWT VERIFY] Clerk env vars missing and DEV_BYPASS_AUTH not set — rejecting');
        return res.status(401).json({
          ok: false,
          code: 'AUTH_NOT_CONFIGURED',
          message: 'Clerk authentication not configured. Set CLERK_* env vars or DEV_BYPASS_AUTH=1.',
        });
      }
      console.warn("[JWT VERIFY] DEV_BYPASS_AUTH=1 — skipping JWT verification");
      req.clerkJwt = { sub: "test-user", aud: audience, iss: issuer };
      req.userId = 1;
      req.auth = { userId: 1 };
      return next();
    }

    jwt.verify(
      token,
      getKey,
      {
        algorithms: ["RS256"],
        // Audience must match CLERK_AUDIENCE env var exactly (single value).
        // If Clerk JWT template changes, update CLERK_AUDIENCE in Vercel env.
        audience: audience,
        issuer: issuer,
      },
      async (err, payload) => {
        if (err) {
          // Unverified base64-decode of payload so we can see what audience/
          // issuer the JWT actually carries. Helpful when Clerk JWT template
          // and backend CLERK_AUDIENCE drift apart.
          let actualClaims = null;
          try {
            const parts = token?.split('.');
            if (parts?.length === 3) {
              const json = Buffer.from(parts[1], 'base64url').toString('utf-8');
              const p = JSON.parse(json);
              actualClaims = { aud: p.aud, iss: p.iss, sub: p.sub };
            }
          } catch (_) { /* ignore decode errors */ }
          // Do NOT log token bytes. actualClaims is base64-decoded unverified
          // payload — already public metadata in the JWT, safe to log.
          console.error("[JWT VERIFY] failed:", err?.message, {
            expectedIssuer: issuer,
            expectedAudience: audience,
            actualClaims,
            errorType: err.name,
          });
          return res.status(401).json({ 
            ok: false, 
            code: "INVALID_JWT", 
            message: err?.message 
          });
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log("[JWT VERIFY] success:", {
            sub: payload?.sub,
            aud: payload?.aud,
            iss: payload?.iss,
          });
        }

        // Nutzlast für Controller verfügbar machen
        req.clerkJwt = payload;

        // Extract user ID from JWT payload via DB lookup
        const clerkUserId = payload?.sub;
        if (clerkUserId) {
          const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
          if (!user) {
            console.error("[JWT VERIFY] User not found for clerkId");
            return res.status(401).json({ error: 'User not found' });
          }
          req.userId = user.id;
          req.auth = { userId: user.id };
        }

        next();
      }
    );
  } catch (e) {
    console.error("[JWT VERIFY] unexpected error", e);
    return res.status(500).json({ 
      ok: false, 
      code: "JWT_VERIFY_ERROR",
      message: "JWT verification failed"
    });
  }
}
