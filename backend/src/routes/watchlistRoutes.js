import express from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updatePriceAlert
} from "../controllers/watchlistController.js";
import { clerkAuth, optionalClerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Watchlist routes - temporarily using optional auth for testing
router.get("/", optionalClerkAuth, getWatchlist);
router.post("/", clerkAuth, addToWatchlist);
router.delete("/:skinId", clerkAuth, removeFromWatchlist);
router.patch("/:skinId", clerkAuth, updatePriceAlert);

export default router;
