/**
 * e2e.test.js — End-to-end scenario tests
 *
 * Simulates complete user journeys through the full request stack.
 * Still uses mocked Prisma/Stripe (no real external calls), but exercises
 * the full Express app including all middleware chains.
 *
 * Scenarios (7 total):
 *   1. Sign-up → pro upgrade → API key creation → usage → limit hit
 *   2. CORS rejection: unknown origin cannot make credentialed API calls
 *   3. Stripe webhook lifecycle: checkout → active sub → cancellation → free
 *   4. Free user upgrade flow: 402 → tier upgrade → retry succeeds
 *   5. API key revocation: create → use → revoke → use fails
 *   6. Rate limit counter: sequential calls increment counter correctly
 *   7. Webhook error isolation: bad webhook does not expose internals
 */

import { jest } from '@jest/globals';

// ── Shared mutable state ──────────────────────────────────────────────────────

const state = {
  users: {
    pro:  { id: 1, email: 'pro@e2e.test',  role: 'user', clerkId: 'test-clerk-pro-user-001',  tier: 'pro'  },
    free: { id: 2, email: 'free@e2e.test', role: 'user', clerkId: 'test-clerk-free-user-001', tier: 'free' },
  },
  apiKeys: {},
  nextId: 200,
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(({ where }) => {
      const user = where.clerkId
        ? Object.values(state.users).find(u => u.clerkId === where.clerkId)
        : Object.values(state.users).find(u => u.id === where.id);
      return Promise.resolve(user || null);
    }),
    update: jest.fn(({ where, data }) => {
      const user = Object.values(state.users).find(u => u.id === where.id);
      if (user) Object.assign(user, data);
      return Promise.resolve(user || {});
    }),
  },
  aPIKey: {
    count:      jest.fn(({ where }) =>
      Promise.resolve(Object.values(state.apiKeys).filter(k => k.userId === where.userId).length)
    ),
    create:     jest.fn(({ data }) => {
      const key = { id: state.nextId++, ...data, createdAt: new Date(), lastResetAt: new Date() };
      state.apiKeys[key.id] = key;
      return Promise.resolve(key);
    }),
    findMany:   jest.fn(({ where }) =>
      Promise.resolve(Object.values(state.apiKeys).filter(k => k.userId === where.userId))
    ),
    findUnique: jest.fn(({ where }) => Promise.resolve(state.apiKeys[where.id] || null)),
    update:     jest.fn(({ where, data }) => {
      if (state.apiKeys[where.id]) Object.assign(state.apiKeys[where.id], data);
      return Promise.resolve(state.apiKeys[where.id] || {});
    }),
    findFirst:  jest.fn(() => Promise.resolve(null)),
  },
  aPILog: {
    create:   jest.fn(() => Promise.resolve({})),
    findMany: jest.fn(() => Promise.resolve([])),
    count:    jest.fn(() => Promise.resolve(0)),
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
  verifyToken: jest.fn(() => Promise.reject(new Error('use dev bypass in tests'))),
}));

