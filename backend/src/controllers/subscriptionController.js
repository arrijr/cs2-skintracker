/**
 * Subscription Controller
 * Sprint 2: Handle Stripe checkout, webhooks, and subscription management
 */

import Stripe from 'stripe';
import prisma from '../prisma/prismaClient.js';
import { subscriptionService } from '../services/subscriptionService.js';
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

// Price ID matrix — keyed by tier × billing cycle. Read lazily so that env
// changes between requests (e.g. Vercel redeploy) are picked up without a
// process restart, and so a missing single env var doesn't kill boot.
const getPriceId = (tier, billingCycle) => {
  const PRICE_IDS = {
    lite: {
      monthly: process.env.STRIPE_PRICE_LITE_MONTHLY,
      annual: process.env.STRIPE_PRICE_LITE_ANNUAL,
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    },
  };
  return PRICE_IDS[tier]?.[billingCycle] ?? null;
};

const envVarName = (tier, billingCycle) =>
  `STRIPE_PRICE_${tier.toUpperCase()}_${billingCycle.toUpperCase()}`;

/**
 * POST /subscriptions/checkout
 * Create a Stripe checkout session for tier upgrade
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { tier, billingCycle: rawBillingCycle } = req.body;

    // Validate inputs
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['lite', 'pro'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Use: lite or pro' });
    }

    // Default billing cycle is monthly so existing callers (e.g. Profile
    // billing tab) that don't pass a cycle keep working.
    const billingCycle = rawBillingCycle ?? 'monthly';
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return res.status(400).json({
        error: 'Invalid billingCycle. Use: monthly or annual',
      });
    }

    // Get or create subscription
    let sub = await subscriptionService.getOrCreateSubscription(userId);
    let customerId = sub.stripeCustomerId;

    // Get price ID from matrix (tier × billing cycle)
    const priceId = getPriceId(tier, billingCycle);

    if (!priceId) {
      const missing = envVarName(tier, billingCycle);
      // Log the precise env var server-side, return a generic message to
      // the client so we don't leak deployment naming convention.
      logger.error('Price ID not configured', { tier, billingCycle, missing });
      return res.status(500).json({
        error: 'Pricing not available. Please contact support.',
      });
    }

    // Create checkout session (customer saved via webhook after payment)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        userId: String(userId),
        tier,
        billingCycle,
      }
    });

    logger.info('Checkout session created', {
      userId,
      tier,
      billingCycle,
      sessionId: session.id
    });

    return res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    logger.error('Failed to create checkout session', {
      userId: req.auth?.userId,
      error: error.message,
      errorType: error.type,
      errorCode: error.code,
    });

    return res.status(500).json({
      error: 'Failed to create checkout session',
      detail: error.message
    });
  }
};

/**
 * GET /subscriptions/status
 * Get current subscription status for authenticated user
 */
