# CEO Checklist — Sprint 0 (2026-05-20)

Things only Arthur can do (account signups, API keys, DNS). Each blocks a portion of Sprint 0 from being fully production-ready.

---

## 1. PostHog (analytics) — 10 min

1. Sign up: https://posthog.com/signup → **EU region** (DE GDPR compliance)
2. Create project: "CS2 Skin Tracker"
3. Settings → Project API Key → copy
4. Add to **Vercel** (frontend) env vars:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   ```
5. Add to local `frontend/.env.local` for dev (optional — silent no-op without it)

**Why:** without these vars set, analytics silently does nothing (won't crash). Once set, all events fire.

---

## 2. Sentry (error tracking) — 10 min

1. Sign up: https://sentry.io/signup → free plan
2. Create two projects:
   - "cs2-skintracker-frontend" (platform: Next.js)
   - "cs2-skintracker-backend" (platform: Node Express)
3. Copy DSNs from each project's settings
4. Add to **Vercel** env vars (frontend):
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/456
   SENTRY_DSN=https://...@o123.ingest.sentry.io/456   # same, server-side use
   ```
5. Add to **Render** env vars (backend):
   ```
   SENTRY_DSN=https://...@o123.ingest.sentry.io/789
   ```
6. (Optional, for source-map upload) Generate auth token, add to Vercel:
   ```
   SENTRY_AUTH_TOKEN=sntrys_xxx
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=cs2-skintracker-frontend
   ```

**Why:** without DSN, init silently skips. With DSN, errors flow into Sentry dashboard. Source-map upload is optional but makes stack traces readable.

---

## 3. Custom Domain — 30 min

Trust-killer right now: `backend-three-theta-44.vercel.app`. Paying users won't trust it.

Suggested options (cheap, available, decent name):
- `skintrackr.com` (~$12/yr)
- `cs2tracker.app` (~$15/yr)
- `cs2skins.pro` (~$30/yr)
- `csgomarket.tools` (~$10/yr)

Steps:
1. Pick + buy at Cloudflare Registrar (no markup, free WHOIS privacy)
2. **Vercel** (frontend): Project → Settings → Domains → add domain, follow DNS records
3. **Render** (backend): use subdomain `api.<domain>` → Service → Settings → Custom Domains → add `api.skintrackr.com`
4. Update `ALLOWED_ORIGINS` in Render env to include new frontend domain
5. Update `FRONTEND_URL` in Render env
6. Update `NEXT_PUBLIC_API_URL` in Vercel env to `https://api.<domain>`
7. Re-issue Clerk redirect URLs in Clerk Dashboard (custom domain)
8. Update Stripe webhook URL in Stripe Dashboard

**Why:** trust + brand + email-sending (mail-from on custom domain has better deliverability).

---

## 4. Stripe Live Mode — 20 min

1. **Stripe Dashboard** → toggle from Test to Live mode
2. Create products + prices:
   - **Lite Monthly:** €6.99 EUR / month, recurring
   - **Lite Annual:** €67.00 EUR / year, recurring (= €6.99 × 12 × 0.8, rounded)
   - **Pro Monthly:** €9.99 EUR / month, recurring
   - **Pro Annual:** €96.00 EUR / year, recurring (= €9.99 × 12 × 0.8, rounded)
3. Copy each `price_xxx` ID
4. Add to **Render** env:
   ```
   STRIPE_PRICE_LITE_MONTHLY=price_xxx
   STRIPE_PRICE_LITE_ANNUAL=price_xxx
   STRIPE_PRICE_PRO_MONTHLY=price_xxx
   STRIPE_PRICE_PRO_ANNUAL=price_xxx
   STRIPE_SECRET_KEY=sk_live_xxx   # swap from sk_test_xxx
   ```