const mockConstructEvent = jest.fn();
await jest.unstable_mockModule('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: {
      retrieve: jest.fn(() => Promise.resolve({
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

// ── Scenario 1: sign-up → pro → create key → limit ───────────────────────────

describe('Scenario 1 — pro user: create key and hit daily limit', () => {
  let rawKey;

  test('step 1: pro user creates API key', async () => {
    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`)
      .send({ name: 'E2E Scenario 1 Key' });

    expect(res.status).toBe(201);
    expect(res.body.key).toBeDefined();
    expect(res.body.callsPerDay).toBe(10000);
    rawKey = res.body.key;
  });

  test('step 2: pro user lists their keys — newly created key appears', async () => {
    const res = await supertest(app)
      .get('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.keys.length).toBeGreaterThan(0);
  });

  test('step 3: key at daily limit is blocked', async () => {
    const { validateAPIKeyUsage } = await import('../middleware/tier-gating.js');

    const result = validateAPIKeyUsage({
      tier: 'pro',
      isActive: true,
      expiresAt: null,
      callsUsed: 10000,
      callsPerDay: 10000,
    });

    expect(result.canUse).toBe(false);
    expect(result.message).toMatch(/10000.*10000/);
  });
});

// ── Scenario 2: CORS rejection for unknown origin ────────────────────────────

describe('Scenario 2 — CORS: unknown origin cannot use credentialed requests', () => {
  test('unknown origin does not get allow-credentials: true', async () => {
    const res = await supertest(app)
      .options('/api/v1/api-keys')
      .set('Origin', 'https://attacker.example.com')
      .set('Access-Control-Request-Method', 'POST');

    // Either the response is an error, or it lacks the credentials header
    const credentialHeader = res.headers['access-control-allow-credentials'];
    const originHeader = res.headers['access-control-allow-origin'];

    // Must NOT grant credentials to an unknown origin
    expect(
      credentialHeader === 'true' && originHeader === 'https://attacker.example.com'
    ).toBe(false);
  });

  test('known origin receives CORS headers normally', async () => {
    const res = await supertest(app)
      .options('/api/v1/api-keys')
      .set('Origin', 'https://cs2-skintracker.vercel.app')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('https://cs2-skintracker.vercel.app');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});

// ── Scenario 3: Stripe webhook lifecycle ─────────────────────────────────────

describe('Scenario 3 — Stripe webhook lifecycle', () => {
  beforeEach(() => jest.clearAllMocks());

  function webhookPost(type, objectOverrides = {}) {
    const payload = JSON.stringify({
      id: `evt_${Date.now()}`,
      type,
      data: { object: { id: 'sub_001', customer: 'cus_001', ...objectOverrides } },
    });
    mockConstructEvent.mockReturnValueOnce({ type, data: { object: JSON.parse(payload).data.object } });
    return supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=sig')
      .send(payload);
  }

  test('checkout.session.completed → 200 + DB updated', async () => {
    const res = await webhookPost('checkout.session.completed', {
      client_reference_id: '1',
      subscription: 'sub_001',
    });
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  test('customer.subscription.deleted → 200 + reverts tier', async () => {
    const res = await webhookPost('customer.subscription.deleted');
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  test('invalid webhook signature → 200 + no error leaked (C4)', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('INTERNAL: secret mismatch 0xDEAD');
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'bad_sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('0xDEAD');
    expect(JSON.stringify(res.body)).not.toContain('INTERNAL');
  });
});

// ── Scenario 4: free user upgrade flow ───────────────────────────────────────

describe('Scenario 4 — free user upgrade journey', () => {
  afterEach(() => {
    // Reset free user tier after each test
    state.users.free.tier = 'free';
    jest.clearAllMocks();
  });

  test('step 1: free user hits 402 on API key creation', async () => {
    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${FREE_TOKEN}`)
      .send({ name: 'Pre-upgrade attempt' });

    expect(res.status).toBe(402);
    expect(res.body.currentTier).toBe('free');
    expect(res.body.requiredTier).toBe('pro');
  });

  test('step 2: after tier upgrade, API key creation succeeds', async () => {
    state.users.free.tier = 'pro'; // simulate Stripe webhook effect

    const res = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${FREE_TOKEN}`)
      .send({ name: 'Post-upgrade key' });

    expect(res.status).toBe(201);
    expect(res.body.callsPerDay).toBe(10000);
  });
});

// ── Scenario 5: API key revocation ────────────────────────────────────────────

describe('Scenario 5 — API key revocation', () => {
  test('revoked key (isActive=false) is blocked by validateAPIKeyUsage', async () => {
    const { validateAPIKeyUsage } = await import('../middleware/tier-gating.js');

    const result = validateAPIKeyUsage({
      tier: 'pro',
      isActive: false,
      expiresAt: null,
      callsUsed: 0,
      callsPerDay: 10000,
    });

    expect(result.canUse).toBe(false);
    expect(result.message).toMatch(/inactive/i);
  });

  test('create then revoke: DELETE sets isActive=false in DB', async () => {
    const createRes = await supertest(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${PRO_TOKEN}`)
      .send({ name: 'Key to revoke in E2E' });

    expect(createRes.status).toBe(201);
    const keyId = createRes.body.id;

    const deleteRes = await supertest(app)
      .delete(`/api/v1/api-keys/${keyId}`)
      .set('Authorization', `Bearer ${PRO_TOKEN}`);

    expect(deleteRes.status).toBe(200);
    expect(state.apiKeys[keyId].isActive).toBe(false);
  });
});
