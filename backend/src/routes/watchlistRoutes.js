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
router.post("/", optionalClerkAuth, addToWatchlist);
router.delete("/:skinId", optionalClerkAuth, removeFromWatchlist);
router.patch("/:skinId", optionalClerkAuth, updatePriceAlert);

export default router;
