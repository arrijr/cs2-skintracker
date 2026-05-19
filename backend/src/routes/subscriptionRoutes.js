/**
 * Subscription Routes
 * Sprint 2: Handle Stripe checkout sessions and webhook events
 */

import express from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import {
  createCheckoutSession,
  handleWebhook,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  createCustomerPortalSession
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Public routes (with auth)
router.post('/checkout', verifyClerkJwt, createCheckoutSession);
router.get('/status', verifyClerkJwt, getSubscription);
router.post('/cancel', verifyClerkJwt, cancelSubscription);
router.post('/reactivate', verifyClerkJwt, reactivateSubscription);
router.post('/portal', verifyClerkJwt, createCustomerPortalSession);

// Webhook (no auth - verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
