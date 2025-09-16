// backend/src/middleware/verifyClerkJwt.js — [Backend]
// {/* JWT-Verifikation für Clerk Tokens mit JWKS */}
import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";

const {
  CLERK_JWKS_URL,
  CLERK_ISSUER,
  CLERK_AUDIENCE,
  NODE_ENV,
} = process.env;

// Prüfe ob alle ENV-Variablen gesetzt sind
if (!CLERK_JWKS_URL || !CLERK_ISSUER || !CLERK_AUDIENCE) {
  console.error("[JWT VERIFY] Missing required ENV variables:", {
    CLERK_JWKS_URL: !!CLERK_JWKS_URL,
    CLERK_ISSUER: !!CLERK_ISSUER,
    CLERK_AUDIENCE: !!CLERK_AUDIENCE,
  });
  console.warn("[JWT VERIFY] Continuing without JWT verification - this is NOT secure for production!");
}

const client = CLERK_JWKS_URL ? jwksClient({
  jwksUri: CLERK_JWKS_URL,
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

export function verifyClerkJwt(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    console.log("[JWT VERIFY] Debug info:", {
      hasAuth: !!auth,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20) + "...",
      issuer: CLERK_ISSUER,
      audience: CLERK_AUDIENCE,
      jwksUrl: CLERK_JWKS_URL,
      hasClient: !!client
    });

    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: "NO_BEARER_TOKEN",
        message: "Authorization header missing or invalid"
      });
    }

    // Skip JWT verification if JWKS is not configured
    if (!client || !CLERK_ISSUER || !CLERK_AUDIENCE) {
      console.warn("[JWT VERIFY] Skipping JWT verification - JWKS not configured");
      // Create a mock payload for testing
      req.clerkJwt = { sub: "test-user", aud: "test-audience", iss: "test-issuer" };
      return next();
    }

    jwt.verify(
      token,
      getKey,
      {
        algorithms: ["RS256"],
        audience: CLERK_AUDIENCE,
        issuer: CLERK_ISSUER,
      },
      (err, payload) => {
        if (err) {
          console.error("[JWT VERIFY] failed:", err?.message, {
            issuer: CLERK_ISSUER,
            audience: CLERK_AUDIENCE,
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
