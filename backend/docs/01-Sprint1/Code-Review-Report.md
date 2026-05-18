# Sprint 1 Code Review Report

**Date**: 2026-05-06  
**Reviewer**: Senior Code Reviewer (Claude Sonnet 4.6)  
**Scope**: 7 files — Sprint 1 Freemium SaaS infrastructure  
**Stack**: Node 22, Express, Prisma 6, PostgreSQL (Supabase), Clerk JWT, Stripe, ESM

---

## 1. Executive Summary

| Dimension | Score |
|-----------|-------|
| Security | 5 / 10 |
| Performance | 7 / 10 |
| Error Handling | 7 / 10 |
| Maintainability | 7 / 10 |
| Production Readiness | 5 / 10 |
| **Overall** | **6 / 10** |

**Critical issues found**: 3  
**High issues found**: 4  
**Production ready**: NO — ship with conditions (3 critical issues must be resolved first)

The Sprint 1 implementation covers its planned scope well and several patterns (Stripe raw-body placement, HMAC-SHA256 hashing, tier hierarchy, async logging via `setImmediate`) are correctly executed. The blockers are concentrated in three areas: a broken CORS policy, a webhook error-disclosure bug, and a dual-PrismaClient problem that will exhaust connection pools under load.

---

## 2. Critical Issues

| # | File | Line (approx.) | Severity | Description | Fix |
|---|------|----------------|----------|-------------|-----|
| C1 | `app.js` | 91–119 | **Critical** | CORS allows every origin unconditionally. The whitelist check falls through to `callback(null, true)` even when the origin is not in the list (line 117–118). The redundant manual-header middleware at lines 143–163 sets `Access-Control-Allow-Origin` to the raw requesting origin or `*`, bypassing `credentials: true` restrictions entirely. Any origin can make credentialed cross-site requests. | Remove the fallback `callback(null, true)` branch on line 118. Call `callback(new Error('Not allowed by CORS'))` instead. Remove the duplicate manual-header middleware block (lines 143–163). Keep only the `cors()` middleware. |
| C2 | `webhook-stripe.js` | 46–48 | **Critical** | On any error inside webhook processing (including Stripe signature verification failures) the handler returns HTTP 200 with `{ error: error.message }` in the body. This leaks internal error strings to callers and, more critically, means a signature-verification failure (i.e. a forged request) receives a 200 ACK. Stripe itself will not re-send legitimate events that got a 200, masking delivery failures. | Return HTTP 400 for signature errors, 500 for unexpected errors. Never expose `error.message` to external callers. Return only `{ received: false }` on failure paths. |
| C3 | `roleHelpers.js` | 4 | **Critical** | `roleHelpers.js` instantiates its own `new PrismaClient()` while every other file imports the shared singleton from `prisma/prismaClient.js`. Under load this creates a second connection pool, doubling connection consumption. On Supabase free/pro tiers the default connection limit is 15–25; two saturated pools will cause `P2024` (connection timeout) errors. | Import the shared `prismaClient.js` singleton instead of calling `new PrismaClient()` directly. |

---

## 3. Security Findings

### SEC-01 — CORS policy renders origin allowlist useless (Critical — C1 above)
`app.js` lines 104–119 build a whitelist and run a pattern check, but the else-branch (line 117) calls `callback(null, true)` regardless. Combined with the redundant manual middleware at line 149 (`res.header('Access-Control-Allow-Origin', origin || '*')`), `credentials: true` offers no protection. Any website can make authenticated AJAX calls using a victim user's session cookie.

The wildcard pattern check at lines 105–111 also uses `new RegExp(pattern)` on attacker-controlled input without anchoring or sanitisation, creating a minor ReDoS surface.

**Fix**: Single CORS layer, strict allowlist, reject unknown origins.

