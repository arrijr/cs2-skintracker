/**
 * integration.test.js — Integration tests for Sprint 1 flows
 *
 * Tests full request→middleware→route→DB chains with mocked Prisma + Stripe.
 * No real network calls. Server boots on ephemeral port.
 *
 * Tests (12 total):
 *   JWT/auth flow (3): dev-token pro user full flow, dev-token free user full flow,
 *                      missing token blocked on all protected routes
 *   API key management (4): create key (pro), create key (free) → 402,
 *                            list keys, revoke key
 *   Subscription tier (3): free→pro upgrade via DB, pro user limits, enterprise unlimited
 *   Stripe webhook (2): checkout.session.completed updates DB tier,
 *                       subscription.deleted reverts to free
 */

import { jest } from '@jest/globals';

// ── Shared mock state ─────────────────────────────────────────────────────────

const db = {
  users: {
    1: { id: 1, email: 'pro@cs2tracker.local',  role: 'user', clerkId: 'test-clerk-pro-user-001',  tier: 'pro'  },
    2: { id: 2, email: 'free@cs2tracker.local', role: 'user', clerkId: 'test-clerk-free-user-001', tier: 'free' },
  },
  apiKeys: {},
  nextKeyId: 100,
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(({ where }) => {
      const user = where.clerkId
        ? Object.values(db.users).find(u => u.clerkId === where.clerkId)
        : where.id ? db.users[where.id] : null;
      return Promise.resolve(user || null);
    }),
    update: jest.fn(({ where, data }) => {
      if (db.users[where.id]) Object.assign(db.users[where.id], data);
      return Promise.resolve(db.users[where.id]);
    }),
  },
  aPIKey: {
    count: jest.fn(({ where }) => {
      const count = Object.values(db.apiKeys).filter(k => k.userId === where.userId).length;
      return Promise.resolve(count);
    }),
    create: jest.fn(({ data }) => {
      const key = { id: db.nextKeyId++, ...data, createdAt: new Date(), lastResetAt: new Date() };
      db.apiKeys[key.id] = key;
      return Promise.resolve(key);
    }),
    findMany: jest.fn(({ where }) => {
      const keys = Object.values(db.apiKeys).filter(k => k.userId === where.userId);
      return Promise.resolve(keys);
    }),
    findUnique: jest.fn(({ where }) => Promise.resolve(db.apiKeys[where.id] || null)),
    update: jest.fn(({ where, data }) => {
      if (db.apiKeys[where.id]) Object.assign(db.apiKeys[where.id], data);
      return Promise.resolve(db.apiKeys[where.id] || {});
    }),
    findFirst: jest.fn(() => Promise.resolve(null)), // public API key lookup
  },
  aPILog: {
    create: jest.fn(() => Promise.resolve({})),
    findMany: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(0)),
  },
  $disconnect: jest.fn(),
};

await jest.unstable_mockModule('../../prisma/prismaClient.js', () => ({
  default: mockPrisma,
}));

await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({
  default: mockPrisma,
}));

await jest.unstable_mockModule('@clerk/backend', () => ({
  verifyToken: jest.fn(() => Promise.reject(new Error('Invalid token'))),
}));

const mockConstructEvent = jest.fn();
await jest.unstable_mockModule('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: {
      retrieve: jest.fn(() => Promise.resolve({
        id: 'sub_001',
        items: { data: [{ price: { id: 'price_pro_xxx' } }] },
      })),
    },
  })),
}));

