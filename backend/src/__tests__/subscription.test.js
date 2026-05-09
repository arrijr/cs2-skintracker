/**
 * Subscription Service & Controller Tests
 * Sprint 2: Stripe integration, tier gating, webhook handling
 */

import subscriptionService from '../services/subscriptionService.js';
import prisma from '../prisma/prismaClient.js';
import request from 'supertest';
import app from '../app.js';
import { verifyToken } from '@clerk/backend';
import Stripe from 'stripe';

jest.mock('@clerk/backend');
jest.mock('stripe');

describe('Subscription Service', () => {
  let testUserId = 'test-user-123';

  beforeEach(async () => {
    // Clean up
    await prisma.userSubscriptions.deleteMany({ where: {} });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getOrCreateSubscription', () => {
    test('Creates new subscription for user', async () => {
      const sub = await subscriptionService.getOrCreateSubscription(testUserId);

      expect(sub).toBeDefined();
      expect(sub.userId).toBe(testUserId);
      expect(sub.tier).toBe('free');
      expect(sub.status).toBe('inactive');
    });

    test('Returns existing subscription on second call', async () => {
      const sub1 = await subscriptionService.getOrCreateSubscription(testUserId);
      const sub2 = await subscriptionService.getOrCreateSubscription(testUserId);

      expect(sub1.id).toBe(sub2.id);
    });
  });

  describe('checkTier', () => {
    test('Free user cannot access creator features', async () => {
      await subscriptionService.getOrCreateSubscription(testUserId);

      const hasAccess = await subscriptionService.checkTier(testUserId, 'creator');
      expect(hasAccess).toBe(false);
    });

    test('Creator user can access creator features', async () => {
      await subscriptionService.getOrCreateSubscription(testUserId);
      await subscriptionService.updateSubscriptionStatus(testUserId, 'creator', 'active');

      const hasAccess = await subscriptionService.checkTier(testUserId, 'creator');
      expect(hasAccess).toBe(true);
    });

    test('Pro user can access all features', async () => {
      await subscriptionService.getOrCreateSubscription(testUserId);
      await subscriptionService.updateSubscriptionStatus(testUserId, 'pro', 'active');

      const canAccessCreator = await subscriptionService.checkTier(testUserId, 'creator');
      const canAccessPro = await subscriptionService.checkTier(testUserId, 'pro');

      expect(canAccessCreator).toBe(true);
      expect(canAccessPro).toBe(true);
    });
  });

  describe('updateSubscriptionFromStripe', () => {
    test('Updates subscription with Stripe data', async () => {
      await subscriptionService.getOrCreateSubscription(testUserId);

      const stripeSubscription = {
        id: 'sub_stripe123',
        customer: 'cus_stripe456',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        metadata: {
          userId: testUserId,
          tier: 'creator'
        }
      };

      await subscriptionService.updateSubscriptionFromStripe(stripeSubscription);

      const updated = await prisma.userSubscriptions.findUnique({
        where: { userId: testUserId }
      });

      expect(updated.tier).toBe('creator');
      expect(updated.status).toBe('active');
      expect(updated.stripeSubId).toBe('sub_stripe123');
      expect(updated.stripeCustomerId).toBe('cus_stripe456');
    });
  });

  describe('getTierFeatures', () => {
    test('Returns correct features for free tier', () => {
      const features = subscriptionService.getTierFeatures('free');

      expect(features.canCreatePortfolio).toBe(true);
      expect(features.canAccessResearch).toBe(false);
      expect(features.canExportCSV).toBe(false);
    });

    test('Returns correct features for creator tier', () => {
      const features = subscriptionService.getTierFeatures('creator');

      expect(features.canCreatePortfolio).toBe(true);
      expect(features.canAccessResearch).toBe(false);
      expect(features.canExportCSV).toBe(false);
      expect(features.priceHistoryDays).toBe(90);
    });

    test('Returns correct features for pro tier', () => {
      const features = subscriptionService.getTierFeatures('pro');

      expect(features.canCreatePortfolio).toBe(true);
      expect(features.canAccessResearch).toBe(true);
      expect(features.canExportCSV).toBe(true);
      expect(features.priceHistoryDays).toBe(180);
    });
  });
});

describe('Subscription Controller', () => {
  beforeEach(async () => {
    await prisma.userSubscriptions.deleteMany({ where: {} });
    verifyToken.mockResolvedValue({
      sub: 'test-user-123',
      email: 'test@example.com',
      sid: 'session-123'
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /subscriptions/status', () => {
    test('Returns subscription status for authenticated user', async () => {
      // Pre-create subscription
      await subscriptionService.getOrCreateSubscription('test-user-123');

      const response = await request(app)
        .get('/api/v1/subscriptions/status')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tier', 'free');
      expect(response.body).toHaveProperty('status', 'inactive');
      expect(response.body).toHaveProperty('canCreatePortfolio');
      expect(response.body).toHaveProperty('canAccessResearch');
    });

    test('Returns 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/subscriptions/status');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /subscriptions/checkout', () => {
    test('Returns 400 for invalid tier', async () => {
      const response = await request(app)
        .post('/api/v1/subscriptions/checkout')
        .set('Authorization', 'Bearer test-token')
        .send({ tier: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('Requires authentication', async () => {
      const response = await request(app)
        .post('/api/v1/subscriptions/checkout')
        .send({ tier: 'creator' });

      expect(response.status).toBe(401);
    });
  });
});
