import { Router } from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import { listAlerts, createAlert, updateAlert, deleteAlert, getAlertEvents } from '../controllers/alertController.js';

const router = Router();

router.use(verifyClerkJwt);
router.get('/', listAlerts);
router.post('/', createAlert);
router.patch('/:id', updateAlert);
router.delete('/:id', deleteAlert);
router.get('/:id/events', getAlertEvents);

export default router;
