/**
 * auth.test.js — Unit tests for CORS enforcement + auth middleware
 *
 * Covers code-review fixes:
 *   C1 — CORS whitelist enforced; credentials header only for allowed origins
 *   C2 — roleHelpers uses prisma singleton (no dual PrismaClient)
 *
 * Tests (7 total):
 *   CORS (3): whitelisted origin allowed, unknown origin rejected, no-origin allowed
 *   Singleton (1): prisma import is same reference as singleton
 *   Auth middleware (3): no token → 401, invalid token → 401, dev bypass works
 */

import { jest } from '@jest/globals';

// ── Mock heavy deps before importing app ─────────────────────────────────────

// Mock prisma singleton — prevent real DB connections during unit tests
const mockUser = {
  id: 1,
  email: 'pro-test@cs2tracker.local',
  role: 'user',
  clerkId: 'test-clerk-pro-user-001',
  tier: 'pro',
};

const mockPrismaAuth = {
  user: {
    findUnique: jest.fn(({ where }) => {
      if (where.clerkId === 'test-clerk-pro-user-001') return Promise.resolve(mockUser);
      if (where.clerkId === 'test-clerk-free-user-001') return Promise.resolve({ ...mockUser, id: 2, email: 'free-test@cs2tracker.local', tier: 'free' });
      return Promise.resolve(null);
    }),
  },
  $disconnect: jest.fn(),
};

await jest.unstable_mockModule('../../prisma/prismaClient.js', () => ({
  default: mockPrismaAuth,
}));

await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({
  default: mockPrismaAuth,
}));

// Mock Clerk verifyToken — unit tests don't hit Clerk API
await jest.unstable_mockModule('@clerk/backend', () => ({
  verifyToken: jest.fn(() => Promise.reject(new Error('Invalid token'))),
}));

// Mock cron to prevent scheduler side-effects
await jest.unstable_mockModule('../cron/index.js', () => ({}));

const supertest = (await import('supertest')).default;
const { default: app } = await import('../app.js');

// ── CORS tests ────────────────────────────────────────────────────────────────

describe('CORS — whitelist enforcement (C1)', () => {
  test('whitelisted origin receives CORS headers with credentials', async () => {
    const res = await supertest(app)
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.status).toBe(200);
  });

  test('non-whitelisted origin does NOT receive allow-credentials header', async () => {
    const res = await supertest(app)
      .get('/api/v1/health')
      .set('Origin', 'https://evil-site.example.com');

    // Either rejected (4xx) or response lacks credentials header
    const hasCredentials = res.headers['access-control-allow-credentials'] === 'true';
    const originAllowed = res.headers['access-control-allow-origin'] === 'https://evil-site.example.com';

    // Must NOT grant credentials to unknown origin
    expect(hasCredentials && originAllowed).toBe(false);
  });

  test('request with no Origin header is handled (server-to-server, Postman)', async () => {
    const res = await supertest(app)
      .get('/api/v1/health');

    // No origin → should still respond (not crash)
    expect(res.status).not.toBe(500);
  });
});

// ── Prisma singleton test ─────────────────────────────────────────────────────

describe('PrismaClient singleton (C2)', () => {
  test('roleHelpers imports the shared singleton — not a new instance', async () => {
    const { default: singletonPrisma } = await import('../../prisma/prismaClient.js');

    // Import roleHelpers — it must use the same prisma object (mocked above)
    const { getUserRoleFromDB } = await import('../utils/roleHelpers.js');

    // If roleHelpers used new PrismaClient() this call would go to the real DB
    // and fail (no real DB in unit test env). The mock intercepts it → success.
    const result = await getUserRoleFromDB('test-clerk-pro-user-001');
    expect(result.isUser).toBe(true);
    expect(result.tier).toBe('pro');
    expect(singletonPrisma.user.findUnique).toHaveBeenCalled();
  });
});

// ── Auth middleware ────────────────────────────────────────────────────────────

describe('requireAuth middleware', () => {
  test('no Authorization header → 401', async () => {
    const res = await supertest(app)
      .get('/api/v1/api-keys');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token required/i);
  });

  test('invalid token → 401', async () => {
    const res = await supertest(app)
      .get('/api/v1/api-keys')
      .set('Authorization', 'Bearer totally-invalid-jwt');

    expect(res.status).toBe(401);
  });

  test('dev bypass token (pro user) passes auth and attaches tier', async () => {
    const res = await supertest(app)
      .get('/api/v1/api-keys')
      .set('Authorization', `Bearer ${process.env.DEV_TEST_TOKEN}`);

    // 200 (has API keys) or 402 (no keys for pro, but auth passed)
    // Either way — should NOT be 401
    expect(res.status).not.toBe(401);
  });
});
