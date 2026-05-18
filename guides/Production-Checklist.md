# Production Checklist - CS2 Skin Tracker

Pre-deployment verification steps. Use this before shipping to production.

---

## Pre-Deployment Review

### Code Quality
- [ ] Code review completed (docs/01-Sprint1/Code-Review-Report.md)
- [ ] All critical issues from code review are fixed
- [ ] Testing strategy executed (all tests passing)
- [ ] No console.error or debug statements in production code
- [ ] All TypeScript types correct (if using TS)
- [ ] No dead code or commented-out logic

### Security
- [ ] All secrets removed from code (no DEV_TEST_TOKEN, DEV_FREE_TOKEN, etc.)
- [ ] CLERK_SECRET_KEY is set in production environment
- [ ] STRIPE_SECRET_KEY is set (and is production key, not test)
- [ ] Database connection string uses production database
- [ ] .env file is in .gitignore and never committed
- [ ] Webhook secret keys are strong and stored securely
- [ ] API key hashing uses SHA-256 (verify in auth.ts)
- [ ] CORS is configured correctly (no * wildcard in production)
- [ ] Rate limiting is enabled and tested

### Database
- [ ] Prisma migrations are up to date (run `prisma migrate deploy`)
- [ ] Database schema is normalized (no duplication, proper indexes)
- [ ] Foreign key constraints are enforced
- [ ] Backup strategy is in place (Vercel PostgreSQL handles this)
- [ ] Test data (seeds) are removed or marked as test-only
- [ ] Connection pooling is configured (if using PgBouncer)

### API & Performance
- [ ] All endpoints tested manually (curl, Postman, or API client)
- [ ] Response times are <100ms p95 (check with load test)
- [ ] Error responses are standardized (consistent JSON format)
- [ ] API returns appropriate HTTP status codes (200, 400, 401, 404, 500, etc.)
- [ ] Request validation is in place (no garbage input accepted)
- [ ] Rate limiting is tested (ensure tier limits work)
- [ ] Pagination works correctly for large datasets
- [ ] Caching headers are set (ETag, Cache-Control, etc.)

### Authentication & Authorization
- [ ] JWT token verification is working
- [ ] Clerk integration is tested with real Clerk production keys
- [ ] API key extraction from headers works (Authorization: Bearer <key>)
- [ ] Role-based access control is enforced (free vs. pro vs. enterprise)
- [ ] Expired tokens are rejected
- [ ] Invalid tokens return 401 Unauthorized

### Stripe Integration
- [ ] Stripe webhook endpoint is registered in Stripe dashboard
- [ ] Webhook signature verification is implemented
- [ ] Test webhook delivery works (use Stripe CLI in production)
- [ ] Subscription creation returns correct response
- [ ] Webhook retry logic is implemented (exponential backoff)
- [ ] Idempotent webhook handling prevents duplicate charges
- [ ] Use production Stripe keys (not test mode)

### Logging & Monitoring
- [ ] Structured logging is implemented (timestamp, level, context)
- [ ] Error logs are captured and visible
- [ ] GitHub Actions logs are accessible for price update jobs
- [ ] Log rotation is configured (Vercel handles this)
- [ ] Sensitive data is NOT logged (no API keys, tokens, passwords)
- [ ] Monitoring/alerting plan is documented (future: Sentry integration)

### Documentation
- [ ] API documentation is complete (endpoints, params, responses)
- [ ] README has setup instructions for local development
- [ ] Environment variables are documented (.env.example exists)
- [ ] Deployment instructions are clear
- [ ] Runbook for common issues is written (see operations:runbook)
- [ ] Swagger/OpenAPI spec is generated and accessible

### Deployment Specifics (Vercel)
- [ ] vercel.json is configured correctly
- [ ] Environment variables are set in Vercel dashboard (NEVER in vercel.json)
- [ ] Build command is correct (npm run build or equivalent)
- [ ] Start command is correct
- [ ] Auto-deploy on push is enabled
- [ ] Preview deployments are working
- [ ] Edge middleware is configured (if using Vercel Edge)

### Data Privacy & Compliance
- [ ] User PII is encrypted (if stored)
- [ ] API keys are hashed (SHA-256, not plaintext)
- [ ] GDPR compliance is checked (user deletion works)
- [ ] Data retention policy is documented
- [ ] No test/debug mode in production
- [ ] Third-party data sharing is disclosed (Stripe, Clerk)

---

## Load Testing

Run before launch to ensure 99.5% uptime target:

```bash
# Simulate 500 requests over 60 seconds (8.3 req/sec)
# Example using Apache Bench or similar
ab -n 500 -c 10 http://localhost:5000/api/skins

# Expected results:
# - 0 failed requests
# - 99%ile response time <100ms
# - No 500 errors
```

- [ ] Load test completed
- [ ] Results documented (response times, errors, throughput)
- [ ] No degradation under load
- [ ] Database connections are stable

---

## Staging Test

Before hitting production, test everything in a staging environment:

- [ ] Clone production environment exactly
- [ ] Run all API endpoints against staging
- [ ] Test Stripe webhook flow (with test cards)
- [ ] Test Clerk auth (with test user)
- [ ] Verify database queries return expected results
- [ ] Check response times match local benchmarks

---

## Monitoring Setup

After deployment, verify monitoring is in place:

- [ ] Vercel Function logs are accessible
- [ ] Error tracking is configured (stdout visible in Vercel)
- [ ] Database logs are enabled (PostgreSQL)
- [ ] Stripe webhook delivery is monitored (check Stripe dashboard)
- [ ] GitHub Actions price update job completes daily (check Actions tab)

---

## Go/No-Go Decision

**BEFORE deploying to production, confirm:**

- [ ] All checks above are complete
- [ ] Code review found no critical issues
- [ ] Load tests passed
- [ ] Staging environment validated
- [ ] Team is ready for monitoring (on-call rotation set up)
- [ ] Rollback plan is documented (how to revert quickly)

**If any critical issue is found, STOP and fix before proceeding.**

---

## Rollback Plan

If production has critical issues:

1. **Immediate** (0-5 min): Revert to previous Vercel deployment (click "Rollback" in Vercel dashboard)
2. **Next** (5-15 min): Identify root cause from logs
3. **Fix** (15+ min): Apply fix, re-test locally, re-deploy

Keep previous deployments accessible for 30 days (Vercel default).

---

## Post-Deployment

After successful deployment:

1. Update [[../claude.md|claude.md]] with deployment date + metrics
2. Document any issues discovered in production (for future sprints)
3. Set up on-call rotation if needed
4. Schedule post-mortem if any incidents occurred
5. Plan Sprint 2 based on learnings

---

See: [[../claude.md|Working Memory]]
