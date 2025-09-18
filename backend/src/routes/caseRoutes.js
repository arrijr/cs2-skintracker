// backend/src/routes/caseRoutes.js — [Backend]
// {/* Case Routes - Handle case/collection endpoints */}

import express from "express";
import { getCases, getCaseById } from "../controllers/caseController.js";
import { optionalClerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Get all available cases/collections
router.get("/", optionalClerkAuth, getCases);

// Get specific case details with all skins
router.get("/:caseId", optionalClerkAuth, getCaseById);

export default router;
