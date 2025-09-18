// backend/src/routes/caseRoutes.js — [Backend]
// {/* Case Routes - Handle case endpoints */}

import express from "express";
import { getCaseById, getCaseSkins } from "../controllers/caseController.js";
import { optionalClerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Get case by ID
router.get("/:caseId", optionalClerkAuth, getCaseById);

// Get all skins in a case
router.get("/:caseId/skins", optionalClerkAuth, getCaseSkins);

export default router;