### SEC-02 — Dev bypass tokens present and guarded only by NODE_ENV (High)
`auth.js` lines 19–39 activate the dev token bypass when `NODE_ENV !== 'production'`. This is a reasonable guard, but:
1. The error message on line 37 echoes the `clerkId` back to the caller: `Dev test user not found in DB (clerkId=${match.clerkId})`. If `NODE_ENV` is misconfigured on staging, this leaks internal identifiers.
2. There is no check that `DEV_TEST_TOKEN` / `DEV_FREE_TOKEN` are non-empty before comparison. If either env var is undefined, `e.token` is `undefined` and the `find` callback compares `undefined === token` (always false), which is safe by accident rather than by design.

**Fix**: Assert token env vars are non-empty at startup when `NODE_ENV !== 'production'`. Remove the `clerkId` from the 401 error body.

### SEC-03 — Stripe error body exposes internal message to external caller (Critical — C2 above)
`webhook-stripe.js` line 48: `res.status(200).json({ received: true, error: error.message })`. Stripe signature errors include the full mismatch detail. These strings can contain fragments of the raw body and header values useful to an attacker probing the endpoint.

### SEC-04 — `keyPreview` uses raw `key` column which stores the SHA-256 hash (Medium)
`api-keys.js` lines 58–62: `k.key` is the stored SHA-256 hash (64 hex chars). The preview shown to users is `hash[0..3]...hash[60..64]`, not a preview of the original key the user received. This is harmless from a security standpoint but confusing and misleading — users will not recognise their own key by its hash prefix.

**Fix**: Either store a separate `keyPrefix` column (first 8 chars of the plaintext key, saved at creation time), or omit the preview on the list endpoint since the plaintext was already shown once at creation.

### SEC-05 — `parseInt` on untrusted route params without NaN guard (Low)
`api-keys.js` lines 153, 180, 227 call `parseInt(keyId)` and pass directly into `prisma.aPIKey.findUnique({ where: { id: parseInt(keyId) } })`. If `keyId` is `"abc"`, `parseInt` returns `NaN`. Prisma will throw a runtime error rather than silently accepting it, but the error path falls through to the generic 500 handler rather than a 400, giving no useful response to a legitimate client sending a bad ID.

**Fix**: Add `if (isNaN(id)) return res.status(400).json({ error: 'Invalid key ID' })` before each Prisma call, or use a shared `parseIntParam` helper.

### SEC-06 — No rate limiting on public B2B API route (High)
`app.js` mounts `publicAPIRouter` at `/api/public` with no Express rate limiter. Per-key call counting in `logAPIUsage` is async-fire-and-forget via `setImmediate`. A burst of simultaneous requests will all pass `validateAPIKeyUsage` before any counter increment lands in the database, allowing quota bypass by a factor of the burst size.

**Fix**: Add the existing `sensitiveLimiter` (or a new per-IP limiter) to the `/api/public` mount. For accurate quota enforcement, increment the counter synchronously before returning the response (or use Redis atomic increment with a write-back strategy).

---

## 4. Performance Notes

### PERF-01 — Dual PrismaClient instances (Critical — C3 above)
Two connection pools run in parallel. Under 500 concurrent requests this will saturate Supabase's connection limit and cause latency spikes above the measured p95 of 99 ms.

### PERF-02 — logAPIUsage fires two sequential DB writes per request (Medium)
`public-api.js` lines 72–91 run `prisma.aPILog.create` then `prisma.aPIKey.update` inside a single `setImmediate` callback with two `await` calls in series. These are independent writes and can run in parallel.

```js
// Current (sequential):
await prisma.aPILog.create({ ... });
await prisma.aPIKey.update({ ... });

// Better (parallel):
await Promise.all([
  prisma.aPILog.create({ ... }),
  prisma.aPIKey.update({ ... })
]);
```

### PERF-03 — Price-history statistics computed in JavaScript (Low)
`public-api.js` lines 218–220: `Math.min(...history.map(...))`, `Math.max(...)`, and `.reduce(...)` iterate the full `history` array three times in JS after fetching all rows. For a 365-day window this is at most 365 rows — acceptable now, but if data density increases this should move to a Prisma aggregate query (`_min`, `_max`, `_avg`) to avoid fetching all rows.

