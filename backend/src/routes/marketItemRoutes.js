import { Router } from 'express';
import { listMarketItems, getMarketItem } from '../controllers/marketItemController.js';

const router = Router();

router.get('/', (req, res) => listMarketItems(req, res));
router.get('/:id', (req, res) => getMarketItem(req, res));

export default router;