5. Webhook: Dashboard → Developers → Webhooks → add endpoint
   - URL: `https://api.<domain>/api/v1/subscriptions/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy `whsec_xxx` → `STRIPE_WEBHOOK_SECRET` in Render
6. (Optional but recommended) Stripe Tax → activate for EU VAT auto-collection

**Why:** without these, checkout button → "no such price" 500 error. Tax compliance is mandatory for B2C EU sales.

**Code is ready** — backend just needs the 4 price IDs + live key + webhook secret swapped.

---

## 5. Clerk Live Keys — 10 min

1. **Clerk Dashboard** → switch instance from Development to Production (or create new prod instance)
2. Copy live publishable key + secret key
3. Add to **Vercel** env:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
   CLERK_SECRET_KEY=sk_live_xxx
   ```
4. Add to **Render** env (same):
   ```
   CLERK_SECRET_KEY=sk_live_xxx
   CLERK_AUDIENCE=cs2-skintracker-api   # exact spelling: skintracker (NOT skintrackr)
   ```
   **Note:** the audience claim must match this string EXACTLY in your Clerk
   JWT template. The fallback in `verifyClerkJwt.js` also uses `skintracker`
   — typo in the audience name will silently reject every JWT.
5. Configure allowed origins / redirect URLs in Clerk Dashboard to match custom domain
6. **Important:** uncomment Clerk audience validation in `backend/src/middleware/verifyClerkJwt.js` ~line 92. Currently disabled for dev; required in prod.

**Why:** test keys cap at 100 users. Live keys + audience validation = real auth.

---

## 5b. Steam OpenID State Secret — 2 min

For the Steam account-link flow to be safe across the stateless OpenID
redirect, we sign the `return_to` URL with an HMAC. Generate a random
32+ character secret and set it in **Render** env:

```
STEAM_OPENID_STATE_SECRET=<paste 32-char random string>
STEAM_OPENID_RETURN_BASE_URL=https://api.<your-domain>   # or http://localhost:5000 for dev
```

Generate with:
```bash
openssl rand -hex 32
```

**Why:** without the secret, the OpenID callback can't verify that the
state param wasn't tampered with — a malicious link could attach a
Steam account to the wrong user.

---

## 6. DEV Tokens Removal — 5 min

Check that the following env vars are **NOT** set in Render (backend) prod:
- `DEV_TEST_TOKEN`
- `DEV_TEST_CLERK_ID`
- `DEV_FREE_TOKEN`
- `DEV_FREE_CLERK_ID`
- `NODE_TLS_REJECT_UNAUTHORIZED` (CRITICAL — this disables TLS verification; catastrophic in prod)

Render Dashboard → Service → Environment → remove if present.

`backend/.env.example` should only show placeholders, not real values. I'll audit this file in Sprint 0 as a follow-up.

**Why:** these are dev-only auth bypasses. If accidentally in prod, anyone with the token gets full access to user accounts.

---

## 7. Resend (email sending) — optional, can wait

We send email alerts. If using Resend (or any email provider):
1. Verify sender domain (DKIM, SPF, DMARC) on custom domain
2. `RESEND_API_KEY` in Render env
3. `EMAIL_FROM=alerts@<domain>`

Without this, alerts can't be sent → alert feature is broken for paying users.

---

## Order of operations (suggested)

1. Domain (30 min) — unblocks everything else
2. Stripe Live (20 min) — unblocks taking money
3. Clerk Live (10 min) — unblocks real auth
4. Sentry (10 min) — unblocks visibility into errors
5. PostHog (10 min) — unblocks measurement
6. DEV tokens cleanup (5 min) — closes security hole
7. Resend / email (15 min) — unblocks alerts on prod domain

**Total:** ~100 min of CEO time → fully cash-ready system.

---

## What I (Claude) am doing in parallel

- ✅ Free tier 1 → 2 alerts (shipped, single quota config)
- ⏳ Legal pages (Privacy / ToS / Refund) drafts
- ⏳ PostHog SDK + event taxonomy (silent no-op until key)
- ⏳ Sentry SDK + error boundary (silent no-op until DSN)
- ⏳ Repricing pricing page + annual toggle UI
- ⏳ Cookie consent banner
- ⏳ `.env.example` audit + DEV tokens grep

When all CEO items above are filled in and my Sprint 0 work is merged, we run an end-to-end test: fresh signup → onboarding → portfolio add → upgrade to Pro Monthly → verify Stripe live charge + Sentry capture + PostHog event → cancel → reactivate. That's "Cash-Ready" done.