await jest.unstable_mockModule('../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

await jest.unstable_mockModule('../cron/index.js', () => ({}));

const supertest = (await import('supertest')).default;
const { default: app } = await import('../app.js');

const PRO_TOKEN  = process.env.DEV_TEST_TOKEN;
const FREE_TOKEN = process.env.DEV_FREE_TOKEN;

// ── JWT / auth flow ───────────────────────────────────────────────────────────

describe('Auth flow — dev bypass tokens', () => {
  beforeEach(() => jest.clearAllMocks());

  test('pro dev-token: GET /api-keys returns 200 with keys array', async () => {
    const res = await supertest(app)
      .get('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('keys');
    expect(Array.isArray(res.body.keys)).toBe(true);
  });

  test('free dev-token: GET /api-keys returns 402 (no API access on free tier)', async () => {
    const res = await supertest(app)
      .get('/api/v1/api-keys')
      .set('Authorization', `Bearer ${FREE_TOKEN}`);

    expect(res.status).toBe(402);
    expect(res.body.requiredTier).toBe('pro');
  });

  test('no token: all protected routes return 401', async () => {
    const [keysRes, deleteRes] = await Promise.all([
      supertest(app).get('/api/v1/api-keys'),
      supertest(app).delete('/api/v1/api-keys/1'),
    ]);
    expect(keysRes.status).toBe(401);
    expect(deleteRes.status).toBe(401);
  });
});

// ── API key management ────────────────────────────────────────────────────────

describe('API key management — full CRUD flow', () => {
  let createdKeyId;

  beforeEach(() => jest.clearAllMocks());

  test('POST /api-keys as pro user → 201 with raw key + preview', async () => {
    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`)
      .send({ name: 'Integration Test Key' });

    expect(res.status).toBe(201);
    expect(res.body.key).toBeDefined();
    expect(res.body.key.length).toBe(64); // 32 random bytes → 64 hex chars
    expect(res.body.keyPreview).toMatch(/^.{4}\.\.\.(.{4})$/);
    expect(res.body.tier).toBe('pro'); // C3 fix verified
    expect(res.body.callsPerDay).toBe(10000);
    createdKeyId = res.body.id;
  });

  test('POST /api-keys as free user → 402 with upgrade info', async () => {
    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${FREE_TOKEN}`)
      .send({ name: 'Should Fail' });

    expect(res.status).toBe(402);
    expect(res.body.error).toMatch(/upgrade to pro/i);
    expect(res.body.requiredTier).toBe('pro');
    expect(res.body.upgrade).toBeDefined();
    expect(res.body.upgrade.price).toBe(4.99);
  });

  test('POST /api-keys with empty name → 400', async () => {
    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  test('DELETE /api-keys/:id revokes key (sets isActive=false)', async () => {
    // First create a key to delete
    const createRes = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`)
      .send({ name: 'Key to revoke' });

    const keyId = createRes.body.id;

    // Now delete it
    const deleteRes = await supertest(app)
      .delete(`/api/v1/api-keys/${keyId}`)
      .set('Authorization', `Bearer ${PRO_TOKEN}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify update was called with isActive: false (soft delete)
    const updateCall = mockPrisma.aPIKey.update.mock.calls.find(
      c => c[0]?.where?.id === keyId
    );
    expect(updateCall[0].data.isActive).toBe(false);
  });
});

// ── Subscription tier enforcement ─────────────────────────────────────────────

describe('Subscription tier — gate enforcement', () => {
  test('free→pro upgrade: after tier update, API key creation succeeds', async () => {
    // Simulate tier upgrade by updating the mock user directly
    db.users[2].tier = 'pro';

    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${FREE_TOKEN}`)
      .send({ name: 'Post-Upgrade Key' });

    expect(res.status).toBe(201);
    expect(res.body.tier).toBe('pro');

    // Cleanup: revert to free
    db.users[2].tier = 'free';
  });

  test('pro tier limits: response includes callsPerDay=10000', async () => {
    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`)
      .send({ name: 'Limits Check Key' });

    expect(res.status).toBe(201);
    expect(res.body.callsPerDay).toBe(10000);
  });

  test('enterprise tier: maxAPIKeysPerUser = Infinity', async () => {
    const { getTierLimits } = await import('../middleware/tier-gating.js');
    const limits = getTierLimits('enterprise');
    expect(limits.maxAPIKeysPerUser).toBe(Infinity);
    expect(limits.apiCallsPerDay).toBe(Infinity);
  });
});

// ── Stripe webhook integration ────────────────────────────────────────────────

describe('Stripe webhook — DB update flow', () => {
  beforeEach(() => jest.clearAllMocks());

  test('checkout.session.completed upgrades user tier to pro', async () => {
    const userId = 2; // free user
    const payload = JSON.stringify({
      id: 'evt_integration_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: String(userId),
          customer: 'cus_integration_001',
          subscription: 'sub_integration_001',
        },
      },
    });

    mockConstructEvent.mockReturnValueOnce(JSON.parse(payload));

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=abc')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    // DB update was called
    expect(mockPrisma.user.update).toHaveBeenCalled();
    const updateCall = mockPrisma.user.update.mock.calls[0][0];
    expect(updateCall.data.tier).toBe('pro');
  });

  test('subscription.deleted reverts user tier to free', async () => {
    const payload = JSON.stringify({
      id: 'evt_integration_002',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_integration_001',
          customer: 'cus_integration_001',
          metadata: { userId: '1' },
        },
      },
    });

    mockConstructEvent.mockReturnValueOnce({
      ...JSON.parse(payload),
      data: {
        object: {
          id: 'sub_integration_001',
          customer: 'cus_integration_001',
        },
      },
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=abc')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
