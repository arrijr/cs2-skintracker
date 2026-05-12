# Business Plan Execution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the business-operations layer not covered by existing feature plans — affiliate link integration, internal MRR/KPI monitoring endpoint, and conversion analytics — so the business plan KPIs can actually be measured.

**Architecture:** Three additions: (1) a lightweight admin metrics API endpoint that calculates live MRR, user counts, and churn from the DB; (2) Plausible Analytics integration for front-end conversion event tracking; (3) DMarket affiliate link wrapper utility so all outbound marketplace links earn commissions.

**Tech Stack:** Express 5 / Prisma 6 (metrics endpoint), Plausible Analytics self-hosted or cloud (conversion events), React component wrapper (affiliate links).

---

## Plan Index — Existing Plans (no duplication needed)

| Business Plan Section | Covered By |
|----------------------|-----------|
| Phase 1: Bug fixes (researchService, isPremium, Clerk audience) | `plans/2026-05-10-month1-launch.md` Task 1 |
| Phase 1: Tech debt cleanup (CORS, DEV tokens, NODE_TLS) | `plans/2026-05-10-month1-launch.md` Task 2 |
| Phase 1: Production setup (domain, Clerk live keys, Vercel env) | `plans/2026-05-10-month1-launch.md` Task 3 |
| Phase 1: Design system unification | `plans/2026-05-10-month1-launch.md` Task 4 |
| Phase 1: Landing page rewrite | `plans/2026-05-10-month1-launch.md` Task 5 |
| Phase 1: Soft launch (Reddit, Discords, HN) | `plans/2026-05-10-month1-launch.md` Task 6 |
| Phase 2: Smart alerts engine (volatility, float-tier, case EV) | `plans/2026-05-10-month2-smart-alerts.md` |
| Phase 2: Discord bot + email delivery | `plans/2026-05-10-month2-smart-alerts.md` |

**This plan covers only the gaps:** affiliate links, internal MRR metrics, and conversion analytics.

---

## Task 1: Internal MRR & KPI Metrics Endpoint

Adds `/api/v1/admin/business-metrics` — returns live MRR, user counts by tier, and churn estimate. Lets you check the business plan decision gates (e.g. "MRR < 100€ at day 60?") without leaving the codebase.

**Files:**
- Create: `backend/src/services/metricsService.js`
- Modify: `backend/src/routes/adminMetricsRoutes.js`
- Test: `backend/src/__tests__/metrics.test.js`

- [ ] **Step 1: Write failing test**

Create `backend/src/__tests__/metrics.test.js`:
```js
import { describe, it, expect, beforeAll } from 'vitest';
import { calculateBusinessMetrics } from '../services/metricsService.js';

describe('metricsService', () => {
  it('returns MRR, user counts, and tier breakdown', async () => {
    const metrics = await calculateBusinessMetrics();
    expect(metrics).toHaveProperty('mrr');
    expect(metrics).toHaveProperty('totalUsers');
    expect(metrics).toHaveProperty('payingUsers');
    expect(metrics).toHaveProperty('freeUsers');
    expect(metrics).toHaveProperty('liteUsers');
    expect(metrics).toHaveProperty('proUsers');
    expect(typeof metrics.mrr).toBe('number');
  });

  it('calculates MRR correctly from tier counts', async () => {
    const metrics = await calculateBusinessMetrics();
    const expectedMrr = metrics.liteUsers * 4.99 + metrics.proUsers * 19.99;
    expect(metrics.mrr).toBeCloseTo(expectedMrr, 2);
  });
});
```

Run to confirm it fails:
```bash
cd backend && npm test -- metrics.test
```
Expected: FAIL — `metricsService.js` not found.

- [ ] **Step 2: Implement metricsService**

Create `backend/src/services/metricsService.js`:
```js
import prisma from '../prisma/prismaClient.js';

const LITE_PRICE = 4.99;
const PRO_PRICE = 19.99;

export async function calculateBusinessMetrics() {
  const [totalUsers, proUsers, liteUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { subscriptionTier: 'pro' } }),
    prisma.user.count({ where: { subscriptionTier: 'lite' } }),
  ]);

  const payingUsers = proUsers + liteUsers;
  const freeUsers = totalUsers - payingUsers;
  const mrr = liteUsers * LITE_PRICE + proUsers * PRO_PRICE;
  const arpu = payingUsers > 0 ? mrr / payingUsers : 0;

  // Rough churn: users who had a subscription 30+ days ago that's now inactive
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const churnedUsers = await prisma.user.count({
    where: {
      subscriptionTier: 'free',
      updatedAt: { gte: thirtyDaysAgo },
      isPremium: false,
    },
  });

  return {
    mrr: Math.round(mrr * 100) / 100,
    totalUsers,
    payingUsers,
    freeUsers,
    liteUsers,
    proUsers,
    arpu: Math.round(arpu * 100) / 100,
    estimatedMonthlyChurn: payingUsers > 0 ? Math.round((churnedUsers / payingUsers) * 100) : 0,
    breakEvenUsers: Math.ceil(21 / 4.99), // fixed costs / lite price
    generatedAt: new Date().toISOString(),
  };
}
```

