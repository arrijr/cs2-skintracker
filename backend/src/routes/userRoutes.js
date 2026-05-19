import express from "express";
import { register, login, getProfile, updateProfile, deleteAccount, syncUser, markOnboarded } from "../controllers/userController.js";
import rateLimit from "express-rate-limit";
import { clerkAuth, optionalClerkAuth } from "../middleware/clerkAuth.js";
import { verifyClerkJwt } from "../middleware/verifyClerkJwt.js";
import { getUserRoleFromDB } from "../utils/roleHelpers.js";

const router = express.Router();

// Legacy endpoints (kept for compatibility)
router.post('/register', register);
router.post('/login', login);

// Clerk sync endpoint (for webhook integration)
router.post('/sync', verifyClerkJwt, syncUser);

// Profile endpoints (auth required)
// Use verifyClerkJwt for consistency with /sync and the rest of the API
// (portfolio, watchlist, subscriptions, alerts all use verifyClerkJwt).
// Production: full JWT validation when CLERK_* env vars are set.
// Dev: mock fallback (req.userId=1) when env vars are missing.
// Stricter limiter for irreversible account actions (Task 6).
// 5 requests / hour / user — separate from the general /users sensitiveLimiter.
// Mounted AFTER verifyClerkJwt so we can key by `req.userId` instead of IP,
// otherwise a shared NAT (corp/uni) would hit the limit collectively.
const accountChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: "Too many account changes; try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.userId ? `user:${req.userId}` : req.ip),
});

router.get("/me", verifyClerkJwt, getProfile);
router.patch("/me", verifyClerkJwt, updateProfile);
// First-sign-in onboarding flow — stamp completion timestamp. Idempotent.
router.post("/me/onboarded", verifyClerkJwt, markOnboarded);
// /me/password removed (Task 2) — Clerk owns password management.
router.delete("/me", verifyClerkJwt, accountChangeLimiter, deleteAccount);

// Role endpoint for frontend role checks
router.get("/me/role", verifyClerkJwt, async (req, res) => {
  try {
    // Debug: Log request types and auth info
    console.log('🔍 [DEBUG] Role endpoint called');
    console.log('🔍 [DEBUG] req.auth type:', typeof req.auth);
    console.log('🔍 [DEBUG] req.auth keys:', req.auth ? Object.keys(req.auth) : 'null');
    console.log('🔍 [DEBUG] req.user type:', typeof req.user);
    console.log('🔍 [DEBUG] req.userId type:', typeof req.userId);
    
    const clerkUserId = req.auth?.userId || req.userId;
    
    if (!clerkUserId) {
      console.log('❌ [DEBUG] No clerkUserId found');
      return res.status(401).json({ 
        error: 'Authentication required',
        debug: {
          hasAuth: !!req.auth,
          hasUser: !!req.user,
          hasUserId: !!req.userId,
          authKeys: req.auth ? Object.keys(req.auth) : null
        }
      });
    }
    
    console.log('✅ [DEBUG] clerkUserId found:', clerkUserId);
    const userRole = await getUserRoleFromDB(clerkUserId);
    console.log('✅ [DEBUG] userRole from DB:', userRole);
    
    res.json({
      success: true,
      role: userRole.role,
      email: userRole.email,
      isAdmin: userRole.isAdmin,
      isUser: userRole.isUser,
      debug: {
        clerkUserId,
        authType: typeof req.auth,
        userType: typeof req.user
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error getting user role:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user role',
      debug: {
        errorType: typeof error,
        errorMessage: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

export default router;
