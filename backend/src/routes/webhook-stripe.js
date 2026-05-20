/**
 * ⚠️ LEGACY — NOT MOUNTED ⚠️
 *
 * This router targets the OLD Stripe-price-ID schema and is not
 * registered in `app.js`. The active webhook handler is
 * `subscriptionController.handleWebhook` mounted at
 * `/api/v1/subscriptions/webhook`.
 *
 * Kept only for historical reference; remove after Sprint 1.
 *
 * If you re-mount this you will break the new {tier × cycle} pricing
 * matrix because this handler still reads `STRIPE_PRICE_PRO_ID`.
 */

import express from 'express';
import * as stripeService from '../services/stripe-service.js';
import prisma from '../../prisma/prismaClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Stripe webhooks require raw body (not JSON parsed)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'No signature provided' });
    }

    // Process webhook event
    const eventData = await stripeService.handleWebhookEvent(
      req.body,
      signature
    );

    if (!eventData) {
      // Unhandled event type - still return 200 to acknowledge
      return res.status(200).json({ received: true, unhandled: true });
    }

    // Update database based on event type
    await updateUserBasedOnWebhook(eventData);

    res.status(200).json({ received: true, processed: true });
  } catch (error) {
    logger.error('Webhook processing error', {
      error: error.message,
      body: req.body?.toString().substring(0, 100)
    });

    // Always return 200 to Stripe, even on error
    // Stripe will retry non-200 responses
    res.status(200).json({ received: true });
  }
});

/**
 * Update user data based on Stripe webhook event
 * @private
 */
async function updateUserBasedOnWebhook(eventData) {
  const { userId, stripeCustomerId, stripeSubscriptionId, tier, event } = eventData;

  logger.info('Updating user from webhook', {
    userId,
    event,
    tier
  });

  if (!userId) {
    logger.warn('Webhook missing userId', { event });
    return;
  }

  switch (event) {
    case 'checkout.session.completed':
    case 'subscription.created': {
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId,
          stripeSubscriptionId,
          tier: tier || 'pro'
        }
      });
      logger.info('User subscription activated', { userId, tier });
      break;
    }

    case 'subscription.updated': {
      await prisma.user.update({
        where: { id: userId },
        data: { tier: tier || 'pro' }
      });
      logger.info('User tier updated', { userId, tier });
      break;
    }

    case 'subscription.deleted': {
      await prisma.user.update({
        where: { id: userId },
        data: {
          tier: 'free',
          stripeSubscriptionId: null
        }
      });
      logger.info('User subscription cancelled', { userId });
      break;
    }

    case 'payment.succeeded': {
      logger.info('Payment recorded', {
        userId,
        invoiceId: eventData.invoiceId,
        amount: eventData.amountPaid
      });
      break;
    }

    case 'payment.failed': {
      logger.warn('Payment failed - may want to notify user', {
        userId,
        invoiceId: eventData.invoiceId
      });
      break;
    }
  }
}

export default router;