### PERF-04 — Dynamic `import()` inside the global error handler (Low)
`app.js` lines 197–207: `import("./utils/logger.js")` is called on every uncaught Express error. The dynamic import is resolved and module-loaded on the first call, then cached by Node's module system. This is safe at runtime but is an anti-pattern — import `logger` statically at the top of `app.js` like every other file does.

### PERF-05 — Missing DB index on `APIKey.key` (Medium)
`public-api.js` line 35 looks up `prisma.aPIKey.findUnique({ where: { key: hashedKey } })`. The schema marks `key` with `@unique` which creates a unique index in PostgreSQL — this is fine. No additional index is needed. (No issue — noting this explicitly as it was a review concern.)

### PERF-06 — `callsPerDay` set to `undefined` for free-tier users creating API keys (Medium)
`api-keys.js` line 122: `callsPerDay: limits.apiCallsPerDay`. The `free` tier in `TIER_LIMITS` has no `apiCallsPerDay` property, so this value is `undefined`. Free-tier users are blocked from creating keys at line 33–38, so this code path is unreachable today. However, if that check is ever relaxed, a key with `callsPerDay: undefined` will silently store `NULL` in the database, breaking the `remaining` calculation on line 68 (`k.callsPerDay - k.callsUsed` → `NaN`).

---

## 5. Error Handling Assessment

### Strengths
- All route handlers have try/catch with specific logger calls and safe generic 500 responses.
- Stripe webhook correctly checks for missing `stripe-signature` header (400).
- Tier gating and auth middleware never expose stack traces to clients.
- `getActiveSubscription` in stripe-service catches errors and returns `null` rather than throwing, which is appropriate for a query helper.

### Gaps

**EH-01** — `webhook-stripe.js` line 48: returns 200 on all errors including signature failures. This is the most severe error handling gap (see C2 / SEC-03).

**EH-02** — `stripe-service.js` `handleSubscriptionUpdated` and `handleCheckoutCompleted`: if `subscription.items.data` is empty (malformed Stripe payload), `data[0].price.id` throws a TypeError that propagates up through `handleWebhookEvent` to the route handler. Given C2's catch-all 200 response, this silently drops the event.

**Fix**: Add a guard: `if (!subscription.items?.data?.length) throw new Error('Subscription has no items')`.

**EH-03** — `updateUserBasedOnWebhook` in `webhook-stripe.js`: the `payment.succeeded` and `payment.failed` cases only log; they do not handle missing `userId`. The `userId` guard at line 65 only applies to the `subscription.*` events since `payment.*` events populate `stripeCustomerId` but not `userId` (the service returns only `invoiceId` and `stripeCustomerId` for those events). The switch falls through silently, which is correct behaviour here, but the comment at line 65 ("Webhook missing userId") is misleading — it implies all paths need userId, when payment events do not.

**EH-04** — `roleHelpers.js` `getUserRoleFromDB`: the catch block returns a default `{ isUser: false }` object. This means a transient DB error (connection failure, query timeout) will be silently treated as "user not found" and return a 401 to the client, indistinguishable from a legitimate auth failure. Callers have no way to distinguish DB errors from missing users.

---

## 6. Maintainability Review

### MNT-01 — JSDoc comment header uses `require()` syntax in ESM project (Low)
`stripe-service.js` lines 6–7: `const stripe = require('./services/stripe-service')`. The entire project uses `"type": "module"` / ESM. These stale CommonJS examples in JSDoc will confuse any developer who copies them. Update to `import` syntax.

Same issue in `tier-gating.js` line 7.

### MNT-02 — `tier` field in `APIKey` model misaligned with `TIER_LIMITS` keys (Medium)
`schema.prisma` line 409: `tier` defaults to `"starter"` with values `starter, developer, enterprise`.  
`tier-gating.js` defines tiers as `free, pro, enterprise`.  
`api-keys.js` line 120 stores `'developer'` (not `'pro'`) for pro users.  
`validateAPIKeyUsage` in `tier-gating.js` line 151 does `TIER_LIMITS[apiKey.tier]` — for a key with `tier: 'developer'` this returns `undefined` and falls back to `TIER_LIMITS.free`, meaning pro API keys are rate-limited as free tier (100 calls/day vs 10,000). This is a **logic bug with direct revenue impact**.

