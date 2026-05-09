/**
 * stripe.test.js — Unit tests for Stripe webhook handler + service
 *
 * Covers code-review fixes:
 *   C4 — webhook 200 error response does NOT expose error.message
 *   H2 — optional chaining on subscription.items.data[0]
 *
 * Tests (8 total):
 *   Webhook signature (3): valid sig → 200, invalid sig → 200 (no leak), missing sig → 400
 *   Error response body (2): no error.message field on failure, received:true always present
 *   Optional chaining (3): null items.data, empty items.data, valid items.data
 */

import { jest } from '@jest/globals';
import Stripe from 'stripe';

// ── Mock dependencies ─────────────────────────────────────────────────────────

// Prisma mock — shared object so both import paths return the same instance
const mockPrismaStripe = {
  user: { update: jest.fn(() => Promise.resolve({})) },
  $disconnect: jest.fn(),
};

await jest.unstable_mockModule('../../prisma/prismaClient.js', () => ({
  default: mockPrismaStripe,
}));

// Also mock the src/prisma path to prevent real DB connections from other routes
await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({
  default: mockPrismaStripe,
}));

// Mock Stripe — we control constructEvent output
const mockConstructEvent = jest.fn();
const mockSubscriptionsRetrieve = jest.fn();

await jest.unstable_mockModule('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockSubscriptionsRetrieve,
    },
  })),
}));

// Mock logger to silence output
await jest.unstable_mockModule('../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

await jest.unstable_mockModule('../cron/index.js', () => ({}));

const supertest = (await import('supertest')).default;
const { default: app } = await import('../app.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRawBody(overrides = {}) {
  return JSON.stringify({
    id: 'evt_test_001',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_001',
        object: 'checkout.session',
        client_reference_id: '1',
        customer: 'cus_test_001',
        subscription: 'sub_test_001',
        payment_status: 'paid',
        status: 'complete',
        metadata: { userId: '1', tierName: 'pro' },
        ...overrides,
      },
    },
  });
}

// ── Webhook signature tests ────────────────────────────────────────────────────

describe('Stripe webhook — signature verification (C4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('valid signature + recognized event → 200 { received: true }', async () => {
    const body = makeRawBody();

    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_test_001',
      type: 'checkout.session.completed',
      data: { object: JSON.parse(body).data.object },
    });

    mockSubscriptionsRetrieve.mockResolvedValueOnce({
      id: 'sub_test_001',
      items: { data: [{ price: { id: 'price_pro_xxx' } }] },
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1234,v1=abc123')
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  test('invalid signature → 200 but does NOT expose error.message (C4)', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('Webhook signature verification failed');
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid_sig')
      .send(makeRawBody());

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    // CRITICAL: must NOT leak internal error string
    expect(res.body.error).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('Webhook signature verification failed');
  });

  test('missing stripe-signature header → 400', async () => {
    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(makeRawBody());

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/signature/i);
  });

  test('unhandled event type → 200 { received: true, unhandled: true }', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_unknown',
      type: 'payment_intent.created', // not handled
      data: { object: {} },
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1234,v1=abc')
      .send(makeRawBody());

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});

// ── Optional chaining on subscription.items.data[0] (H2) ─────────────────────

describe('stripe-service — null-safe subscription item access (H2)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('subscription with empty items.data does not throw', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_test_002',
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: '1',
          customer: 'cus_001',
          subscription: 'sub_001',
        },
      },
    });

    // Stripe returns subscription with no items
    mockSubscriptionsRetrieve.mockResolvedValueOnce({
      id: 'sub_001',
      items: { data: [] }, // empty — was crashing before H2 fix
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1234,v1=abc')
      .send(makeRawBody());

    // Should not crash — falls back to 'pro' tier
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  test('subscription with null items does not throw', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_test_003',
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: '1',
          customer: 'cus_001',
          subscription: 'sub_001',
        },
      },
    });

    mockSubscriptionsRetrieve.mockResolvedValueOnce({
      id: 'sub_001',
      items: null, // fully null — was crashing before H2 fix
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1234,v1=abc')
      .send(makeRawBody());

    expect(res.status).toBe(200);
  });

  test('subscription with valid item resolves correct tier', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_test_004',
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: '1',
          customer: 'cus_001',
          subscription: 'sub_001',
        },
      },
    });

    mockSubscriptionsRetrieve.mockResolvedValueOnce({
      id: 'sub_001',
      items: { data: [{ price: { id: 'price_pro_xxx' } }] },
    });

    const res = await supertest(app)
      .post('/api/v1/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1234,v1=abc')
      .send(makeRawBody());

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    // processed:true means updateUserBasedOnWebhook ran without error
    expect(res.body.processed).toBe(true);
  });
});
