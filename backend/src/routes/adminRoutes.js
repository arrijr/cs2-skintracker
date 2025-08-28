import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  getAdminOverview,
  getAdminJobs,
  getAdminLogs,
  getAdminHealth
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// ADM-1: Overview KPIs
router.get('/overview', getAdminOverview);

// ADM-2: Jobs Table
router.get('/jobs', getAdminJobs);

// ADM-3: Logs Table
router.get('/logs', getAdminLogs);

// ADM-4: System Health
router.get('/health', getAdminHealth);

export default router;
