import express from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updatePriceAlert
} from "../controllers/watchlistController.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// All watchlist routes require authentication
router.get("/", clerkAuth, getWatchlist);
router.post("/", clerkAuth, addToWatchlist);
router.delete("/:skinId", clerkAuth, removeFromWatchlist);
router.patch("/:skinId", clerkAuth, updatePriceAlert);

export default router;
