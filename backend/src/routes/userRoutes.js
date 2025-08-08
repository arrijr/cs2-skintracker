import express from "express";
import { register, login, deleteAccount, changePassword } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.delete("/me", authMiddleware, deleteAccount);
router.patch("/me/password", authMiddleware, changePassword);

export default router;
