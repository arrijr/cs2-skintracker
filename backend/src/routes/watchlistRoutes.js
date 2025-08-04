const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, watchlistController.getWatchlist);
router.post('/', authenticateToken, watchlistController.addToWatchlist);
router.delete('/:skinId', authenticateToken, watchlistController.removeFromWatchlist);
router.patch('/:skinId', authenticateToken, watchlistController.updatePriceAlert);

module.exports = router;
