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

// Fallback für Development - aus dem Screenshot
const FALLBACK_ISSUER = "https://leading-bug-60.clerk.accounts.dev";
const FALLBACK_JWKS_URL = "https://leading-bug-60.clerk.accounts.dev/.well-known/jwks.json";
const FALLBACK_AUDIENCE = "cs2-skintrackr-api-dev";

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
const audience = CLERK_AUDIENCE || FALLBACK_AUDIENCE;

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
    let token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token && typeof req.query.token === 'string' && req.query.token) {
      token = req.query.token;
    }

    console.log("[JWT VERIFY] Debug info:", {
      hasAuth: !!auth,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + "...",
      issuer: issuer,
      audience: audience,
      jwksUrl: jwksUrl,
      hasClient: !!client
    });

    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: "NO_BEARER_TOKEN",
        message: "Authorization header missing or invalid"
      });
    }

    // Skip JWT verification if JWKS ENV vars are not configured
    if (!CLERK_JWKS_URL || !CLERK_ISSUER || !CLERK_AUDIENCE) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[AUTH] FATAL: Missing Clerk env vars in production');
        return res.status(500).json({ error: 'Server misconfigured' });
      }
      console.warn("[JWT VERIFY] Skipping JWT verification - JWKS not configured");
      // Create a mock payload for testing
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
          console.error("[JWT VERIFY] failed:", err?.message, {
            issuer: issuer,
            audience: audience,
            errorType: err.name,
            tokenStart: token?.substring(0, 20) + "..."
          });
          return res.status(401).json({ 
            ok: false, 
            code: "INVALID_JWT", 
            message: err?.message 
          });
        }
        
        console.log("[JWT VERIFY] success:", {
          sub: payload?.sub,
          aud: payload?.aud,
          iss: payload?.iss
        });
        
        // Nutzlast für Controller verfügbar machen
        req.clerkJwt = payload;
        
        // Extract user ID from JWT payload via DB lookup
        const clerkUserId = payload?.sub;
        if (clerkUserId) {
          const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
          if (!user) {
            console.error("[JWT VERIFY] User not found for clerkId:", clerkUserId);
            return res.status(401).json({ error: 'User not found' });
          }
          req.userId = user.id;
          req.auth = { userId: user.id };
          console.log("[JWT VERIFY] Resolved userId:", req.userId, "for clerk:", clerkUserId);
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
