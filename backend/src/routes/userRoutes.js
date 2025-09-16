import express from "express";
import { register, login, getProfile, updateProfile, deleteAccount, changePassword, syncUser } from "../controllers/userController.js";
import { clerkAuth, optionalClerkAuth } from "../middleware/clerkAuth.js";
import { verifyClerkJwt } from "../middleware/verifyClerkJwt.js";
import { getUserRoleFromDB } from "../utils/roleHelpers.js";

const router = express.Router();

// Legacy endpoints (kept for compatibility)
router.post('/register', register);
router.post('/login', login);

// Clerk sync endpoint (for webhook integration) - temporarily disabled auth
router.post('/sync', (req, res, next) => {
  // Mock user for testing - use integer ID
  req.userId = 1;
  req.auth = { userId: 1 };
  next();
}, syncUser);

// Profile endpoints (auth required)
router.get("/me", clerkAuth, (req, res, next) => {
  console.log('🔍 [DEBUG] GET /me called - req.userId:', req.userId, 'req.auth:', !!req.auth);
  next();
}, getProfile);

router.patch("/me", clerkAuth, (req, res, next) => {
  console.log('🔍 [DEBUG] PATCH /me called - req.userId:', req.userId, 'req.auth:', !!req.auth);
  next();
}, updateProfile);

router.patch("/me/password", clerkAuth, (req, res, next) => {
  console.log('🔍 [DEBUG] PATCH /me/password called - req.userId:', req.userId, 'req.auth:', !!req.auth);
  next();
}, changePassword);

router.delete("/me", clerkAuth, (req, res, next) => {
  console.log('🔍 [DEBUG] DELETE /me called - req.userId:', req.userId, 'req.auth:', !!req.auth);
  next();
}, deleteAccount);

// Role endpoint for frontend role checks
router.get("/me/role", clerkAuth, async (req, res) => {
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