**Fix**: Align the `APIKey.tier` stored values with the `TIER_LIMITS` keys (`free`, `pro`, `enterprise`). Update the schema default from `starter` to `free`, remove `developer` tier, and update `api-keys.js` line 120 to store `req.user.tier` directly.

### MNT-03 — `validateAPIKeyUsage` checks `callsUsed >= limit` BEFORE `isActive` check (Medium)
`tier-gating.js` lines 162–173: the daily limit check runs first, then `isActive`, then `expiresAt`. An inactive or expired key that has zero calls used will pass the daily limit check before being correctly rejected. The order should be: isActive → expiresAt → daily limit, so the most discriminating filters run first and produce clearer error messages.

### MNT-04 — `requireTier` always displays Pro pricing even when enterprise is required (Low)
`tier-gating.js` line 88: `const limits = getTierLimits('pro')` is hardcoded. If a route uses `requireTier('enterprise')`, the upgrade message still shows Pro pricing. Change to `getTierLimits(minTier)`.

### MNT-05 — Dead code: `daysPassed` block in `validateAPIKeyUsage` (Low)
`tier-gating.js` lines 154–160: the `if (daysPassed >= 1)` block contains only a comment ("Would normally reset here") and no code. Remove it or implement daily reset logic.

### MNT-06 — CORS configuration has JSX comment syntax in plain JS (Low)
`app.js` lines 77, 139, 142, 165: `{/* ... */}` comment syntax is JSX, not valid JavaScript. Node will not throw on these because they appear inside template literals or as block comments, but they signal copy-paste from a React component and should be cleaned up.

---

## 7. Production Readiness Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Stripe webhook signature verification enforced | ⚠️ Verified correctly but errors return HTTP 200 — fix C2 before production |
| 2 | Dev bypass tokens gated by NODE_ENV check | ⚠️ Guard exists but clerkId leaks in error body; confirm NODE_ENV is `production` in Vercel |
| 3 | CORS restricted to known origins | ❌ All origins accepted unconditionally — fix C1 before production |
| 4 | API key hashed before DB storage (HMAC-SHA256) | ✅ Correctly implemented in both creation and lookup |
| 5 | No secrets hardcoded in source files | ✅ All secrets via env vars; fallback price IDs `price_pro_xxx` are placeholders, not secrets |
| 6 | Rate limiting on user-facing and admin routes | ⚠️ sensitiveLimiter + adminLimiter present, but `/api/public` has no rate limiter |
| 7 | Single Prisma connection pool | ❌ Dual pool — roleHelpers.js creates its own PrismaClient |
| 8 | Error responses free of sensitive internal detail | ⚠️ Webhook handler exposes error.message; auth.js exposes clerkId on dev path |
| 9 | Tier/quota enforcement coherent end-to-end | ❌ APIKey.tier stores `developer` but TIER_LIMITS uses `pro` — pro quota falls back to free limits |

---

## 8. Recommendations

### P1 — Must fix before any production deployment

**P1-A**: Fix CORS (`app.js`). Remove the fallback `callback(null, true)`. Remove the duplicate manual-header middleware block entirely.

**P1-B**: Fix webhook error response (`webhook-stripe.js`). Return 400 on signature failure, 500 on internal errors. Strip `error.message` from all response bodies on this route.

**P1-C**: Fix dual PrismaClient (`roleHelpers.js`). Replace `new PrismaClient()` with the shared import from `../../prisma/prismaClient.js`.

**P1-D**: Fix tier mismatch (`api-keys.js` + `schema.prisma` + `tier-gating.js`). Align stored tier values to `free / pro / enterprise`. This is a silent revenue bug — pro users are being quota-capped at free-tier limits right now.

### P2 — Fix before first paying customer

