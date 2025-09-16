import express from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updatePriceAlert
} from "../controllers/watchlistController.js";
import { clerkAuth, optionalClerkAuth } from "../middleware/clerkAuth.js";
import { verifyClerkJwt } from "../middleware/verifyClerkJwt.js";

const router = express.Router();

// Watchlist routes - using real JWT authentication
router.get("/", verifyClerkJwt, getWatchlist);
router.post("/", verifyClerkJwt, addToWatchlist);
router.delete("/:skinId", verifyClerkJwt, removeFromWatchlist);
router.patch("/:skinId", verifyClerkJwt, updatePriceAlert);

export default router;
