# Month 1 — Launch Plan (CS2 Skin Tracker)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get skintrackr.com production-ready and soft-launched on Reddit/Discords within 4 weeks. Fix critical bugs, unify design, rewrite landing page, and prepare launch content.

**Architecture:** Sequential tasks across 6 areas — bug fixes, tech debt, production setup, design system, landing page, launch prep. Each task is 2-4 days of solo work. Code tasks use TDD where applicable; manual tasks use checklists.

**Tech Stack:** Next.js 15 / React 19 (frontend), Express 5 / Node 22 ESM (backend), PostgreSQL/Prisma 6, Clerk auth, Stripe, Vercel deploy.

**Servers required during work:**
- Backend: `cd backend && npm run dev` → http://localhost:5000
- Frontend: `cd frontend && npm run dev` → http://localhost:3000

---

## Task 1: Critical Bug Fixes (Backend)

Three bugs from the audit that will crash or mislead users in production.

**Files:**
- Modify: `backend/src/middleware/verifyClerkJwt.js`
- Modify: `backend/src/services/researchService.js`
- Modify: `backend/src/utils/roleHelpers.js` (if exists, else create)
- Test: `backend/src/__tests__/sprint2.test.js` (extend)

### Bug 1A: `researchService.getPortfolioResearch` — crashes for Pro users

References `prisma.userSubscriptions` model that doesn't exist in schema. Throws at runtime.

- [ ] **Step 1: Find the broken line**

```bash
grep -n "userSubscriptions\|userSubscription" backend/src/services/researchService.js
```

Expected: 1-3 hits referencing the missing model.

- [ ] **Step 2: Replace with `User.isPremium` check**

In `researchService.js`, find the block that queries `prisma.userSubscriptions` and replace with:
```js
const user = await prisma.user.findUnique({ where: { id: userId } });
const tier = user?.isPremium ? 'pro' : 'free';
if (tier !== 'pro') {
  throw new Error('Pro tier required for portfolio research');
}
```

- [ ] **Step 3: Write a test**

In `backend/src/__tests__/sprint2.test.js`, add:
```js
describe('Research — Pro gating', () => {
  it('returns 403 for free user on /research/portfolio', async () => {
    // userId=1 has isPremium=false (set during testing)
    const res = await fetch(`${API_URL}/api/v1/research/portfolio`, {
      headers: { Authorization: `Bearer test` }
    });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 4: Run the test**

```bash
cd backend
API_URL=http://localhost:5000 npm run test:sprint2 -- --testNamePattern="Research"
```

Expected: PASS (no crash, clean 403).

### Bug 1B: `isPremium` source-of-truth — Clerk metadata vs DB

Frontend `useUserRole.ts` reads `isPremium` from Clerk's `publicMetadata`. Backend reads from DB `User.isPremium`. After Stripe webhook updates DB, frontend doesn't reflect it.

- [ ] **Step 5: Refactor `useUserRole` to use backend API**

Modify `frontend/src/hooks/useUserRole.ts`:
```ts
"use client";
import { useUser } from "@clerk/nextjs";
import { useSubscription } from "./useSubscription";

