import express from "express";
import { register, login, getProfile, updateProfile, deleteAccount, changePassword } from "../controllers/userController.js";
import clerkAuth from "../middleware/clerkAuth.js";
import { getUserRoleFromDB } from "../utils/roleHelpers.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Profile endpoints (auth required)
router.get("/me", clerkAuth, getProfile);
router.patch("/me", clerkAuth, updateProfile);
router.patch("/me/password", clerkAuth, changePassword);
router.delete("/me", clerkAuth, deleteAccount);

// Role endpoint for frontend role checks
router.get("/me/role", clerkAuth, async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;
    
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = await getUserRoleFromDB(clerkUserId);
    
    res.json({
      success: true,
      role: userRole.role,
      email: userRole.email,
      isAdmin: userRole.isAdmin,
      isUser: userRole.isUser
    });
  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user role' 
    });
  }
});

export default router;
