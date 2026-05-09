# Sprint 2 Testing Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate all Sprint 2 features work end-to-end: auth flow, portfolio CRUD, Stripe subscriptions, and research endpoints.

**Architecture:** Three test layers — (1) backend API tests via Jest, (2) frontend E2E via Playwright, (3) manual Stripe checkout verification. Run each layer independently, fix failures before proceeding to next.

**Tech Stack:** Node.js 22 ESM, Jest (to be configured), Playwright 1.55, Clerk (test mode), Stripe (test mode), PostgreSQL via Prisma

**Servers required during testing:**
- Backend: `cd backend && npm run dev` → http://localhost:5000
- Frontend: `cd frontend && npm run dev` → http://localhost:3000

---

## Task 1: Configure Jest for Backend

The backend has test files using `@jest/globals` but no jest configured in package.json. Fix this before running any tests.

**Files:**
- Modify: `backend/package.json`
- Create: `backend/jest.config.js`

- [ ] **Step 1: Check if jest is installed**

```bash
cd backend
node -e "require('@jest/globals')" 2>&1 || echo "NOT_INSTALLED"
```

Expected: `NOT_INSTALLED` (jest missing)

- [ ] **Step 2: Install jest with ESM support**

```bash
cd backend
npm install --save-dev jest @jest/globals
```

Expected: jest added to devDependencies

- [ ] **Step 3: Create jest.config.js**

Create `backend/jest.config.js`:
```js
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  testTimeout: 30000,
};
```

- [ ] **Step 4: Add test script to package.json**

In `backend/package.json`, replace:
```json
"test": "echo \"Error: no test specified\" && exit 1",
```
With:
```json
"test": "node --experimental-vm-modules node_modules/.bin/jest",
"test:sprint2": "node --experimental-vm-modules node_modules/.bin/jest sprint2",
"test:watch": "node --experimental-vm-modules node_modules/.bin/jest --watch",
```

- [ ] **Step 5: Verify jest runs (expect failures, not config errors)**

```bash
cd backend
npm run test:sprint2 2>&1 | head -40
```

Expected: Test output with PASS/FAIL (not "jest not found" or syntax errors)

- [ ] **Step 6: Commit**

```bash
git add backend/jest.config.js backend/package.json
git commit -m "test: configure jest for ESM backend test suite"
```

---

## Task 2: Run Backend Sprint 2 Tests — Fix Auth

The sprint2.test.js uses `Authorization: Bearer test-token`. With Clerk env vars unset locally, `verifyClerkJwt.js` mock fallback sets `req.userId = 1`. Tests should pass against running local server.

**Files:**
- Read: `backend/src/__tests__/sprint2.test.js`
- Modify if needed: `backend/src/__tests__/sprint2.test.js`

- [ ] **Step 1: Ensure backend server is running**

```bash
# In a separate terminal:
cd backend && npm run dev
```

Check: `curl http://localhost:5000/health` → `{"status":"ok",...}`

- [ ] **Step 2: Run portfolio tests**

```bash
cd backend
API_URL=http://localhost:5000 TEST_JWT=any-token npm run test:sprint2 -- --testNamePattern="Portfolio"
```

Expected: Tests for GET/POST/DELETE portfolio pass with `userId=1` mock

- [ ] **Step 3: Run subscription tests**

```bash
cd backend
API_URL=http://localhost:5000 TEST_JWT=any-token npm run test:sprint2 -- --testNamePattern="Subscription"
```

Expected: GET /status returns `{ tier: "free", active: false }` for userId=1

- [ ] **Step 4: Run research tests**

```bash
cd backend
API_URL=http://localhost:5000 TEST_JWT=any-token npm run test:sprint2 -- --testNamePattern="Research"
```

Expected: Public endpoints (volatility, rarity) return 200; Pro endpoints return 403 for free-tier user

- [ ] **Step 5: Run full sprint2 suite and record results**

```bash
cd backend
API_URL=http://localhost:5000 TEST_JWT=any-token npm run test:sprint2 2>&1 | tee test-results-sprint2.txt
```

Expected: Results file created; note exact pass/fail count

- [ ] **Step 6: Fix any failing tests**

For each failure, check the error and apply fix. Common issues:
- `userId not found` → seed DB has no user with id=1, add seed entry
- `skin not found` → `mockSkinId=1` doesn't exist, query DB for real ID: `npx prisma studio` or `SELECT id FROM skins LIMIT 1`
- 403 on Pro endpoint when expecting 200 → check `tier` field in user record for userId=1