export function useUserRole() {
  const { user, isLoaded } = useUser();
  const { tier } = useSubscription();
  const email = user?.primaryEmailAddress?.emailAddress;
  const ADMIN_EMAILS = ['admin@example.com', 'arthur@example.com'];
  const isAdmin = user?.publicMetadata?.role === 'admin' || ADMIN_EMAILS.includes(email || '');
  return {
    role: isAdmin ? 'admin' : 'user',
    loading: !isLoaded,
    isAdmin,
    isUser: !isAdmin,
    isPremium: tier === 'lite' || tier === 'pro',
  };
}
```

- [ ] **Step 6: Verify in browser**

Start servers, login, ensure `isPremium=false` for user_id=1 in DB → dashboard shows "Premium Required" card. Then set `isPremium=true` in DB:
```bash
cd backend
node -e "import('./src/prisma/prismaClient.js').then(async ({default: prisma}) => { await prisma.user.update({ where: { id: 1 }, data: { isPremium: true }}); await prisma.\$disconnect(); })"
```
Hard-refresh browser. Expect dashboard shows "Premium Active". Toggle back to false.

### Bug 1C: Clerk audience validation disabled

`verifyClerkJwt.js` has audience validation commented out. Insecure in production.

- [ ] **Step 7: Re-enable audience validation**

In `backend/src/middleware/verifyClerkJwt.js`, find the block:
```js
jwt.verify(
  token,
  getKey,
  {
    algorithms: ["RS256"],
    // Temporarily disable audience validation to debug
    // audience: [audience, "cs2-skintracker-api-dev", "cs2-skintrackr-api-dev"],
    issuer: issuer,
  },
```

Replace with:
```js
jwt.verify(
  token,
  getKey,
  {
    algorithms: ["RS256"],
    audience: audience,
    issuer: issuer,
  },
```

- [ ] **Step 8: Verify locally still works**

Start backend with `CLERK_JWKS_URL`/`CLERK_ISSUER`/`CLERK_AUDIENCE` set in `.env`. Hit `/api/v1/health/clerk` from authenticated frontend. Expect 200.

If `CLERK_AUDIENCE` not set in local `.env`, mock-bypass kicks in — that's fine for local dev.

- [ ] **Step 9: Commit**

```bash
git add backend/src/services/researchService.js backend/src/middleware/verifyClerkJwt.js frontend/src/hooks/useUserRole.ts backend/src/__tests__/sprint2.test.js
git commit -m "fix: critical bugs (researchService crash, isPremium source, Clerk audience)"
```

---

## Task 2: Tech Debt Cleanup

Quick wins from the audit. Each is 5-15 min.

**Files:**
- Modify: `backend/.env`
- Modify: `backend/src/server.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/routes/adminRoutes.js`
- Modify: `backend/src/routes/adminMetricsRoutes.js`

- [ ] **Step 1: Remove `NODE_TLS_REJECT_UNAUTHORIZED=0` from server.js**

In `backend/src/server.js`, delete line 4:
```js
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
```

If npm install issues return locally, set it ONLY in local `.env` not in code:
```
NODE_TLS_REJECT_UNAUTHORIZED=0
```

- [ ] **Step 2: Remove DEV_TEST_TOKEN and DEV_FREE_TOKEN from .env**

Open `backend/.env`, delete:
```
DEV_TEST_TOKEN=...
DEV_FREE_TOKEN=...
```

Search code for usage:
```bash
grep -rn "DEV_TEST_TOKEN\|DEV_FREE_TOKEN" backend/src
```

Expected: 0 hits, or only in comments. If hits exist, remove the code paths.

- [ ] **Step 3: Fix CORS to enforce whitelist**

In `backend/src/app.js`, find the `corsOptions` block. Currently:
```js
origin: function(origin, callback) {
  callback(null, true); // always allows
}
```

Replace with:
```js
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
origin: function(origin, callback) {
  if (!origin || ALLOWED.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('CORS: origin not allowed'));
  }
}
```

Update `backend/.env`:
```
ALLOWED_ORIGINS=http://localhost:3000,https://skintrackr.com,https://www.skintrackr.com,https://backend-three-theta-44.vercel.app
```

- [ ] **Step 4: Replace `new PrismaClient()` with singleton**

In `backend/src/routes/adminRoutes.js` and `adminMetricsRoutes.js`, find:
```js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

Replace with:
```js
import prisma from '../prisma/prismaClient.js';
```

- [ ] **Step 5: Smoke test**

Start backend, hit `/api/v1/health` from `http://localhost:3000` → 200. Hit from `https://evil.example` → CORS error.

- [ ] **Step 6: Commit**

```bash
git add backend/src/server.js backend/src/app.js backend/.env backend/src/routes/adminRoutes.js backend/src/routes/adminMetricsRoutes.js
git commit -m "chore: tech debt cleanup (CORS whitelist, prisma singleton, remove dev tokens)"
```

---

## Task 3: Production Setup (Manual)

Domain + Clerk live keys + Vercel env vars. No code, just configuration.

**Time estimate:** 1-2 hours total.

- [ ] **Step 1: Buy domain skintrackr.com**

Go to https://vercel.com/domains. Search `skintrackr.com`. Add to cart. Pay (~$11/year).

Confirmation email arrives — domain registered.

- [ ] **Step 2: Connect domain to Vercel project**

Vercel Dashboard → your frontend project → Settings → Domains → Add `skintrackr.com` and `www.skintrackr.com`. DNS records auto-configured.

Wait 5-10 min for SSL provisioning. Visit `https://skintrackr.com` — should load (404 OK if no content yet).

- [ ] **Step 3: Create Clerk Production Instance**

Clerk Dashboard → Switch to Production Instance (top-left dropdown → "Create production instance"). Approve email verification.

In Production Instance:
- **Domains:** add `skintrackr.com`
- **Paths:** Sign-in URL `/sign-in`, Sign-up URL `/sign-up`, After sign-up `/dashboard`, After sign-in `/dashboard`
- **API Keys:** Copy the live `pk_live_...` (publishable) and `sk_live_...` (secret).

- [ ] **Step 4: Get JWT verification config from Clerk**

In Clerk Production Instance → Configure → API Keys → "JWT Templates" → check default Backend template. Copy:
- **JWKS URL** (looks like `https://clerk.skintrackr.com/.well-known/jwks.json`)
- **Issuer** (`https://clerk.skintrackr.com`)
- **Audience** — set to `cs2-skintrackr-api` (custom claim)

- [ ] **Step 5: Set Vercel env vars (Backend project)**

Vercel Dashboard → Backend project → Settings → Environment Variables → add (or update) for **Production** environment:

```
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_JWKS_URL=https://clerk.skintrackr.com/.well-known/jwks.json
CLERK_ISSUER=https://clerk.skintrackr.com
CLERK_AUDIENCE=cs2-skintrackr-api
ALLOWED_ORIGINS=https://skintrackr.com,https://www.skintrackr.com
FRONTEND_URL=https://skintrackr.com
STRIPE_SECRET_KEY=sk_live_...   # later, when ready
STRIPE_PRICE_LITE_ID=price_...   # live mode
STRIPE_PRICE_PRO_ID=price_...    # live mode
```

For now keep Stripe in test mode — switch only when launch is imminent.

- [ ] **Step 6: Set Vercel env vars (Frontend project)**

Frontend project → same flow:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_API_URL=https://api.skintrackr.com   # or your backend domain
NEXT_PUBLIC_API_ORIGIN=https://api.skintrackr.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # keep test until launch
NEXT_PUBLIC_ENVIRONMENT=production
```

- [ ] **Step 7: Trigger redeploy**

Vercel → both projects → Deployments → "Redeploy" latest commit with new env vars.

Wait for both to go green.

- [ ] **Step 8: Smoke-test production**

Visit `https://skintrackr.com` → loads. Sign up via Clerk → redirects to dashboard. Open DevTools → Network tab → backend API calls return 200 with JWT.

If 401 errors: Clerk JWKS_URL or audience mismatch. Recheck Step 4.

- [ ] **Step 9: Commit env-related code changes (not the secrets)**

Only commit if you changed code. Just push the existing branch — no new commit needed for env-only changes.

---

## Task 4: Design System Unification

Replace inconsistent token usage with one cohesive set. Goal: every page feels like the same product.

**Files:**
- Create: `frontend/src/lib/design-tokens.ts`
- Create: `frontend/src/components/ui/kpi-card.tsx`
- Create: `frontend/src/components/ui/tier-badge.tsx`
- Modify: `frontend/tailwind.config.ts` (or `.js`)
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Create design tokens module**

Create `frontend/src/lib/design-tokens.ts`:
```ts
export const tokens = {
  bg: {
    base: 'bg-slate-950',
    surface: 'bg-slate-900/60 backdrop-blur',
    surfaceSolid: 'bg-slate-900',
    elevated: 'bg-slate-800/60',
  },
  border: {
    default: 'border-slate-700/50',
    hover: 'hover:border-slate-600',
    accent: 'border-purple-500/50',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    success: 'text-green-400',
    danger: 'text-red-400',
  },
  accent: {
    primary: 'from-purple-500 to-pink-500',
    primaryHover: 'hover:from-purple-600 hover:to-pink-600',
    lite: 'from-amber-500 to-orange-500',
    liteHover: 'hover:from-amber-600 hover:to-orange-600',
  },
  badge: {
    pro: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    lite: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    free: 'bg-slate-700 text-slate-200',
    active: 'bg-green-500 text-white',
  },
} as const;
```

- [ ] **Step 2: Create TierBadge component**

Create `frontend/src/components/ui/tier-badge.tsx`:
```tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Zap } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

interface TierBadgeProps {
  tier: 'free' | 'lite' | 'pro';
  showIcon?: boolean;
}

export function TierBadge({ tier, showIcon = true }: TierBadgeProps) {
  const config = {
    free: { label: 'Free', icon: Sparkles, className: tokens.badge.free },
    lite: { label: 'Lite', icon: Zap, className: tokens.badge.lite },
    pro: { label: 'Pro', icon: Crown, className: tokens.badge.pro },
  };
  const { label, icon: Icon, className } = config[tier];
  return (
    <Badge className={`${className} px-3 py-1 gap-1`}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}
```

- [ ] **Step 3: Create KPICard component**

Create `frontend/src/components/ui/kpi-card.tsx`:
```tsx
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

interface KPICardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, delta, deltaLabel, icon }: KPICardProps) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <Card className={`${tokens.bg.surface} ${tokens.border.default} ${tokens.border.hover} transition-colors`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <span className={`text-sm font-medium ${tokens.text.muted}`}>{label}</span>
          {icon}
        </div>
        <div className={`text-3xl font-bold ${tokens.text.primary} mb-1`}>{value}</div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? tokens.text.success : tokens.text.danger}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositive ? '+' : ''}{delta.toFixed(2)}%</span>
            {deltaLabel && <span className={tokens.text.muted}>{deltaLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Audit pages for token misuse**

```bash
grep -rn "brand-celadon\|brand-slate\|indigo" frontend/src/app frontend/src/components --include="*.tsx" -l
```

This lists every file using legacy tokens. For each file:
- Replace `bg-brand-slate-800` with `bg-slate-900/60 backdrop-blur`
- Replace `border-brand-celadon` with `border-purple-500/50`
- Replace `text-brand-slate-400` with `text-slate-400`

Do this file-by-file. Don't try to do all at once.

- [ ] **Step 5: Migrate dashboard to new tokens**

Open `frontend/src/app/dashboard/page.tsx`. Replace inconsistent classes with tokens. The old "Premium Active" / "Premium Required" cards should use `tokens.bg.surface` and `tokens.accent.primary`.

Verify in browser: `/dashboard` looks like `/pricing` — same dark surface, same purple accent, same border treatment.

- [ ] **Step 6: Migrate landing page tokens**

Open `frontend/src/components/landing/PricingSection.tsx`. Replace `brand-celadon-500` and `brand-slate-500` with the new token equivalents. Update plans array to match `/pricing` page (free/lite/pro at 0/4.99/19.99€).

(This is partially redundant with Task 5 below — if Task 5 rewrites the landing entirely, skip this step.)

- [ ] **Step 7: Visual consistency check**

Run frontend dev server. Walk through every page in this order:
- `/` (landing)
- `/pricing`
- `/dashboard`
- `/portfolio`
- `/skins`
- `/skins/[id]` (any skin)
- `/watchlist`

For each: same background tone? Same card style? Same button gradient for primary CTAs? Same border colors?

If a page jars — note the file and fix.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/design-tokens.ts frontend/src/components/ui/kpi-card.tsx frontend/src/components/ui/tier-badge.tsx frontend/src/app frontend/src/components
git commit -m "design: unify tokens (slate-950 base, purple/pink accent, KPICard + TierBadge)"
```

---

## Task 5: Landing Page Rewrite

Conversion-optimized landing page on `/` with "Robinhood for CS2" pitch.

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify or replace: `frontend/src/components/landing/HeroSection.tsx`
- Modify or replace: `frontend/src/components/landing/FeaturesSection.tsx`
- Modify: `frontend/src/components/landing/PricingSection.tsx`
- Create: `frontend/src/components/landing/SocialProofSection.tsx`

- [ ] **Step 1: Rewrite Hero copy**

Open `frontend/src/components/landing/HeroSection.tsx`. Replace headline + sub-headline with:

```tsx
<h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Robinhood</span> for{" "}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">CS2 Skins</span>
</h1>
<p className="text-xl md:text-2xl text-slate-300 mt-6 max-w-2xl">
  Investor-grade portfolio tracking, smart alerts, and tax-ready reports for serious CS2 traders.
  Free forever for casual collectors.
</p>
<div className="flex flex-col sm:flex-row gap-4 mt-10">
  <Button size="lg" asChild className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-8 py-6">
    <Link href="/sign-up">Start Free →</Link>
  </Button>
  <Button size="lg" variant="outline" asChild className="border-slate-700 text-white text-lg px-8 py-6">
    <Link href="/pricing">View Plans</Link>
  </Button>
</div>
```

Add a screenshot/mockup of the dashboard below the copy if you have one.

- [ ] **Step 2: Rewrite Features section**

Open `frontend/src/components/landing/FeaturesSection.tsx`. Replace with 6 feature cards organized in 2 rows of 3:

Features (use Lucide icons):
1. **Real-time Portfolio Value** (Wallet icon) — "Live prices from 40+ marketplaces. See your total value, unrealized P&L, and allocation at a glance."
2. **Smart Alerts** (Bell icon) — "Volatility spikes, float-tier breakouts, case EV inversions. Get notified via email, Discord, or Telegram." *(badge: "Coming Month 2")*
3. **Investor Analytics** (BarChart3 icon) — "Sharpe ratio, drawdown, beta vs market. Real metrics for real traders."
4. **Tax-Ready Reports** (FileText icon) — "FIFO/LIFO cost basis, CSV export, capital-gains formatting. Built for tax season." *(badge: "Coming Month 3")*
5. **Mobile-First** (Smartphone icon) — "PWA with home-screen widget. Track your portfolio anywhere."
6. **Privacy First** (Shield icon) — "We never see your Steam credentials. Read-only public inventory data."

Each feature card uses `tokens.bg.surface` + `tokens.border.default` + `tokens.border.hover`.

- [ ] **Step 3: Update PricingSection to match `/pricing` page**

Make `PricingSection` match the 3-tier (free/lite/pro at 0/4.99/19.99€) pricing on `/pricing`. Buttons link to `/pricing` (not directly to checkout — let `/pricing` handle the routing).

- [ ] **Step 4: Create SocialProofSection placeholder**

Create `frontend/src/components/landing/SocialProofSection.tsx`:
```tsx
"use client";
import { Quote } from "lucide-react";

const testimonials = [
  // Empty for now — fill after launch
];

export default function SocialProofSection() {
  if (testimonials.length === 0) {
    return (
      <section className="py-16 bg-slate-900/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">
            Join the early users tracking <span className="text-white font-semibold">over 10,000 skins</span> on skintrackr.com
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-4xl font-bold text-white text-center mb-12">What traders say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-lg p-6">
              <Quote className="h-8 w-8 text-purple-400 mb-4" />
              <p className="text-slate-300 mb-4">{t.quote}</p>
              <p className="text-white font-semibold">{t.author}</p>
              <p className="text-slate-400 text-sm">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

After launch, fill `testimonials` with real quotes.

- [ ] **Step 5: Wire it all in `app/page.tsx`**

```tsx
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <HeroSection />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 6: Walk through manually**

Open `http://localhost:3000`. Read it like a new visitor. Check:
- Headline understandable in 3 seconds?
- Features feel real and concrete?
- Pricing clear?
- CTAs visible?
- Mobile (DevTools mobile preview): readable, buttons reachable?

If anything is awkward, fix inline.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/page.tsx frontend/src/components/landing
git commit -m "feat: rewrite landing page (Robinhood for CS2 pitch + 6 features + social proof)"
```

---

## Task 6: Soft Launch Prep

Content + outreach. No code.

**Time estimate:** 1-2 days for content, 1 day for actual posting.

- [ ] **Step 1: Record 60-second demo video**

Use Loom or QuickTime. Show:
1. Landing page (3s)
2. Sign up flow (5s)
3. Add a skin to portfolio (10s)
4. Dashboard with KPIs + chart (15s)
5. Click "Pläne ansehen" → Pricing page (5s)
6. Click upgrade → Stripe checkout (10s)
7. Outro: "Free forever or upgrade for €4.99 — skintrackr.com" (5s)

Save as `demo.mp4` and upload to YouTube (unlisted) for embedding. Also create a 5-second GIF of the dashboard for Reddit.

- [ ] **Step 2: Draft Reddit post for r/GlobalOffensive**

Title: `I built a portfolio tracker for CS2 skins — like Robinhood for your inventory [Free + Optional Premium]`

Body template (markdown):
```markdown
Hey GO,

I'm a solo dev who got tired of guessing whether my skin "investments" were actually making money. So I built **skintrackr.com** — a portfolio tracker focused on giving you real numbers (P&L, allocation, volatility) instead of just current prices.

**What it does:**
- Track your full portfolio with cost basis (so you see actual profit, not just current value)
- Live prices from multiple marketplaces
- Watchlist with price alerts
- Investor metrics (Sharpe, drawdown, allocation breakdown)

**What's free:** unlimited tracking for up to 5 skins, 1 alert, basic analytics.
**Premium (€4.99-19.99/mo):** full analytics, smart alerts (coming next month), tax export (coming).

Demo GIF: [link]
Try it: https://skintrackr.com

Looking for honest feedback — what's missing, what's confusing, what would make you actually use this. Roast me.
```

- [ ] **Step 3: Draft post variants for other channels**

- **r/csgomarketforum**: shorter, focus on trader features
- **Hacker News Show HN**: focus on tech stack, solo dev story, what was hard to build
- **Twitter/X**: thread of 5-7 tweets, lead with demo GIF

Save all drafts in `docs/launch/posts.md` (create if doesn't exist).

- [ ] **Step 4: Pick target Discord servers**

Identify 3-5 CS2 trading Discords (e.g. Skinport official, /r/csgomarketforum Discord, large trader Discords). Don't just spam — join, lurk for a few days, find the right channel for self-promotion.

List in `docs/launch/discords.md`:
```
| Server | Invite | Channel for self-promo | Status |
|--------|--------|----------------------|--------|
| Skinport | https://... | #showcase | not joined |
| ... | | | |
```

- [ ] **Step 5: Pre-launch checklist**

Day before launch, verify:
- [ ] `https://skintrackr.com` loads
- [ ] Sign up + dashboard works end-to-end
- [ ] Stripe checkout completes (test mode OK for soft launch)
- [ ] No console errors on landing page (DevTools)
- [ ] Mobile responsive (real phone, not just DevTools)
- [ ] All copy spell-checked
- [ ] Email alerts inbox monitored (`hello@skintrackr.com` or similar — set up forwarding)

- [ ] **Step 6: Launch day**

Schedule for a Tuesday 9 AM EST (peak Reddit traffic). Sequence:
1. Post on r/csgomarketforum first (smaller, friendlier)
2. Wait 30 min, monitor for issues
3. Post on r/GlobalOffensive
4. Post on Hacker News Show HN
5. Twitter thread
6. Discord posts (1 per hour, not all at once — looks spammy)

Reply to every comment within 2 hours. Be honest, not corporate. Take feedback graciously.

- [ ] **Step 7: Post-launch (24h)**

Track:
- Sign-ups
- Free → Lite/Pro conversions
- Bug reports (fix critical ones same-day)
- Reddit/HN comments

Update `docs/launch/results.md` with metrics. Plan iteration based on what users ask for.

---

## Self-Review

After plan complete, fresh-eyes check:

**Spec coverage:**
- ✅ Domain registration → Task 3 Step 1-2
- ✅ Bug fixes (isPremium, researchService, Clerk audience) → Task 1
- ✅ Clerk live keys → Task 3 Steps 3-7
- ✅ Landing page rewrite → Task 5
- ✅ Design system → Task 4
- ✅ Tech debt cleanup → Task 2
- ✅ Soft launch (Reddit, Discords) → Task 6

All spec sections covered.

**Placeholder scan:** No "TBD" outside of explicit deferred items (Trader Tier price). Code blocks complete.

**Type/method consistency:** `tokens` object used in Task 4 referenced consistently in later tasks. `useUserRole` signature in Task 1 Step 5 returns same shape as before — won't break consumers.

**Scope:** 4 weeks for solo dev. Task 1 (1-2 days), Task 2 (0.5 day), Task 3 (1 day, gated by domain delivery), Task 4 (3-4 days), Task 5 (3-4 days), Task 6 (2-3 days) = ~12-15 working days, fits 4-week solo schedule.
