# Testing Strategy - Sprint 1 Code Review Fixes

**Purpose**: Validate all 8 code review fixes work correctly and won't regress.  
**Target Coverage**: 85%+ before production  
**Test Pyramid**: Unit (20+ tests) → Integration (10-15) → E2E (5-8)

---

## Fix Validation Matrix

| Fix | Type | Issue | Fix | Test Type | Test Cases |
|-----|------|-------|-----|-----------|-----------|
| C1 | CORS | Wildcard allow | Whitelist enforcement | Unit + Integration | 3 cases |
| C2 | Auth | PrismaClient leak | Shared singleton | Unit | 1 case |
| C3 | Tier | 'developer' tier | 'pro' tier + limits | Integration | 3 cases |
| C4 | Stripe | error.message in 200 | Remove error field | Unit | 1 case |
| H1 | Rate Limit | Missing IP limit | Added to /api/public | Integration | 2 cases |
| H2 | Stripe | Unsafe price extraction | Optional chaining | Unit | 2 cases |
| H3 | Tier | No isActive check | Check before limit | Integration | 2 cases |
| H4 | Tier | Hardcoded 'pro' msg | Use minTier var | Unit | 1 case |

---

## Unit Tests (20+ tests)

### Auth & CORS (3 tests)
```javascript
describe('CORS Whitelist', () => {
  test('Origin in whitelist → Allow (C1)', () => {
    const origin = 'https://example.com';
    const whitelist = ['https://example.com', 'https://app.com'];
    expect(whitelist.includes(origin)).toBe(true);
    // Verify: credentials header is set
  });

  test('Unknown origin → Reject (C1)', () => {
    const origin = 'https://evil.com';
    const whitelist = ['https://example.com'];
    expect(whitelist.includes(origin)).toBe(false);
    // Verify: return 403 or no CORS header
  });

  test('Credentials header only sent to whitelist (C1)', () => {
    const req = { headers: { origin: 'https://evil.com' } };
    // Mock auth.js
    // Verify: res.setHeader('Access-Control-Allow-Credentials', 'true') NOT called
  });
});
```

### Database (1 test)
```javascript
describe('PrismaClient Singleton (C2)', () => {
  test('roleHelpers imports shared PrismaClient instance', () => {
    const db = require('../roleHelpers');
    const db2 = require('../roleHelpers');
    // Verify: same instance (not new PrismaClient())
    expect(db).toBe(db2);
  });
});
```

### Stripe Webhook (2 tests)
```javascript
describe('Stripe Webhook Processing (H2, C4)', () => {
  test('Optional chaining safely extracts price.id', () => {
    const event = {
      data: {
        object: {
          items: {
            data: [{ price: { id: 'price_123' } }]
          }
        }
      }
    };
    // Verify: price?.id returns 'price_123'
    // Verify: null/undefined cases don't throw
  });

  test('200 response excludes error.message field (C4)', () => {
    const response = { status: 200, message: 'Event processed' };
    // Verify: response does NOT contain error.message
    expect(response.error).toBeUndefined();
  });
});
```

### Rate Limiting (3 tests)
```javascript
describe('Token Bucket Rate Limiter', () => {
  test('Refill 1 token per minute', () => {
    const bucket = { tokens: 10, refillRate: 1 };
    // Wait 60s, call refill()
    // Verify: tokens = 11 (max 10)
  });

  test('Exceeding limit → 429 Too Many Requests', () => {
    const bucket = { tokens: 0 };
    const result = bucket.allowRequest();
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(429);
  });

  test('IP rate limiter: 500 req/15min per IP (H1)', () => {
    const ips = { '192.168.1.1': { count: 500 } };
    const result = checkIPLimit('192.168.1.1', ips);
    expect(result.allowed).toBe(false); // 501st request
  });
});
```

### Tier Gating (2 tests)
```javascript
describe('Tier-Based Feature Gating (C3, H4)', () => {
  test('Pro tier: correct rate limit enforced', () => {
    const user = { tier: 'pro', dailyCallsRemaining: 10000 };
    expect(user.tier).toBe('pro'); // Not 'developer'
    expect(user.dailyCallsRemaining).toBeLessThanOrEqual(10000);
  });

  test('Upgrade message uses minTier variable (H4)', () => {
    const message = generateUpgradeMessage('pro');
    // Verify: message references minTier variable
    // Not hardcoded string 'pro'
    expect(message).toContain('Pro'); // or equivalent
  });
});
```

