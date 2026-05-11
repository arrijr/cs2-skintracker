import { Router } from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import {
  connectRedirect,
  connectCallback,
  disconnect,
  status,
  preview,
  importInventory,
} from '../controllers/steamController.js';

const router = Router();

// /connect/redirect requires Clerk auth (via ?token= in browser redirect)
router.get('/connect/redirect', verifyClerkJwt, (req, res) => connectRedirect(req, res));

// /connect/callback is PUBLIC — Steam redirects browser here; identity is in signed state param
router.get('/connect/callback', (req, res) => connectCallback(req, res));

// Authenticated endpoints
router.use(verifyClerkJwt);
router.delete('/disconnect',       (req, res) => disconnect(req, res));
router.get('/status',              (req, res) => status(req, res));
router.post('/inventory/preview',  (req, res) => preview(req, res));
router.post('/inventory/import',   (req, res) => importInventory(req, res));

export default router;
