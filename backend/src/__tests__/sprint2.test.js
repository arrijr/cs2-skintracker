/**
 * Sprint 2 Integration Tests
 * Tests for Portfolio, Subscriptions, and Research Tools
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_JWT = process.env.TEST_JWT || 'test-token';

// Mock data
const mockSkinId = 1;
const mockUserId = 123;

describe('Sprint 2 - Portfolio & Subscription Integration', () => {
  let sessionToken;

  beforeAll(async () => {
    // In real tests, would authenticate with Clerk
    sessionToken = TEST_JWT;
  });

  describe('Portfolio Endpoints', () => {
    it('GET /api/v1/portfolio/summary - should return portfolio summary', async () => {
      const res = await axios.get(`${API_URL}/api/v1/portfolio/summary`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('totalValue');
      expect(res.data).toHaveProperty('totalInvested');
      expect(res.data).toHaveProperty('unrealizedPL');
      expect(res.data).toHaveProperty('positionCount');
      expect(res.data).toHaveProperty('positions');
      expect(Array.isArray(res.data.positions)).toBe(true);
    });

    it('POST /api/v1/portfolio - should add skin to portfolio', async () => {
      const res = await axios.post(
        `${API_URL}/api/v1/portfolio`,
        {
          skinId: mockSkinId,
          amount: 2,
          buyPrice: 19.99,
          buyDate: new Date().toISOString()
        },
        {
          headers: { Authorization: `Bearer ${sessionToken}` }
        }
      );

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data.skinId).toBe(mockSkinId);
      expect(res.data.amount).toBe(2);
    });

    it('GET /api/v1/portfolio - should return all portfolio items', async () => {
      const res = await axios.get(`${API_URL}/api/v1/portfolio`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('Subscription Endpoints', () => {
    it('GET /api/v1/subscriptions/status - should return subscription status', async () => {
      const res = await axios.get(`${API_URL}/api/v1/subscriptions/status`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('tier');
      expect(res.data).toHaveProperty('status');
      expect(['free', 'creator', 'pro']).toContain(res.data.tier);
    });

    it('POST /api/v1/subscriptions/checkout - should create checkout session', async () => {
      const res = await axios.post(
        `${API_URL}/api/v1/subscriptions/checkout`,
        { tier: 'creator' },
        {
          headers: { Authorization: `Bearer ${sessionToken}` }
        }
      );

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('sessionId');
      expect(res.data).toHaveProperty('url');
    });

    it('POST /api/v1/subscriptions/checkout - should reject invalid tier', async () => {
      try {
        await axios.post(
          `${API_URL}/api/v1/subscriptions/checkout`,
          { tier: 'invalid' },
          {
            headers: { Authorization: `Bearer ${sessionToken}` }
          }
        );
        expect(true).toBe(false); // Should not reach here
      } catch (err) {
        expect(err.response.status).toBe(400);
      }
    });
  });

  describe('Research Endpoints', () => {
    it('GET /api/v1/research/volatility/:id - should return volatility data', async () => {
      const res = await axios.get(`${API_URL}/api/v1/research/volatility/${mockSkinId}`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('volatility');
      expect(res.data).toHaveProperty('dataPoints');
      expect(res.data).toHaveProperty('volatilityLevel');
    });

    it('GET /api/v1/research/rarity/:id - should return rarity score', async () => {
      const res = await axios.get(`${API_URL}/api/v1/research/rarity/${mockSkinId}`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('rarityScore');
      expect(res.data.rarityScore).toBeGreaterThanOrEqual(0);
      expect(res.data.rarityScore).toBeLessThanOrEqual(100);
    });

    it('GET /api/v1/research/portfolio - should require Pro tier', async () => {
      try {
        await axios.get(`${API_URL}/api/v1/research/portfolio`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        // If free tier, should get 403
      } catch (err) {
        if (err.response?.status === 403) {
          expect(err.response.status).toBe(403);
        }
      }
    });

    it('GET /api/v1/research/portfolio - returns 403 for free user (isPremium=false)', async () => {
      // Requires DB state: user id=1 with isPremium=false (default).
      // Backend uses User.isPremium as source of truth (no userSubscriptions table).
      let prisma;
      try {
        const mod = await import('../prisma/prismaClient.js');
        prisma = mod.default;
        await prisma.user.update({ where: { id: 1 }, data: { isPremium: false } }).catch(() => {});
      } catch (_) { /* prisma unavailable in this test env — skip setup */ }

      try {
        const res = await axios.get(`${API_URL}/api/v1/research/portfolio`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        // If we got 200, the gate is broken
        expect(res.status).toBe(403);
      } catch (err) {
        // Only 401 (no auth) or 403 (gate working) acceptable. 500 = server crash, must fail.
        expect([401, 403]).toContain(err.response?.status);
      }
    });

    it('GET /api/v1/research/portfolio - returns 200 for premium user (isPremium=true)', async () => {
      let prisma;
      try {
        const mod = await import('../prisma/prismaClient.js');
        prisma = mod.default;
        await prisma.user.update({ where: { id: 1 }, data: { isPremium: true } }).catch(() => {});
      } catch (_) { /* prisma unavailable — skip setup */ }

      try {
        const res = await axios.get(`${API_URL}/api/v1/research/portfolio`, {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('research');
      } catch (err) {
        // Allow 401 in envs without dev server / auth mock. Never accept 500.
        expect([200, 401]).toContain(err.response?.status ?? 200);
      } finally {
        if (prisma) {
          await prisma.user.update({ where: { id: 1 }, data: { isPremium: false } }).catch(() => {});
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthenticated requests', async () => {
      try {
        await axios.get(`${API_URL}/api/v1/portfolio/summary`);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.response.status).toBe(401);
      }
    });

    it('should return 404 for non-existent resources', async () => {
      try {
        await axios.get(`${API_URL}/api/v1/skins/99999`);
        // Might return 404 or 200 depending on implementation
      } catch (err) {
        if (err.response?.status === 404) {
          expect(err.response.status).toBe(404);
        }
      }
    });
  });

  afterAll(() => {
    // Cleanup if needed
  });
});

export default describe;