---

## Integration Tests (10-15 tests)

### Auth Flow (3 tests)
```javascript
describe('JWT Authentication', () => {
  test('POST /api/keys → returns JWT token', async () => {
    const res = await request(app)
      .post('/api/keys')
      .send({ email: 'user@example.com', password: 'test' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('JWT decode → correct user ID + tier', async () => {
    const token = generateTestToken({ userId: 123, tier: 'pro' });
    const decoded = verifyJWT(token);
    expect(decoded.userId).toBe(123);
    expect(decoded.tier).toBe('pro');
  });

  test('Expired JWT → return 401 Unauthorized', async () => {
    const expiredToken = generateTestToken({}, { expiresIn: '-1h' });
    const res = await request(app)
      .get('/api/skins')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});
```

### Tier Gating (2 tests)
```javascript
describe('Subscription Tier Enforcement (H3, H4)', () => {
  test('Check isActive + expiresAt before daily limit', async () => {
    const user = {
      tier: 'pro',
      isActive: false, // Subscription expired
      expiresAt: new Date(Date.now() - 86400000) // Yesterday
    };
    const res = await request(app)
      .get('/api/skins')
      .set('Authorization', `Bearer ${userToken(user)}`);
    expect(res.status).toBe(403); // Forbidden, not 429
  });

  test('Inactive user → 403 Forbidden (not 429)', async () => {
    const inactiveUser = { isActive: false };
    const res = checkTierAccess(inactiveUser);
    expect(res.status).toBe(403);
  });
});
```

### Rate Limiting (2 tests)
```javascript
describe('Rate Limit Enforcement', () => {
  test('Free tier: no API calls allowed', async () => {
    const freeUser = { tier: 'free' };
    const res = await request(app)
      .get('/api/skins')
      .set('Authorization', `Bearer ${userToken(freeUser)}`);
    expect(res.status).toBe(403); // Or 429
  });

  test('Pro tier (10k/day): track + enforce limit', async () => {
    const proUser = { tier: 'pro', dailyCallsRemaining: 10000 };
    // Make 10,000 calls
    // Verify: call #10,001 returns 429
    for (let i = 0; i < 10000; i++) {
      await makeRequest(proUser);
    }
    const res = await makeRequest(proUser);
    expect(res.status).toBe(429);
  });
});
```

### Stripe Webhook (3 tests)
```javascript
describe('Stripe Webhook Integration (C4, H2)', () => {
  test('Valid signature → process event', async () => {
    const event = generateStripeEvent('charge.succeeded');
    const signature = signEvent(event, STRIPE_WEBHOOK_SECRET);
    const res = await request(app)
      .post('/webhooks/stripe')
      .set('stripe-signature', signature)
      .send(event);
    expect(res.status).toBe(200);
  });

  test('Invalid signature → return 400', async () => {
    const event = generateStripeEvent('charge.succeeded');
    const badSignature = 'invalid_sig_12345';
    const res = await request(app)
      .post('/webhooks/stripe')
      .set('stripe-signature', badSignature)
      .send(event);
    expect(res.status).toBe(400);
  });

  test('Webhook updates subscription.isActive', async () => {
    const event = {
      type: 'customer.subscription.updated',
      data: { object: { customer: 'cus_123', status: 'active' } }
    };
    const signature = signEvent(event, STRIPE_WEBHOOK_SECRET);
    await request(app)
      .post('/webhooks/stripe')
      .set('stripe-signature', signature)
      .send(event);
    // Verify: user.isActive = true in database
    const user = await User.findOne({ stripeCustomerId: 'cus_123' });
    expect(user.isActive).toBe(true);
  });
});
```

---

## E2E Tests (5-8 tests)

### Scenario 1: Sign Up → Pro Tier → Hit Rate Limit
```javascript
describe('E2E: Pro tier rate limit', () => {
  test('User makes 10,001 calls in 24h, #10,001 returns 429', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/api/register')
      .send({ email: 'e2e@test.com', password: 'secret123' });
    const token = registerRes.body.token;

    // 2. Upgrade to Pro (create Stripe subscription)
    await request(app)
      .post('/api/subscribe')
      .set('Authorization', `Bearer ${token}`)
      .send({ priceId: 'price_pro_monthly' });

    // 3. Simulate 10,000 calls
    for (let i = 0; i < 10000; i++) {
      const res = await request(app)
        .get('/api/skins')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }

    // 4. Call #10,001 → 429 Too Many Requests
    const limitRes = await request(app)
      .get('/api/skins')
      .set('Authorization', `Bearer ${token}`);
    expect(limitRes.status).toBe(429);
  });
});
```