export const getSubscription = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const sub = await subscriptionService.getOrCreateSubscription(userId);

    return res.json({
      id: sub.id,
      tier: sub.tier,
      status: sub.status,
      stripeSubId: sub.stripeSubId,
      stripeCustomerId: sub.stripeCustomerId,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      renewalDate: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt,
      canCreatePortfolio: sub.canCreatePortfolio,
      canAccessResearch: sub.canAccessResearch,
      canExportCSV: sub.canExportCSV
    });
  } catch (error) {
    logger.error('Failed to get subscription', {
      userId: req.auth?.userId,
      error: error.message
    });

    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

/**
 * POST /subscriptions/cancel
 * Cancel user's active subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const sub = await subscriptionService.getOrCreateSubscription(userId);

    if (!sub.stripeSubId) {
      return res.status(400).json({
        error: 'No active subscription to cancel'
      });
    }

    if (sub.cancelAtPeriodEnd) {
      return res.status(400).json({
        error: 'Subscription already scheduled to cancel at period end',
      });
    }

    // Cancel at period end (NOT immediate). User keeps access until renewal
    // date and can reactivate before then via /subscriptions/reactivate.
    // Stripe webhook `customer.subscription.updated` will also fire and
    // resync state, but we update DB inline to give the UI immediate
    // feedback without waiting for the webhook round-trip.
    const stripeSub = await stripe.subscriptions.update(sub.stripeSubId, {
      cancel_at_period_end: true,
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        cancelAtPeriodEnd: !!stripeSub.cancel_at_period_end,
        subscriptionStatus: stripeSub.status ?? null,
        currentPeriodEnd: stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000)
          : null,
      },
    });

    const updated = await subscriptionService.getOrCreateSubscription(userId);

    logger.info('Subscription set to cancel at period end', {
      userId,
      stripeSubId: sub.stripeSubId,
      currentPeriodEnd: updated.currentPeriodEnd,
    });

    return res.json({
      message: 'Subscription will cancel at period end',
      subscription: {
        id: updated.id,
        tier: updated.tier,
        status: updated.status,
        stripeSubId: updated.stripeSubId,
        stripeCustomerId: updated.stripeCustomerId,
        currentPeriodStart: updated.currentPeriodStart,
        currentPeriodEnd: updated.currentPeriodEnd,
        renewalDate: updated.currentPeriodEnd,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        canceledAt: updated.canceledAt,
        canCreatePortfolio: updated.canCreatePortfolio,
        canAccessResearch: updated.canAccessResearch,
        canExportCSV: updated.canExportCSV,
      },
    });
  } catch (error) {
    logger.error('Failed to cancel subscription', {
      userId: req.auth?.userId,
      error: error.message
    });

    return res.status(500).json({
      error: 'Failed to cancel subscription'
    });
  }
};

/**
 * POST /subscriptions/reactivate
 * Resume a subscription that was set to cancel at period end.
 * Flips Stripe `cancel_at_period_end` back to false and syncs DB row.
 */
export const reactivateSubscription = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const sub = await subscriptionService.getOrCreateSubscription(userId);

    if (!sub.stripeSubId || !sub.cancelAtPeriodEnd) {
      return res.status(400).json({ error: 'Nothing to reactivate' });
    }

    // Resume in Stripe
    const stripeSub = await stripe.subscriptions.update(sub.stripeSubId, {
      cancel_at_period_end: false,
    });

    // Sync DB. Stripe webhook event metadata may not contain userId on
    // `subscriptions.update` response, so update directly here instead of
    // relying on subscriptionService.updateSubscriptionFromStripe.
    await prisma.user.update({
      where: { id: userId },
      data: {
        cancelAtPeriodEnd: !!stripeSub.cancel_at_period_end,
        subscriptionStatus: stripeSub.status ?? null,
        currentPeriodEnd: stripeSub.current_period_end
          ? new Date(stripeSub.current_period_end * 1000)
          : null,
      },
    });

    const updated = await subscriptionService.getOrCreateSubscription(userId);

    logger.info('Subscription reactivated by user', {
      userId,
      stripeSubId: sub.stripeSubId,
    });

    return res.json({
      message: 'Subscription reactivated',
      subscription: {
        id: updated.id,
        tier: updated.tier,
        status: updated.status,
        stripeSubId: updated.stripeSubId,
        stripeCustomerId: updated.stripeCustomerId,
        currentPeriodStart: updated.currentPeriodStart,
        currentPeriodEnd: updated.currentPeriodEnd,
        renewalDate: updated.currentPeriodEnd,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        canceledAt: updated.canceledAt,
        canCreatePortfolio: updated.canCreatePortfolio,
        canAccessResearch: updated.canAccessResearch,
        canExportCSV: updated.canExportCSV,
      },
    });
  } catch (error) {
    logger.error('Failed to reactivate subscription', {
      userId: req.auth?.userId,
      error: error.message,
    });

    return res.status(500).json({
      error: 'Failed to reactivate subscription',
    });
  }
};

/**
 * POST /subscriptions/portal
 * Create a Stripe Customer Portal session for the authenticated user
 */
export const createCustomerPortalSession = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.status(404).json({ error: 'No Stripe customer for user' });
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?tab=billing`;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    logger.info('Customer Portal session created', { userId });
    return res.json({ url: session.url });
  } catch (error) {
    logger.error('Failed to create customer portal session', {
      userId: req.auth?.userId,
      error: error.message,
    });
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
};

/**
 * POST /subscriptions/webhook
 * Handle Stripe webhook events
 * Events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    logger.warn('Webhook received without signature');
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info('Webhook event received', {
      eventType: event.type,
      eventId: event.id
    });

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        {
          const subscription = event.data.object;
          await subscriptionService.updateSubscriptionFromStripe(subscription);
          break;
        }

      case 'customer.subscription.deleted':
        {
          const subscription = event.data.object;
          await subscriptionService.cancelSubscriptionFromStripe(subscription);
          break;
        }

      case 'invoice.payment_succeeded':
        {
          // Optional: Send email receipt
          logger.info('Invoice payment succeeded', {
            invoiceId: event.data.object.id
          });
          break;
        }

      case 'invoice.payment_failed':
        {
          // Optional: Notify user to update payment method
          logger.warn('Invoice payment failed', {
            invoiceId: event.data.object.id,
            customerId: event.data.object.customer
          });
          break;
        }

      default:
        logger.debug('Unhandled webhook event type', { eventType: event.type });
    }

    // Acknowledge receipt of webhook
    return res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error', {
      error: error.message,
      signature: sig?.substring(0, 20) + '...'
    });

    return res.status(400).json({
      error: `Webhook Error: ${error.message}`
    });
  }
};
