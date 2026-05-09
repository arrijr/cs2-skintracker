/**
 * Portfolio Summary Endpoint Tests
 * Sprint 2: Test GET /portfolio/summary for dashboard
 */

import request from 'supertest';
import app from '../app.js';
import prisma from '../prisma/prismaClient.js';
import { verifyToken } from '@clerk/backend';

// Mock Clerk JWT verification
jest.mock('@clerk/backend');

describe('Portfolio Summary Endpoint', () => {
  let testUserId;
  let testToken;
  let testSkinId;

  beforeAll(async () => {
    // Setup: Create test user
    testUserId = 'test-user-123';
    testToken = 'Bearer test-jwt-token';

    // Mock Clerk verification
    verifyToken.mockResolvedValue({
      sub: testUserId,
      email: 'test@example.com',
      sid: 'session-123'
    });
  });

  beforeEach(async () => {
    // Clean up
    await prisma.portfolio.deleteMany({ where: {} });
    await prisma.skin.deleteMany({ where: {} });

    // Create test skin
    const skin = await prisma.skin.create({
      data: {
        name: 'AK-47 | Phantom Disruptor',
        marketHashName: 'AK-47 | Phantom Disruptor',
        priceLatest: 50.00,
        priceAvg: 48.00,
        rarity: 'Restricted',
        weaponType: 'Rifle'
      }
    });

    testSkinId = skin.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Returns empty portfolio when user has no items', async () => {
    const response = await request(app)
      .get('/api/v1/portfolio/summary')
      .set('Authorization', testToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalValue: 0,
      invested: 0,
      unrealizedPL: 0,
      percentageChange: 0,
      itemCount: 0,
      items: []
    });
  });

  test('Returns correct totals with single item', async () => {
    // Add 2 units at €40 each
    await prisma.portfolio.create({
      data: {
        userId: testUserId,
        skinId: testSkinId,
        amount: 2,
        buyPrice: 40,
        buyDate: new Date('2026-05-01')
      }
    });

    const response = await request(app)
      .get('/api/v1/portfolio/summary')
      .set('Authorization', testToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalValue: 100,      // 2 × €50
      invested: 80,         // 2 × €40
      unrealizedPL: 20,     // €100 - €80
      percentageChange: 25, // 20 / 80 × 100
      itemCount: 1,
      items: expect.arrayContaining([
        expect.objectContaining({
          skinId: testSkinId,
          skinName: 'AK-47 | Phantom Disruptor',
          amount: 2,
          buyPrice: 40,
          currentPrice: 50,
          currentValue: 100,
          gainLoss: 20,
          gainLossPercent: 25
        })
      ])
    });
  });

  test('Returns 401 without authentication', async () => {
    const response = await request(app)
      .get('/api/v1/portfolio/summary');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('Includes item details with all required fields', async () => {
    await prisma.portfolio.create({
      data: {
        userId: testUserId,
        skinId: testSkinId,
        amount: 1,
        buyPrice: 45,
        buyDate: new Date('2026-05-01')
      }
    });

    const response = await request(app)
      .get('/api/v1/portfolio/summary')
      .set('Authorization', testToken);

    expect(response.status).toBe(200);
    const item = response.body.items[0];

    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('skinId', testSkinId);
    expect(item).toHaveProperty('skinName');
    expect(item).toHaveProperty('imageUrl');
    expect(item).toHaveProperty('amount', 1);
    expect(item).toHaveProperty('buyPrice', 45);
    expect(item).toHaveProperty('buyDate');
    expect(item).toHaveProperty('currentPrice');
    expect(item).toHaveProperty('currentValue');
    expect(item).toHaveProperty('gainLoss');
    expect(item).toHaveProperty('gainLossPercent');
  });
});