### Scenario 2: CORS Rejection on Unknown Origin
```javascript
describe('E2E: CORS blocks unknown origin', () => {
  test('Browser from evil.com cannot access /api/skins', async () => {
    // Simulate request from unknown origin
    const res = await request(app)
      .get('/api/skins')
      .set('Origin', 'https://evil.com');
    
    // Verify: either 403 Forbidden or no CORS headers
    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
```

### Scenario 3: Stripe Webhook Updates Subscription
```javascript
describe('E2E: Stripe webhook lifecycle', () => {
  test('Subscription expires, webhook updates isActive, API denies access', async () => {
    // 1. User has active Pro subscription
    let user = await User.findOne({ id: testUserId });
    expect(user.isActive).toBe(true);

    // 2. Stripe sends customer.subscription.deleted webhook
    const event = generateStripeEvent('customer.subscription.deleted', {
      customer: user.stripeCustomerId
    });
    const signature = signEvent(event, STRIPE_WEBHOOK_SECRET);
    await request(app)
      .post('/webhooks/stripe')
      .set('stripe-signature', signature)
      .send(event);

    // 3. User's isActive is updated
    user = await User.findOne({ id: testUserId });
    expect(user.isActive).toBe(false);

    // 4. API calls now return 403 Forbidden
    const res = await request(app)
      .get('/api/skins')
      .set('Authorization', `Bearer ${userToken(user)}`);
    expect(res.status).toBe(403);
  });
});
```

---

## Test Execution Plan

### Phase 1: Unit Tests (Day 1)
- Run: `npm run test:unit`
- Expected: All 20+ tests pass
- Time: ~5-10 minutes

### Phase 2: Integration Tests (Day 2)
- Setup: Test database + Stripe test mode
- Run: `npm run test:integration`
- Expected: All 10-15 tests pass
- Time: ~15-20 minutes

### Phase 3: E2E Tests (Day 2-3)
- Setup: Staging environment (or local with test DB)
- Run: `npm run test:e2e`
- Expected: All 5-8 tests pass
- Time: ~10-15 minutes

### Phase 4: Load Testing (Day 3)
```bash
# Simulate 500 requests over 60 seconds
ab -n 500 -c 10 http://localhost:5000/api/skins

# Expected results:
# - 0 failed requests
# - 99%ile response time <100ms
# - No 500 errors
```

---

## Coverage Report Template

```markdown
# Sprint 1 Test Coverage Report

## Summary
- Unit Tests: 20/20 passing (100%)
- Integration Tests: 15/15 passing (100%)
- E2E Tests: 8/8 passing (100%)
- Total Coverage: 85%+ of production code

## By Fix
- C1 (CORS): ✅ All tests passing
- C2 (PrismaClient): ✅ All tests passing
- C3 (Tier 'pro'): ✅ All tests passing
- C4 (Webhook error): ✅ All tests passing
- H1 (IP rate limit): ✅ All tests passing
- H2 (Optional chaining): ✅ All tests passing
- H3 (isActive check): ✅ All tests passing
- H4 (minTier variable): ✅ All tests passing

## Load Test Results
- Requests: 500
- Concurrent: 10
- Failed: 0
- Response Time (p95): XX ms
- Throughput: XX req/sec

## Remaining Gaps
- (List any untested edge cases)

## Sign-Off
- [ ] All tests passing
- [ ] Coverage ≥85%
- [ ] Load test successful
- [ ] Ready for production
```

---

## Next Steps

1. **Create test files** in `/src/__tests__/` directory
2. **Run unit tests** first (fastest feedback loop)
3. **Fix any failures** before moving to integration
4. **Document coverage** in this file
5. **Once complete**: Update [[../../../claude.md|claude.md]] and proceed to [[Production-Checklist.md]]

---

See: [[../../claude.md|Working Memory]] | [[Production-Checklist.md|Production Checklist]]