- [ ] **Step 7: Commit fixes**

```bash
git add backend/src/__tests__/sprint2.test.js
git commit -m "test: fix sprint2 test fixtures for local userId=1 mock"
```

---

## Task 3: Fix Frontend Sign-In Button

The Clerk sign-in modal/page may not be wired to the nav "login" button. Verify and fix.

**Files:**
- Read: `frontend/src/app/page.tsx` (home page, find login button)
- Read: `frontend/src/components/` (nav component with login button)
- Modify: nav component if href is wrong

- [ ] **Step 1: Find the nav/header component**

```bash
grep -r "sign-in\|SignIn\|login\|Login" frontend/src/components --include="*.tsx" -l
```

Expected: 1-2 files with the login button

- [ ] **Step 2: Check the login button href**

Read the file found above. Look for the button/link that says "Login" or "Sign In". Check the `href`.

Expected correct value: `href="/sign-in"` (matches `frontend/src/app/sign-in/[[...sign-in]]/page.tsx`)

- [ ] **Step 3: Fix href if wrong**

If `href` is not `/sign-in`, update it:
```tsx
// Wrong:
<Link href="/login">Login</Link>
// Correct:
<Link href="/sign-in">Sign In</Link>
```

- [ ] **Step 4: Verify in browser**

Navigate to `http://localhost:3000`, click the login button.
Expected: Redirects to `http://localhost:3000/sign-in` with Clerk UI

- [ ] **Step 5: Test full Clerk sign-up flow**

1. Click "Sign up" on the Clerk page
2. Enter email, get verification code
3. Complete signup
4. Expected: Redirects to `/dashboard`

- [ ] **Step 6: Verify backend receives Clerk user**

After login, check backend receives synced user:
```bash
curl http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <clerk-jwt-from-browser-devtools>"
```

Get JWT: Browser DevTools → Application → Local Storage → `clerk-db-jwt` or Network tab → any API request → Authorization header

- [ ] **Step 7: Commit nav fix if changed**

```bash
git add frontend/src/components/<nav-file>.tsx
git commit -m "fix: sign-in button href points to /sign-in"
```

---

## Task 4: Run Playwright E2E Tests

Frontend has Playwright tests for auth guards, features, and smoke tests. Run them against both local servers.

**Files:**
- Read: `frontend/tests/e2e.spec.ts`
- Read: `frontend/tests/guards.spec.ts`
- Read: `frontend/tests/features.spec.ts`
- Modify if needed: `frontend/playwright.config.ts`

- [ ] **Step 1: Install Playwright browsers if not installed**

```bash
cd frontend
npx playwright install chromium
```

Expected: Chromium downloaded or "already installed"

- [ ] **Step 2: Run smoke tests (chromium only, fast)**

```bash
cd frontend
npx playwright test e2e.spec.ts --project=chromium 2>&1 | tee playwright-results.txt
```

Expected: Tests show PASS/FAIL — not "server not reachable"

- [ ] **Step 3: Run guard tests**

```bash
cd frontend
npx playwright test guards.spec.ts --project=chromium
```

Expected: Auth redirects work — unauthenticated users hit `/sign-in`

- [ ] **Step 4: Run feature tests**

```bash
cd frontend
npx playwright test features.spec.ts --project=chromium
```

Expected: Feature flags/premium gates render correctly

- [ ] **Step 5: View HTML report for failures**

```bash
cd frontend
npx playwright show-report
```

Opens browser with full failure details including screenshots.

- [ ] **Step 6: Fix test fixture issues**

Most common Playwright failures in this codebase:

**`data-testid` missing:** Add the attribute to the component:
```tsx
// In PortfolioDashboard.tsx:
<div data-testid="portfolio-chart">...</div>
```

**Mock not matching Clerk:** If `mockAuthenticatedUser` localStorage mock doesn't work with Clerk, update helper to use Clerk's test mode. In `frontend/tests/helpers/auth.ts`:
```ts
async mockAuthenticatedUser(role = 'user', tier = 'free') {
  await this.page.route('**/api/v1/**', async route => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'Authorization': 'Bearer mock-test-token'
      }
    });
  });
}
```

- [ ] **Step 7: Commit test fixes**