**P2-A**: Add rate limiter to `/api/public` mount in `app.js`. Burst quota bypass is exploitable by any API key holder.

**P2-B**: Fix `getRouteHandlers` subscription item guard in `stripe-service.js` (`handleSubscriptionUpdated`, `handleCheckoutCompleted`) — add null-check on `items.data[0]`.

**P2-C**: Refactor `validateAPIKeyUsage` check order (isActive → expiresAt → daily limit).

**P2-D**: Add `NaN` guards for `parseInt(keyId)` in `api-keys.js` (three callsites).

**P2-E**: Remove dead `daysPassed` block in `tier-gating.js`.

### P3 — Quality improvements (post-launch)

**P3-A**: Replace dynamic `import()` in global error handler (`app.js` line 198) with a static top-level import.

**P3-B**: Parallelise the two sequential DB writes in `logAPIUsage` with `Promise.all`.

**P3-C**: Store `keyPrefix` column at API key creation time so list endpoint can show a meaningful plaintext preview instead of a hash preview.

**P3-D**: Update all JSDoc examples from `require()` to `import` syntax.

**P3-E**: Fix `requireTier` to use `getTierLimits(minTier)` instead of hardcoded `'pro'`.

**P3-F**: Remove JSX comment syntax `{/* */}` from `app.js`.

---

## 9. Positive Observations

- **Stripe raw-body placement is correct.** Mounting `stripeWebhookRouter` before `express.json()` at line 56 of `app.js` is exactly right and a common mistake in other implementations.

- **HMAC-SHA256 hashing for API keys is correct.** `crypto.createHash('sha256').update(keyValue).digest('hex')` is used consistently at key creation and key lookup. The raw key is never stored.

- **Tier hierarchy comparison is clean.** `tierHierarchy.indexOf()` in `requireTier` is simple, readable, and correctly handles `free < pro < enterprise` without brittle string comparisons.

- **`setImmediate` for async logging is a good pattern.** Decoupling request latency from DB write latency in `logAPIUsage` is the right approach and consistent with the measured 57 ms average response time.

- **Key count check before creation is correct.** `api-keys.js` checks existing key count against the tier limit before creating a new key, preventing over-provisioning.

- **Public API input validation is solid.** Sort field allowlist and order validation in `public-api.js` prevent injection via `orderBy`. Limit is capped at 1000. Days range is clamped between 1 and 365.

- **Schema indexes are well-considered.** `APIKey` and `APILog` have indexes on `userId`, `isActive`, `tier`, `apiKeyId`, `endpoint`, and `createdAt` — the fields most likely to appear in WHERE and ORDER BY clauses. `PriceHistory` has a composite unique index on `[skinId, date]` which doubles as the lookup index.

- **Webhook event handler returns 200 for unhandled event types.** This is correct Stripe practice — Stripe requires a 2xx ACK for events you have no handler for to prevent infinite retries.

---

## 10. Verdict

**DO NOT SHIP** in current state.

Three issues block production deployment: the open CORS policy (C1) allows any website to make credentialed API calls on behalf of authenticated users; the webhook handler's blanket 200-on-error (C2) is both a security leak and a Stripe reliability problem; and the tier mismatch (MNT-02 / P1-D) means every pro API key currently operates under free-tier quota limits, which is a direct billing correctness failure.

All three P1 fixes are localised changes — none require architectural work. Estimated fix time: 2–3 hours. After those fixes, the implementation is solid enough to ship to a limited beta.

**Conditions for shipping**:
1. C1 (CORS) resolved and regression-tested with a real browser + credentials.
2. C2 (webhook 200-on-error) fixed and verified against Stripe CLI test events (`stripe trigger customer.subscription.deleted`).
3. C3 (dual PrismaClient) resolved.
4. P1-D (tier mismatch) fixed — verify with an end-to-end test: create a pro key, call the public API 10,001 times, confirm 429 at limit 10,000 not 100.
5. `NODE_ENV=production` confirmed in Vercel environment before go-live.
