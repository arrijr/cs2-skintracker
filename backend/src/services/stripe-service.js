/**
 * ⚠️ LEGACY — DO NOT IMPORT IN NEW CODE ⚠️
 *
 * This module predates the new pricing matrix (Sprint 0, 2026-05-20)
 * and still references `STRIPE_PRICE_PRO_ID` / `STRIPE_PRICE_ENTERPRISE_ID`
 * which were removed in favour of `STRIPE_PRICE_{LITE,PRO}_{MONTHLY,ANNUAL}`.
 *
 * The CURRENT subscription + webhook flow lives in:
 *   - backend/src/controllers/subscriptionController.js
 *   - backend/src/services/subscriptionService.js
 *
 * This file (and `routes/webhook-stripe.js` which imports it) is NOT
 * mounted in `app.js`. It is kept only as historical reference until
 * Sprint 1 closes; remove entirely after that.
 *
 * If you find yourself importing this file: stop. You probably want
 * `subscriptionController` instead.
 */

import Stripe from 'stripe';
import logger from '../utils/logger.js';

// Lazy-init Stripe client. Avoids crash at module load when STRIPE_SECRET_KEY
// is unset (e.g. dev/staging envs that don't need real Stripe). Throws at
// first actual API call instead — error surfaces in the request, not on boot.
let _stripeInstance = null;
const stripe = new Proxy({}, {
  get(_t, prop) {
    if (!_stripeInstance) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
      _stripeInstance = new Stripe(key);
    }
    return _stripeInstance[prop];
  },
});

// Tier pricing configuration (update in Stripe Dashboard)
const TIER_PRICING = {
  pro: process.env.STRIPE_PRICE_PRO_ID || 'price_pro_xxx',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_ID || 'price_enterprise_xxx'
};

/**
 * Creates a checkout session for a user
 * @param {Object} options
 * @param {number} options.userId - User ID
 * @param {string} options.tierName - Tier name (pro, enterprise)
 * @param {string} options.successUrl - URL after successful payment
 * @param {string} options.cancelUrl - URL if user cancels
 * @returns {Object} Stripe session object with checkout URL
 */
async function createCheckoutSession({ userId, tierName, successUrl, cancelUrl }) {
  try {
    if (!TIER_PRICING[tierName]) {
      throw new Error(`Invalid tier: ${tierName}`);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: TIER_PRICING[tierName],
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(userId), // Link user to session
      metadata: {
        userId,
        tierName,
        timestamp: new Date().toISOString()
      }
    });

    logger.info(`Checkout session created for user ${userId}`, {
      sessionId: session.id,
      tier: tierName
    });

    return session;
  } catch (error) {
    logger.error('Failed to create checkout session', {
      userId,
      tierName,
      error: error.message
    });
    throw error;
  }
}

/**
 * Cancels an active subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Object} Cancelled subscription
 */
async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.del(subscriptionId);

    logger.info('Subscription cancelled', {
      subscriptionId,
      status: subscription.status
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to cancel subscription', {
      subscriptionId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Processes Stripe webhook events
 * @param {string} rawBody - Raw request body from Stripe
 * @param {string} signature - Stripe signature header
 * @returns {Object} Processed event data for database update
 */
async function handleWebhookEvent(rawBody, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info('Webhook event received', {
      eventType: event.type,
      eventId: event.id
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        return handleCheckoutCompleted(event.data.object);
      }

      case 'customer.subscription.created': {
        return handleSubscriptionCreated(event.data.object);
      }

      case 'customer.subscription.updated': {
        return handleSubscriptionUpdated(event.data.object);
      }

      case 'customer.subscription.deleted': {
        return handleSubscriptionDeleted(event.data.object);
      }

      case 'invoice.payment_succeeded': {
        return handlePaymentSucceeded(event.data.object);
      }

      case 'invoice.payment_failed': {
        return handlePaymentFailed(event.data.object);
      }

      default:
        logger.warn(`Unhandled webhook event type: ${event.type}`);
        return null;
    }
  } catch (error) {
    logger.error('Webhook processing failed', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Handle successful checkout
 * @private
 */
async function handleCheckoutCompleted(session) {
  try {
    const { client_reference_id: userId, subscription: subscriptionId } = session;

    logger.info('Checkout completed', {
      userId,
      subscriptionId,
      customerId: session.customer
    });

    // Fetch subscription details to determine tier
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const tierName = priceId
      ? (Object.keys(TIER_PRICING).find(tier => TIER_PRICING[tier] === priceId) || 'pro')
      : 'pro';

    return {
      userId: parseInt(userId),
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscriptionId,
      tier: tierName,
      event: 'checkout.session.completed'
    };
  } catch (error) {
    logger.error('Failed to handle checkout completion', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Handle subscription creation
 * @private
 */
function handleSubscriptionCreated(subscription) {
  logger.info('Subscription created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status
  });

  return {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    event: 'subscription.created'
  };
}

/**
 * Handle subscription update (e.g., tier change)
 * @private
 */
async function handleSubscriptionUpdated(subscription) {
  logger.info('Subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status
  });

  // Extract new tier from subscription
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tierName = priceId
    ? (Object.keys(TIER_PRICING).find(tier => TIER_PRICING[tier] === priceId) || 'pro')
    : 'pro';

  return {
    stripeSubscriptionId: subscription.id,
    tier: tierName,
    event: 'subscription.updated'
  };
}

/**
 * Handle subscription cancellation
 * @private
 */
function handleSubscriptionDeleted(subscription) {
  logger.info('Subscription deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  return {
    stripeSubscriptionId: subscription.id,
    tier: 'free',
    event: 'subscription.deleted'
  };
}

/**
 * Handle successful payment
 * @private
 */
function handlePaymentSucceeded(invoice) {
  logger.info('Payment succeeded', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amount: invoice.amount_paid / 100 // Convert cents to dollars
  });

  return {
    invoiceId: invoice.id,
    stripeCustomerId: invoice.customer,
    amountPaid: invoice.amount_paid,
    event: 'payment.succeeded'
  };
}

/**
 * Handle failed payment
 * @private
 */
function handlePaymentFailed(invoice) {
  logger.warn('Payment failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    reason: invoice.attempted ? 'Charge declined' : 'Webhook received before payment attempt'
  });

  return {
    invoiceId: invoice.id,
    stripeCustomerId: invoice.customer,
    event: 'payment.failed'
  };
}

/**
 * Retrieves customer's current subscription status
 * @param {string} stripeCustomerId - Stripe customer ID
 * @returns {Object} Subscription details or null if no active subscription
 */
async function getActiveSubscription(stripeCustomerId) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const tierName = priceId
      ? (Object.keys(TIER_PRICING).find(tier => TIER_PRICING[tier] === priceId) || 'pro')
      : 'pro';

    return {
      subscriptionId: subscription.id,
      tier: tierName,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    };
  } catch (error) {
    logger.error('Failed to retrieve subscription', {
      stripeCustomerId,
      error: error.message
    });
    return null;
  }
}

export {
  createCheckoutSession,
  cancelSubscription,
  handleWebhookEvent,
  getActiveSubscription
};
