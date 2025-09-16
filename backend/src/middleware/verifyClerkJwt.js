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
  throw new Error("Missing required Clerk JWT environment variables");
}

const client = jwksClient({
  jwksUri: CLERK_JWKS_URL,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  timeout: 8000,
});

function getKey(header, cb) {
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

    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        code: "NO_BEARER_TOKEN",
        message: "Authorization header missing or invalid"
      });
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
          if (NODE_ENV !== "production") {
            // ausführliches Debugging nur in DEV
            console.error("[JWT VERIFY] failed:", err?.message, {
              issuer: CLERK_ISSUER,
              audience: CLERK_AUDIENCE,
              errorType: err.name,
            });
          }
          return res.status(401).json({ 
            ok: false, 
            code: "INVALID_JWT", 
            message: err?.message 
          });
        }
        
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
