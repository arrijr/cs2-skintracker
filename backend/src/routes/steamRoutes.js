import { Router } from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import {
  connectRedirect,
  connectStart,
  connectCallback,
  disconnect,
  status,
  preview,
  importInventory,
  resync,
} from '../controllers/steamController.js';

const router = Router();

// /connect/start (preferred) — POST with Authorization header, returns { url }.
// Frontend navigates client-side so the JWT never appears in URL/proxy logs.
router.post('/connect/start', verifyClerkJwt, (req, res) => connectStart(req, res));

// /connect/redirect (legacy) requires Clerk auth (via ?token= in browser redirect).
// Kept for back-compat; new clients should use POST /connect/start.
router.get('/connect/redirect', verifyClerkJwt, (req, res) => connectRedirect(req, res));

// /connect/callback is PUBLIC — Steam redirects browser here; identity is in signed state param
router.get('/connect/callback', (req, res) => connectCallback(req, res));

// Authenticated endpoints
router.use(verifyClerkJwt);
router.delete('/disconnect',       (req, res) => disconnect(req, res));
router.get('/status',              (req, res) => status(req, res));
router.post('/inventory/preview',  (req, res) => preview(req, res));
router.post('/inventory/import',   (req, res) => importInventory(req, res));
router.post('/inventory/resync',   (req, res) => resync(req, res));

export default router;
