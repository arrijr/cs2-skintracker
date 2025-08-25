import express from "express";
import { register, login, getProfile, updateProfile, deleteAccount, changePassword } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Profile endpoints (auth required)
router.get("/me", authMiddleware, getProfile);
router.patch("/me", authMiddleware, updateProfile);
router.patch("/me/password", authMiddleware, changePassword);
router.delete("/me", authMiddleware, deleteAccount);

export default router;