> Note: `subscriptionTier` field — verify its name in `prisma/schema.prisma`. If named differently (e.g. `tier` or `plan`), adjust the queries. `isPremium` is the boolean fallback.

- [ ] **Step 3: Run test**

```bash
cd backend && npm test -- metrics.test
```
Expected: PASS.

- [ ] **Step 4: Add route to adminMetricsRoutes**

In `backend/src/routes/adminMetricsRoutes.js`, add at the top:
```js
import { calculateBusinessMetrics } from '../services/metricsService.js';
```

Add route at the end of the router (before `export default`):
```js
router.get('/business-metrics', requireAdmin, async (req, res) => {
  try {
    const metrics = await calculateBusinessMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

If `requireAdmin` middleware doesn't exist in this file, import it or inline the check:
```js
const requireAdmin = (req, res, next) => {
  if (req.auth?.metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};
```

- [ ] **Step 5: Smoke test**

Start backend. As admin user, hit:
```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:5000/api/v1/admin/business-metrics
```
Expected: JSON with `mrr`, `totalUsers`, `payingUsers`, `breakEvenUsers`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/metricsService.js backend/src/routes/adminMetricsRoutes.js backend/src/__tests__/metrics.test.js
git commit -m "feat(admin): business metrics endpoint (MRR, user tiers, churn estimate)"
```

---

## Task 2: Plausible Analytics — Conversion Event Tracking

Adds front-end analytics to track the funnel: landing page visit → sign-up → first skin added → upgrade. Without this, you can't measure whether conversion is 3.5% or 0.5%.

Uses Plausible Analytics (GDPR-friendly, no cookie banner needed, $9/mo or self-host). No personal data leaves the client.

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/lib/analytics.ts`
- Modify: `frontend/src/app/sign-up/[[...sign-up]]/page.tsx` (or clerk sign-up wrapper)
- Modify: `frontend/src/components/landing/HeroSection.tsx`
- Modify: `frontend/src/hooks/useSubscription.ts`

- [ ] **Step 1: Set up Plausible**

Go to https://plausible.io → sign up → add domain `skintrackr.com`. Copy your script tag:
```html
<script defer data-domain="skintrackr.com" src="https://plausible.io/js/script.js"></script>
```

Alternative (self-host): skip if budget is tight, use Plausible Cloud $9/mo.

- [ ] **Step 2: Add Plausible script to layout**

In `frontend/src/app/layout.tsx`, add inside `<head>`:
```tsx
{process.env.NODE_ENV === 'production' && (
  <Script
    defer
    data-domain="skintrackr.com"
    src="https://plausible.io/js/script.js"
    strategy="afterInteractive"
  />
)}
```

Add `import Script from 'next/script';` at top.

- [ ] **Step 3: Create analytics utility**

Create `frontend/src/lib/analytics.ts`:
```ts
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function track(event: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, { props });
  }
}

export const events = {
  ctaClicked: (location: string) => track('CTA Clicked', { location }),
  signUpStarted: () => track('Sign Up Started'),
  signUpCompleted: () => track('Sign Up Completed'),
  firstSkinAdded: () => track('First Skin Added'),
  upgradeClicked: (tier: 'lite' | 'pro') => track('Upgrade Clicked', { tier }),
  checkoutCompleted: (tier: 'lite' | 'pro') => track('Checkout Completed', { tier }),
} as const;
```

- [ ] **Step 4: Fire CTA event from HeroSection**

In `frontend/src/components/landing/HeroSection.tsx`:
```tsx
import { events } from '@/lib/analytics';

// On the "Start Free →" button:
<Button
  size="lg"
  asChild
  onClick={() => events.ctaClicked('hero')}
  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-8 py-6"
>
  <Link href="/sign-up">Start Free →</Link>
</Button>
```

- [ ] **Step 5: Fire upgrade event from useSubscription**

In `frontend/src/hooks/useSubscription.ts`, find `checkout` or `upgrade` function. Add before redirecting to Stripe:
```ts
import { events } from '@/lib/analytics';

// in the checkout handler:
events.upgradeClicked(tier); // before await fetch(...)
```

After Stripe success redirect (in the success URL handler or webhook):
```ts
events.checkoutCompleted(tier);
```

- [ ] **Step 6: Verify in dev**

Open browser DevTools → Console. Navigate to landing page. Click "Start Free →". Check:
```
Plausible: CTA Clicked {location: "hero"}
```
(Plausible logs to console in dev if `script.local.js` is used — for prod script it's silent but fires.)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/layout.tsx frontend/src/lib/analytics.ts frontend/src/components/landing/HeroSection.tsx frontend/src/hooks/useSubscription.ts
git commit -m "feat(analytics): Plausible integration with conversion funnel events"
```

---

## Task 3: Affiliate Link Wrapper (DMarket Phase 2)