```bash
git add frontend/tests/ frontend/src/
git commit -m "test: fix playwright fixtures and missing data-testid attributes"
```

---

## Task 5: Validate Stripe Checkout (Manual)

Stripe integration requires manual verification in test mode. No automated test for checkout redirect — Stripe's test UI must be verified by hand.

**Files:**
- Read: `backend/src/routes/subscriptionRoutes.js`
- Read: `backend/.env` (confirm STRIPE_SECRET_KEY is test key `sk_test_...` not `sk_live_...`)

- [ ] **Step 1: Verify Stripe is in test mode**

```bash
grep "STRIPE_SECRET_KEY" backend/.env
```

Expected: value starts with `sk_test_` — if `sk_live_`, DO NOT proceed (use test key)

If missing test key: Go to [dashboard.stripe.com](https://dashboard.stripe.com) → toggle "Test mode" → Developers → API Keys → copy `sk_test_...`

- [ ] **Step 2: Log in to the frontend**

Navigate to `http://localhost:3000/sign-in`, sign in with your Clerk account.

- [ ] **Step 3: Trigger Stripe checkout**

Navigate to `http://localhost:3000/dashboard` or find the Upgrade button.
Click "Upgrade to Pro" / "Subscribe".

Expected: Redirects to `https://checkout.stripe.com/...` (Stripe-hosted page)

- [ ] **Step 4: Complete test payment**

On Stripe checkout page, use test card:
- Card: `4242 4242 4242 4242`
- Expiry: `12/34`
- CVC: `123`
- Name/address: anything

Expected: Payment succeeds, redirects back to app

- [ ] **Step 5: Verify subscription activated**

After redirect, check subscription status:
```bash
curl http://localhost:5000/api/v1/subscriptions/status \
  -H "Authorization: Bearer <your-clerk-jwt>"
```

Expected: `{ "tier": "pro", "active": true, "stripeSubscriptionId": "sub_..." }`

- [ ] **Step 6: Verify Pro research endpoints now accessible**

```bash
curl http://localhost:5000/api/v1/research/portfolio \
  -H "Authorization: Bearer <your-clerk-jwt>"
```

Expected: 200 with research data (not 403)

---

## Task 6: Final Pass — Fix Remaining Issues & Document Results

- [ ] **Step 1: Run all backend tests one final time**

```bash
cd backend
API_URL=http://localhost:5000 TEST_JWT=any-token npm test 2>&1 | tee final-test-results.txt
cat final-test-results.txt | grep -E "Tests:|passed|failed"
```

Expected: All tests pass or failures documented with known reason

- [ ] **Step 2: Run all Playwright tests one final time**

```bash
cd frontend
npx playwright test --project=chromium 2>&1 | tail -20
```

Expected: Pass rate documented

- [ ] **Step 3: Update CLAUDE.md with test results**

In `CLAUDE.md`, update the metrics table:
```markdown
| Sprint 2 Integration Tests | X/Y passing | ✅ or 🟡 |
| Playwright E2E Tests       | X/Y passing | ✅ or 🟡 |
| Stripe Checkout (manual)   | Verified    | ✅       |
```

- [ ] **Step 4: Commit results**

```bash
git add CLAUDE.md final-test-results.txt
git commit -m "test: sprint 2 testing complete - document results"
```

---

## Known Issues & Context

**Auth mock (local dev):** `verifyClerkJwt.js` — if `CLERK_JWKS_URL` not set in `backend/.env`, any Bearer token passes with `req.userId = 1`. This is intentional for local testing.

**User seeding:** `userId = 1` must exist in DB. If tests fail with "user not found", run:
```bash
cd backend
npx prisma studio
```
Check `User` table for id=1. If missing, add via:
```bash
node -e "
import('./src/lib/prisma.js').then(({prisma}) =>
  prisma.user.create({ data: { id: 1, clerkId: 'test-clerk-id', email: 'test@test.com', tier: 'free' } })
  .then(console.log)
)"
```

**Stripe webhook (local):** Webhook events won't auto-fire locally without Stripe CLI. For local subscription testing, either use Stripe CLI (`stripe listen --forward-to localhost:5000/api/v1/subscriptions/webhook`) or manually update user tier in DB after checkout.

**DEV tokens to remove before production:**
- `DEV_TEST_TOKEN` in `backend/.env`
- `DEV_FREE_TOKEN` in `backend/.env`
