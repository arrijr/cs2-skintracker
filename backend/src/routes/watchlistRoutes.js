import express from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updatePriceAlert
} from "../controllers/watchlistController.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getWatchlist);
router.post("/", authenticateToken, addToWatchlist);
router.delete("/:skinId", authenticateToken, removeFromWatchlist);
router.patch("/:skinId", authenticateToken, updatePriceAlert);

export default router;