DMarket pays 20% commission on referred first transactions. This task adds a utility that appends affiliate ref codes to all outbound DMarket links, plus a simple component. Activates in Phase 2 (Month 4) — implement now, enable via env flag.

**Files:**
- Create: `frontend/src/lib/affiliate.ts`
- Create: `frontend/src/components/ui/marketplace-link.tsx`

- [ ] **Step 1: Create affiliate utility**

Create `frontend/src/lib/affiliate.ts`:
```ts
const AFFILIATE_CODES: Record<string, string> = {
  dmarket: process.env.NEXT_PUBLIC_DMARKET_REF_CODE ?? '',
  skinport: process.env.NEXT_PUBLIC_SKINPORT_REF_CODE ?? '',
};

const AFFILIATE_ENABLED = process.env.NEXT_PUBLIC_AFFILIATE_ENABLED === 'true';

export function buildMarketplaceUrl(
  marketplace: 'dmarket' | 'skinport',
  path: string,
  params: Record<string, string> = {}
): string {
  const bases: Record<string, string> = {
    dmarket: 'https://dmarket.com',
    skinport: 'https://skinport.com',
  };

  const url = new URL(path, bases[marketplace]);

  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  if (AFFILIATE_ENABLED && AFFILIATE_CODES[marketplace]) {
    url.searchParams.set('ref', AFFILIATE_CODES[marketplace]);
  }

  return url.toString();
}
```

- [ ] **Step 2: Create MarketplaceLink component**

Create `frontend/src/components/ui/marketplace-link.tsx`:
```tsx
"use client";
import { ExternalLink } from "lucide-react";
import { buildMarketplaceUrl } from "@/lib/affiliate";

interface MarketplaceLinkProps {
  marketplace: 'dmarket' | 'skinport';
  path: string;
  params?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
}

export function MarketplaceLink({ marketplace, path, params, children, className }: MarketplaceLinkProps) {
  const href = buildMarketplaceUrl(marketplace, path, params);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <ExternalLink className="inline h-3 w-3 ml-1 opacity-60" />
    </a>
  );
}
```

Usage in skin detail page:
```tsx
<MarketplaceLink marketplace="dmarket" path="/en/buy-sell/csgo" params={{ title: skin.marketHashName }}>
  Buy on DMarket
</MarketplaceLink>
```

- [ ] **Step 3: Add env vars (not yet active)**

Add to `frontend/.env.local` (dev, values empty until Phase 2):
```
NEXT_PUBLIC_AFFILIATE_ENABLED=false
NEXT_PUBLIC_DMARKET_REF_CODE=
NEXT_PUBLIC_SKINPORT_REF_CODE=
```

In Vercel: add same vars to Production env. Set `NEXT_PUBLIC_AFFILIATE_ENABLED=false` until DMarket approval arrives (Phase 2, Month 4).

- [ ] **Step 4: Replace any hardcoded marketplace URLs**

```bash
grep -rn "dmarket.com\|skinport.com" frontend/src --include="*.tsx" --include="*.ts" -l
```

For each file found: replace the hardcoded URL with `<MarketplaceLink>` or `buildMarketplaceUrl()`.

- [ ] **Step 5: Verify affiliate param appears when enabled**

Temporarily set `NEXT_PUBLIC_AFFILIATE_ENABLED=true` and `NEXT_PUBLIC_DMARKET_REF_CODE=test123` in `.env.local`. Restart dev server. Hover over a DMarket link — URL in status bar should end `?ref=test123`. Revert the flag to false.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/affiliate.ts frontend/src/components/ui/marketplace-link.tsx frontend/.env.local
git commit -m "feat(affiliate): DMarket/Skinport link wrapper with env-gated ref codes"
```

---

## Self-Review

**Spec coverage check against business plan:**
- ✅ Internal MRR monitoring → Task 1 (`/admin/business-metrics`)
- ✅ Conversion analytics (funnel tracking) → Task 2 (Plausible)
- ✅ Affiliate infrastructure (Phase 2 ready) → Task 3 (DMarket/Skinport wrapper)
- ✅ Decision gate instrumentation (MRR visible, conversion measurable) → Tasks 1 + 2
- ✅ Phase 1-2 existing plan index → Plan Index table at top
- ⬜ Phase 3 (Months 7-12) — intentionally deferred, too early to plan

**Placeholder scan:**
- `subscriptionTier` field name: noted inline with verification instruction (Step 2, Task 1). Not a placeholder — an actionable verification step.
- Affiliate codes: empty by design until DMarket approval. Gated by env flag. Not a placeholder.

**Type consistency:**
- `calculateBusinessMetrics()` returns same shape in test (Task 1 Step 1) and implementation (Task 1 Step 2). ✓
- `buildMarketplaceUrl()` signature used in `MarketplaceLink` (Task 3 Step 2) matches definition (Task 3 Step 1). ✓
- `events.*` API used in Steps 4-5 of Task 2 matches the `events` object defined in Step 3. ✓

**Scope:** 3 tasks × ~1-2 hours each = ~1 solo day. Fits naturally between Month 1 launch tasks.
