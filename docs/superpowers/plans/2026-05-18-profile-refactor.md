# Profile Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the profile page into a tabbed layout (Account/Billing/Notifications/Security), add currency + theme user preferences with a static FX table, and surface Stripe Customer Portal management directly on the profile.

**Architecture:** Two new fields on `User` (`preferredCurrency`, `themePreference`) with safe defaults via additive migration. Backend extends `PATCH /users/me` validation, adds a `POST /subscriptions/portal` endpoint, and surfaces extra fields in `GET /subscriptions/status`. Frontend decomposes the 718-LOC monolithic profile page into a thin shell + four focused tab files, with a new `CurrencyContext` that converts USD amounts to the user's preferred currency using static rates.

**Tech Stack:** Prisma 5, Express, Jest (backend tests), Next.js 14 app router, React, Tailwind (CVA components), Clerk auth (JWT), Stripe SDK.

**Spec reference:** `docs/superpowers/specs/2026-05-18-profile-refactor-design.md`

---

## File Structure

**Backend — new files:**
- `backend/src/config/currency.js` — static FX rates, symbols, allowlists
- `backend/src/__tests__/profileRefactor.test.js` — integration tests

**Backend — modify:**
- `backend/prisma/schema.prisma` (add 2 fields to User)
- `backend/src/controllers/userController.js` (extend updateProfile + getProfile)
- `backend/src/controllers/subscriptionController.js` (extend status response, add portal)
- `backend/src/routes/subscriptionRoutes.js` (mount portal route)

**Frontend — new files:**
- `frontend/src/contexts/CurrencyContext.tsx`
- `frontend/src/app/profile/_components/TabNav.tsx`
- `frontend/src/app/profile/_components/CurrencySelect.tsx`
- `frontend/src/app/profile/_components/ThemeSelect.tsx`
- `frontend/src/app/profile/_tabs/AccountTab.tsx`
- `frontend/src/app/profile/_tabs/BillingTab.tsx`
- `frontend/src/app/profile/_tabs/NotificationsTab.tsx`
- `frontend/src/app/profile/_tabs/SecurityTab.tsx`

**Frontend — modify:**
- `frontend/src/app/profile/page.tsx` (shell, decompose to tabs)
- `frontend/src/hooks/useSubscription.ts` (expose renewal + portal)
- `frontend/src/app/layout.tsx` (wrap with CurrencyProvider)
- `frontend/src/app/components/PortfolioDashboard.tsx` (use format())
- `frontend/src/app/components/ResearchPanel.tsx` (use format())

---

## Notes on conventions

- The repo's commit-msg hook enforces Conventional Commits — every commit message MUST start with `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, or `chore:` (with optional scope).
- Auth on backend: middleware sets `req.auth.userId` (Clerk ID) — controllers look up the DB user by that.
- Frontend fetches use `useAuth().getToken({ template: "backend" })` and pass `Authorization: Bearer ${token}`.
- Backend tests live in `backend/src/__tests__/` and run with `npm test` (Jest). They use real HTTP via `axios` to `process.env.API_URL` — start the server first.
- Frontend has no unit test runner (only Playwright E2E, currently skipped). Validate frontend manually.

---

## Task 1: Add Prisma fields for user preferences

**Files:**
- Modify: `backend/prisma/schema.prisma` (User model, after `role` field)
- Create: `backend/prisma/migrations/<timestamp>_add_user_preferences/migration.sql` (via prisma migrate)

- [ ] **Step 1: Edit schema**

Add two fields to the `User` model in `backend/prisma/schema.prisma`, immediately after the `role` line:

```prisma
  preferredCurrency String  @default("USD")
  themePreference   String  @default("DARK")
```

- [ ] **Step 2: Generate migration**

Run from `backend/`:
```
npx prisma migrate dev --name add_user_preferences
```

Expected: creates new migration folder, applies it, regenerates client. Should report "Your database is now in sync with your schema."

- [ ] **Step 3: Verify generated client**

Run from `backend/`:
```
npx prisma generate
```

Then quick sanity check:
```
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.findFirst().then(u=>{console.log(u && {id:u.id,preferredCurrency:u.preferredCurrency,themePreference:u.themePreference});process.exit(0);})"
```

Expected: either `null` (empty DB) or an object including `preferredCurrency: 'USD'`, `themePreference: 'DARK'`.

- [ ] **Step 4: Commit**

```
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(db): add preferredCurrency and themePreference to User"
```

---

## Task 2: Create currency config module

**Files:**
- Create: `backend/src/config/currency.js`

- [ ] **Step 1: Write the file**

```js
// backend/src/config/currency.js
// Static FX table — update by editing this file and redeploying.
// Rates are USD → target. Multiply USD amounts by rate.

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'];

export const FX_RATES = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const SUPPORTED_THEMES = ['DARK', 'LIGHT', 'SYSTEM'];

export function isValidCurrency(code) {
  return SUPPORTED_CURRENCIES.includes(code);
}

export function isValidTheme(code) {
  return SUPPORTED_THEMES.includes(code);
}
```

- [ ] **Step 2: Commit**

```
git add backend/src/config/currency.js
git commit -m "feat(config): add currency + theme allowlists and static FX table"
```

---

## Task 3: Extend updateProfile validation (TDD)

**Files:**
- Create: `backend/src/__tests__/profileRefactor.test.js`
- Modify: `backend/src/controllers/userController.js` (`updateProfile` function around line 173)

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/profileRefactor.test.js`:

```js
import axios from 'axios';
import { describe, it, expect, beforeAll } from '@jest/globals';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_JWT = process.env.TEST_JWT;

const authClient = axios.create({
  baseURL: API_URL,
  headers: TEST_JWT ? { Authorization: `Bearer ${TEST_JWT}` } : {},
  validateStatus: () => true,
});

describe('Profile refactor: user preferences', () => {
  it('accepts valid currency on PATCH /users/me', async () => {
    const res = await authClient.patch('/api/v1/users/me', {
      preferredCurrency: 'EUR',
    });
    expect(res.status).toBe(200);
    expect(res.data.preferredCurrency).toBe('EUR');
  });

  it('rejects invalid currency on PATCH /users/me', async () => {
    const res = await authClient.patch('/api/v1/users/me', {
      preferredCurrency: 'XYZ',
    });
    expect(res.status).toBe(400);
  });

  it('accepts valid theme on PATCH /users/me', async () => {
    const res = await authClient.patch('/api/v1/users/me', {
      themePreference: 'LIGHT',
    });
    expect(res.status).toBe(200);
    expect(res.data.themePreference).toBe('LIGHT');
  });

  it('rejects invalid theme on PATCH /users/me', async () => {
    const res = await authClient.patch('/api/v1/users/me', {
      themePreference: 'NEON',
    });
    expect(res.status).toBe(400);
  });

  it('returns currency + theme on GET /users/me', async () => {
    const res = await authClient.get('/api/v1/users/me');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('preferredCurrency');
    expect(res.data).toHaveProperty('themePreference');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `backend/`:
```
npm test -- --testPathPatterns=profileRefactor
```

Expected: tests fail (400 returned for valid currency, or fields missing in response). If the test server isn't reachable, start it with `npm run dev` in another terminal first, and ensure `TEST_JWT` env var is set.

- [ ] **Step 3: Extend updateProfile**

In `backend/src/controllers/userController.js`, locate `updateProfile` (around line 173). Add the import at the top:

```js
import { isValidCurrency, isValidTheme } from '../config/currency.js';
```

Inside `updateProfile`, extend the destructured fields and add validation. Replace the existing function body so it accepts the two new fields. The pattern to match the existing style:

```js
export async function updateProfile(req, res) {
  try {
    const userId = req.auth?.userId;
    const {
      displayName,
      timezone,
      emailAlerts,
      pushAlerts,
      preferredCurrency,
      themePreference,
    } = req.body;

    const data = {};

    if (displayName !== undefined) data.displayName = displayName;

    if (timezone !== undefined) {
      const tzList = Intl.supportedValuesOf('timeZone');
      if (!tzList.includes(timezone)) {
        return res.status(400).json({ error: 'Invalid timezone' });
      }
      data.timezone = timezone;
    }

    if (emailAlerts !== undefined) {
      if (typeof emailAlerts !== 'boolean') {
        return res.status(400).json({ error: 'emailAlerts must be boolean' });
      }
      data.emailAlerts = emailAlerts;
    }

    if (pushAlerts !== undefined) {
      if (typeof pushAlerts !== 'boolean') {
        return res.status(400).json({ error: 'pushAlerts must be boolean' });
      }
      data.pushAlerts = pushAlerts;
    }

    if (preferredCurrency !== undefined) {
      if (!isValidCurrency(preferredCurrency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
      data.preferredCurrency = preferredCurrency;
    }

    if (themePreference !== undefined) {
      if (!isValidTheme(themePreference)) {
        return res.status(400).json({ error: 'Invalid theme' });
      }
      data.themePreference = themePreference;
    }

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data,
    });

    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone,
      emailAlerts: user.emailAlerts,
      pushAlerts: user.pushAlerts,
      preferredCurrency: user.preferredCurrency,
      themePreference: user.themePreference,
      createdAt: user.createdAt,
      role: user.role,
      isPremium: user.isPremium,
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
```

Also update `getProfile` to include the new fields in its response (mirror the shape above).

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- --testPathPatterns=profileRefactor
```

Expected: all five tests pass.

- [ ] **Step 5: Commit**

```
git add backend/src/controllers/userController.js backend/src/__tests__/profileRefactor.test.js
git commit -m "feat(api): accept preferredCurrency + themePreference on /users/me"
```

---

## Task 4: Extend subscription status response

**Files:**
- Modify: `backend/src/controllers/subscriptionController.js` (the `GET /status` handler, around line 116)

- [ ] **Step 1: Add fields to status response**

Locate the response object in `getStatus` (or whatever the status handler is called). Extend to include explicit aliases:

```js
return res.json({
  id: sub.id,
  tier: sub.tier,
  status: sub.status,
  stripeSubId: sub.stripeSubId,
  stripeCustomerId: sub.stripeCustomerId ?? null,
  currentPeriodStart: sub.currentPeriodStart,
  currentPeriodEnd: sub.currentPeriodEnd,
  renewalDate: sub.currentPeriodEnd,
  cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
  canceledAt: sub.canceledAt,
  canCreatePortfolio: sub.canCreatePortfolio,
  canAccessResearch: sub.canAccessResearch,
  canExportCSV: sub.canExportCSV,
});
```

If `stripeCustomerId` or `cancelAtPeriodEnd` are not currently selected from Prisma, add them to the `select` clause.

- [ ] **Step 2: Commit**

```
git add backend/src/controllers/subscriptionController.js
git commit -m "feat(api): surface renewalDate + cancelAtPeriodEnd in subscription status"
```

---

## Task 5: Stripe Customer Portal endpoint

**Files:**
- Modify: `backend/src/controllers/subscriptionController.js`
- Modify: `backend/src/routes/subscriptionRoutes.js`
- Modify: `backend/src/__tests__/profileRefactor.test.js`

- [ ] **Step 1: Write failing test**

Append to `backend/src/__tests__/profileRefactor.test.js`:

```js
describe('Stripe Customer Portal', () => {
  it('returns a portal URL for a user with a Stripe customer ID', async () => {
    const res = await authClient.post('/api/v1/subscriptions/portal');
    // Either 200 with url, or 404 if test user has no Stripe customer.
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.data.url).toMatch(/^https:\/\/billing\.stripe\.com\//);
    }
  });

  it('rejects unauthenticated portal request', async () => {
    const res = await axios.post(`${API_URL}/api/v1/subscriptions/portal`, {}, {
      validateStatus: () => true,
    });
    expect([401, 403]).toContain(res.status);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```
npm test -- --testPathPatterns=profileRefactor
```

Expected: the new tests fail (route returns 404 because it doesn't exist).

- [ ] **Step 3: Add controller handler**

In `backend/src/controllers/subscriptionController.js`, add:

```js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCustomerPortalSession(req, res) {
  try {
    const userId = req.auth?.userId;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { subscriptions: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const customerId = user.subscriptions?.[0]?.stripeCustomerId;
    if (!customerId) {
      return res.status(404).json({ error: 'No Stripe customer for user' });
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?tab=billing`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('createCustomerPortalSession error:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
```

If `Stripe` is already imported and a `stripe` client instance already exists at the top of the file, do NOT re-import — reuse it. Same for the prisma client. Match the existing controller style.

- [ ] **Step 4: Mount the route**

In `backend/src/routes/subscriptionRoutes.js`, add (after the existing routes):

```js
import { createCustomerPortalSession } from '../controllers/subscriptionController.js';

router.post('/portal', clerkAuth, createCustomerPortalSession);
```

Use whatever auth middleware the other authenticated subscription routes already use (`clerkAuth` is the typical name in this repo — match the existing import).

- [ ] **Step 5: Run tests**

```
npm test -- --testPathPatterns=profileRefactor
```

Expected: portal tests pass (either 200 with valid URL or 404 if test user lacks Stripe customer; unauthenticated returns 401).

- [ ] **Step 6: Commit**

```
git add backend/src/controllers/subscriptionController.js backend/src/routes/subscriptionRoutes.js backend/src/__tests__/profileRefactor.test.js
git commit -m "feat(api): add Stripe Customer Portal session endpoint"
```

---

## Task 6: Frontend — CurrencyContext

**Files:**
- Create: `frontend/src/contexts/CurrencyContext.tsx`
- Modify: `frontend/src/app/layout.tsx` (wrap with provider)

- [ ] **Step 1: Create the context**

```tsx
// frontend/src/contexts/CurrencyContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';

type CurrencyCode = 'USD' | 'EUR' | 'GBP';

const FX_RATES: Record<CurrencyCode, number> = { USD: 1.0, EUR: 0.92, GBP: 0.79 };
const SYMBOLS: Record<CurrencyCode, string> = { USD: '$', EUR: '€', GBP: '£' };
const LOCALES: Record<CurrencyCode, string> = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };

type CurrencyContextValue = {
  currency: CurrencyCode;
  symbol: string;
  rate: number;
  format: (usdAmount: number, opts?: { decimals?: number }) => string;
  refresh: () => Promise<void>;
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrency = async () => {
    if (!isSignedIn) {
      setCurrency('USD');
      setIsLoading(false);
      return;
    }
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.preferredCurrency && FX_RATES[data.preferredCurrency as CurrencyCode]) {
          setCurrency(data.preferredCurrency as CurrencyCode);
        }
      }
    } catch (err) {
      console.error('CurrencyContext fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrency();
  }, [isSignedIn]);

  const value: CurrencyContextValue = {
    currency,
    symbol: SYMBOLS[currency],
    rate: FX_RATES[currency],
    format: (usdAmount: number, opts) => {
      const decimals = opts?.decimals ?? 2;
      const converted = usdAmount * FX_RATES[currency];
      return new Intl.NumberFormat(LOCALES[currency], {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(converted);
    },
    refresh: fetchCurrency,
    isLoading,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
```

- [ ] **Step 2: Wrap app with provider**

Edit `frontend/src/app/layout.tsx`. Locate where children are rendered (likely inside `<ClerkProvider>`). Wrap with `<CurrencyProvider>`:

```tsx
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// inside the JSX, around `{children}`:
<CurrencyProvider>
  {children}
</CurrencyProvider>
```

Place inside `<ClerkProvider>` so it has access to `useAuth`/`useUser`.

- [ ] **Step 3: Commit**

```
git add frontend/src/contexts/CurrencyContext.tsx frontend/src/app/layout.tsx
git commit -m "feat(frontend): add CurrencyContext with static FX conversion"
```

---

## Task 7: Extend useSubscription hook

**Files:**
- Modify: `frontend/src/hooks/useSubscription.ts`

- [ ] **Step 1: Add fields and openPortal method**

Extend the returned object. In the `Subscription` type and the hook return:

```ts
export type Subscription = {
  id: number;
  tier: 'free' | 'lite' | 'pro';
  status: string;
  stripeSubId: string | null;
  stripeCustomerId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  canCreatePortfolio: boolean;
  canAccessResearch: boolean;
  canExportCSV: boolean;
};
```

Add `openPortal` (calls the new backend endpoint, redirects). The full hook return should be:

```ts
return {
  subscription,
  isLoading,
  error,
  tier,
  isActive,
  canAccessResearch,
  renewalDate: subscription?.renewalDate ?? null,
  cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
  hasStripeCustomer: !!subscription?.stripeCustomerId,
  checkout,
  cancel,
  openPortal,
};
```

The `openPortal` function:

```ts
const openPortal = async () => {
  try {
    const token = await getToken({ template: 'backend' });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/portal`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error('Portal session failed');
    const data = await res.json();
    window.location.href = data.url;
  } catch (err) {
    console.error('openPortal failed:', err);
  }
};
```

- [ ] **Step 2: Commit**

```
git add frontend/src/hooks/useSubscription.ts
git commit -m "feat(frontend): extend useSubscription with renewal info + portal"
```

---

## Task 8: TabNav + select components

**Files:**
- Create: `frontend/src/app/profile/_components/TabNav.tsx`
- Create: `frontend/src/app/profile/_components/CurrencySelect.tsx`
- Create: `frontend/src/app/profile/_components/ThemeSelect.tsx`

- [ ] **Step 1: TabNav**

```tsx
// frontend/src/app/profile/_components/TabNav.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export type TabId = 'account' | 'billing' | 'notifications' | 'security';

const TABS: { id: TabId; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
];

export function TabNav({ active }: { active: TabId }) {
  const router = useRouter();
  const params = useSearchParams();

  const handleClick = (id: TabId) => {
    const next = new URLSearchParams(params.toString());
    next.set('tab', id);
    router.push(`/profile?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex gap-1 border-b border-zinc-800 mb-6">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => handleClick(t.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition border-b-2 -mb-px',
            active === t.id
              ? 'border-blue-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: CurrencySelect**

```tsx
// frontend/src/app/profile/_components/CurrencySelect.tsx
'use client';

type Props = {
  value: 'USD' | 'EUR' | 'GBP';
  onChange: (v: 'USD' | 'EUR' | 'GBP') => void;
  disabled?: boolean;
};

export function CurrencySelect({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value as 'USD' | 'EUR' | 'GBP')}
      className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
    >
      <option value="USD">USD ($)</option>
      <option value="EUR">EUR (€)</option>
      <option value="GBP">GBP (£)</option>
    </select>
  );
}
```

- [ ] **Step 3: ThemeSelect**

```tsx
// frontend/src/app/profile/_components/ThemeSelect.tsx
'use client';

type Props = {
  value: 'DARK' | 'LIGHT' | 'SYSTEM';
  onChange: (v: 'DARK' | 'LIGHT' | 'SYSTEM') => void;
  disabled?: boolean;
};

export function ThemeSelect({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value as 'DARK' | 'LIGHT' | 'SYSTEM')}
      className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
    >
      <option value="DARK">Dark</option>
      <option value="LIGHT">Light (preview only)</option>
      <option value="SYSTEM">System</option>
    </select>
  );
}
```

- [ ] **Step 4: Commit**

```
git add frontend/src/app/profile/_components
git commit -m "feat(frontend): add TabNav + Currency/Theme select components"
```

---

## Task 9: AccountTab

**Files:**
- Create: `frontend/src/app/profile/_tabs/AccountTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/app/profile/_tabs/AccountTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencySelect } from '../_components/CurrencySelect';
import { ThemeSelect } from '../_components/ThemeSelect';
import { useCurrency } from '@/contexts/CurrencyContext';

type ProfileData = {
  displayName: string | null;
  timezone: string | null;
  preferredCurrency: 'USD' | 'EUR' | 'GBP';
  themePreference: 'DARK' | 'LIGHT' | 'SYSTEM';
};

export function AccountTab() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { refresh: refreshCurrency } = useCurrency();
  const [data, setData] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setData(await res.json());
    })();
  }, [getToken]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error('save failed');
      await refreshCurrency();
      setMsg('Saved');
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="text-zinc-400">Loading…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Email</label>
          <Input value={user?.primaryEmailAddress?.emailAddress ?? ''} disabled />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Display Name</label>
          <Input
            value={data.displayName ?? ''}
            onChange={e => setData({ ...data, displayName: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Timezone</label>
          <Input
            value={data.timezone ?? ''}
            onChange={e => setData({ ...data, timezone: e.target.value })}
            placeholder="Europe/Berlin"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Preferred Currency</label>
          <CurrencySelect
            value={data.preferredCurrency}
            onChange={v => setData({ ...data, preferredCurrency: v })}
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Theme</label>
          <ThemeSelect
            value={data.themePreference}
            onChange={v => setData({ ...data, themePreference: v })}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Theme preference is stored. Light mode visuals coming soon.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {msg && <span className="text-sm text-zinc-400">{msg}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```
git add frontend/src/app/profile/_tabs/AccountTab.tsx
git commit -m "feat(frontend): add AccountTab with currency + theme prefs"
```

---

## Task 10: BillingTab

**Files:**
- Create: `frontend/src/app/profile/_tabs/BillingTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/app/profile/_tabs/BillingTab.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

export function BillingTab() {
  const {
    subscription,
    tier,
    isActive,
    renewalDate,
    cancelAtPeriodEnd,
    hasStripeCustomer,
    openPortal,
    isLoading,
  } = useSubscription();

  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading) return <div className="text-zinc-400">Loading…</div>;

  const renewalLabel = renewalDate
    ? new Date(renewalDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Current plan</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold capitalize">{tier}</span>
              {isActive && tier !== 'free' && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/40 text-green-400">
                  Active
                </span>
              )}
              {cancelAtPeriodEnd && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-900/40 text-yellow-400">
                  Ends {renewalLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {tier !== 'free' && renewalLabel && (
          <div className="text-sm text-zinc-400">
            {cancelAtPeriodEnd
              ? `Subscription ends on ${renewalLabel}.`
              : `Renews on ${renewalLabel}.`}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {tier === 'free' && (
            <Button onClick={() => setShowUpgrade(true)}>Upgrade to Pro</Button>
          )}
          {hasStripeCustomer && (
            <Button variant="outline" onClick={openPortal}>
              Manage subscription
            </Button>
          )}
        </div>

        {!hasStripeCustomer && tier === 'free' && (
          <p className="text-xs text-zinc-500">
            Subscribe to a paid plan to manage billing through Stripe.
          </p>
        )}

        {showUpgrade && (
          <div className="text-sm text-zinc-400 pt-2">
            (Upgrade modal placeholder — wire in existing UpgradeModal here.)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

If an existing `UpgradeModal` component is available, import it and render it conditionally instead of the placeholder.

- [ ] **Step 2: Commit**

```
git add frontend/src/app/profile/_tabs/BillingTab.tsx
git commit -m "feat(frontend): add BillingTab with subscription + portal management"
```

---

## Task 11: NotificationsTab

**Files:**
- Create: `frontend/src/app/profile/_tabs/NotificationsTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/app/profile/_tabs/NotificationsTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type State = {
  emailAlerts: boolean;
  pushAlerts: boolean;
  discordWebhook: string | null;
};

export function NotificationsTab() {
  const { getToken } = useAuth();
  const [data, setData] = useState<State | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const u = await res.json();
        setData({
          emailAlerts: !!u.emailAlerts,
          pushAlerts: !!u.pushAlerts,
          discordWebhook: u.discordWebhook ?? '',
        });
      }
    })();
  }, [getToken]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      const token = await getToken({ template: 'backend' });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error();
      setMsg('Saved');
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!data) return <div className="text-zinc-400">Loading…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.emailAlerts}
            onChange={e => setData({ ...data, emailAlerts: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Email alerts</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.pushAlerts}
            onChange={e => setData({ ...data, pushAlerts: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Push alerts</span>
        </label>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Discord webhook URL</label>
          <Input
            value={data.discordWebhook ?? ''}
            onChange={e => setData({ ...data, discordWebhook: e.target.value })}
            placeholder="https://discord.com/api/webhooks/…"
          />
          <p className="text-xs text-zinc-500 mt-1">Leave blank to disable.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {msg && <span className="text-sm text-zinc-400">{msg}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
```

Note: if the backend `updateProfile` doesn't currently accept `discordWebhook`, leave the field in the UI but add it to the controller (same allowlist pattern — accept any string or empty). This is a tiny addition; do it in this task if needed.

- [ ] **Step 2: Verify backend accepts discordWebhook**

In `backend/src/controllers/userController.js` `updateProfile`, ensure this block exists:

```js
if (discordWebhook !== undefined) {
  if (typeof discordWebhook !== 'string') {
    return res.status(400).json({ error: 'discordWebhook must be string' });
  }
  data.discordWebhook = discordWebhook;
}
```

Also include `discordWebhook` in the destructure and response payload. Commit any backend change together with the tab.

- [ ] **Step 3: Commit**

```
git add frontend/src/app/profile/_tabs/NotificationsTab.tsx backend/src/controllers/userController.js
git commit -m "feat(frontend): add NotificationsTab with Discord webhook support"
```

---

## Task 12: SecurityTab

**Files:**
- Create: `frontend/src/app/profile/_tabs/SecurityTab.tsx`

- [ ] **Step 1: Write the component**

Move the existing change-password modal, delete-account modal, and Steam-connect section from the monolithic `profile/page.tsx` into this file. Keep them as-is (don't change behavior). Sketch:

```tsx
// frontend/src/app/profile/_tabs/SecurityTab.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SteamConnectSection } from '@/app/account/_components/SteamConnectSection';
import { Button } from '@/components/ui/button';
// Import any existing modals from the current profile/page.tsx — move them
// into _modals/ if you prefer, but for this task it's fine to keep them
// inline within SecurityTab.

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Steam connection</CardTitle>
        </CardHeader>
        <CardContent>
          <SteamConnectSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Move existing change-password trigger + modal here. */}
          <Button variant="outline">Change password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-400">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Move existing delete-account trigger + modal here. */}
          <Button variant="destructive">Delete account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

The actual modal logic from the current monolithic page must be preserved. Copy the change-password handler, modal state, and delete-account confirm modal verbatim from `frontend/src/app/profile/page.tsx`.

- [ ] **Step 2: Commit**

```
git add frontend/src/app/profile/_tabs/SecurityTab.tsx
git commit -m "feat(frontend): add SecurityTab with password + Steam + delete"
```

---

## Task 13: Profile page shell — wire tabs

**Files:**
- Modify: `frontend/src/app/profile/page.tsx`

- [ ] **Step 1: Replace page with tabbed shell**

Replace the body of `frontend/src/app/profile/page.tsx` with a thin shell. Keep any top KPI/header that already exists, then mount TabNav + the active tab below.

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { TabNav, type TabId } from './_components/TabNav';
import { AccountTab } from './_tabs/AccountTab';
import { BillingTab } from './_tabs/BillingTab';
import { NotificationsTab } from './_tabs/NotificationsTab';
import { SecurityTab } from './_tabs/SecurityTab';

const VALID: TabId[] = ['account', 'billing', 'notifications', 'security'];

export default function ProfilePage() {
  const params = useSearchParams();
  const { user } = useUser();
  const raw = params.get('tab');
  const active: TabId = (VALID as string[]).includes(raw ?? '')
    ? (raw as TabId)
    : 'account';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">
          {user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? 'Profile'}
        </h1>
        <p className="text-sm text-zinc-400">
          Manage your account, subscription, and preferences.
        </p>
      </header>

      <TabNav active={active} />

      {active === 'account' && <AccountTab />}
      {active === 'billing' && <BillingTab />}
      {active === 'notifications' && <NotificationsTab />}
      {active === 'security' && <SecurityTab />}
    </div>
  );
}
```

If the existing page rendered a KPI header (portfolio summary, total value, etc.), move that block into a new `_components/ProfileHeader.tsx` and render it above the tab nav.

- [ ] **Step 2: Manual smoke check**

Run the frontend:
```
cd frontend && npm run dev
```

Open `http://localhost:3000/profile?tab=account` and click each tab. Expected:
- URL updates with `?tab=<id>`
- Each tab renders without runtime errors
- AccountTab loads existing user data, can change currency, save, and see toast.
- BillingTab shows current tier; if Free, Upgrade button shows; if Pro, "Manage subscription" button shows.
- NotificationsTab loads alerts state.
- SecurityTab shows Steam, password, delete.

- [ ] **Step 3: Commit**

```
git add frontend/src/app/profile/page.tsx
git commit -m "refactor(frontend): decompose profile page into tabbed layout"
```

---

## Task 14: Wire currency into display sites

**Files:**
- Modify: `frontend/src/app/components/PortfolioDashboard.tsx`
- Modify: `frontend/src/app/components/ResearchPanel.tsx`
- Modify: any other file currently rendering `$` + numeric (grep below)

- [ ] **Step 1: Find all hardcoded `$` displays**

Use Grep with pattern `\\$\\{.*toFixed` and `\\$.*\\.toLocaleString` across `frontend/src/`. List the matches. Expect ~5–8 files.

- [ ] **Step 2: Replace in PortfolioDashboard**

At the top of `frontend/src/app/components/PortfolioDashboard.tsx`:
```tsx
import { useCurrency } from '@/contexts/CurrencyContext';
```
Inside the component, before the JSX:
```tsx
const { format } = useCurrency();
```
Replace every occurrence like `` `$${value.toFixed(2)}` `` (and similar `${'$'}{x}` patterns) with `format(value)`. Leave percentage / non-monetary numbers untouched.

- [ ] **Step 3: Replace in ResearchPanel**

Same pattern as above in `frontend/src/app/components/ResearchPanel.tsx`.

- [ ] **Step 4: Smoke check**

`npm run dev` → open the dashboard → switch currency in `/profile?tab=account` → return to dashboard → verify all monetary values now show with €/£ symbol and converted amount. Verify percentages and skin counts are unchanged.

- [ ] **Step 5: Commit**

```
git add frontend/src/app/components
git commit -m "feat(frontend): respect user currency preference in portfolio + research"
```

---

## Task 15: Run full backend test suite

- [ ] **Step 1: Run all backend tests**

```
cd backend && npm test
```

Expected: all tests pass, including the existing `sprint2.test.js` (10/11 baseline) and the new `profileRefactor.test.js`. If a previously-passing test fails, investigate — most likely a response-shape change in `subscriptionController.js` or `userController.js`.

- [ ] **Step 2: If failures, fix forward, re-run, commit any fixes**

```
git add backend/
git commit -m "fix(tests): align tests with updated profile + subscription shape"
```

---

## Task 16: Push branch

- [ ] **Step 1: Verify clean status**

```
git status
git log --oneline -15
```

Expected: clean working tree, ~10–12 new commits since branching from main, no untracked files of interest.

- [ ] **Step 2: Push**

```
git push -u origin claude/cranky-wilson-bb64cf
```

Expected: branch pushes to remote successfully.

---

## Notes for the implementer

- Every commit message MUST start with a Conventional Commits type (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`) — the repo's commit-msg hook enforces it.
- The backend tests hit a live server. Start it (`npm run dev` in `backend/`) and set `TEST_JWT` in the environment before running `npm test`.
- The frontend has no unit test runner currently — validate frontend by running `npm run dev` and clicking through. Type-check with `npm run build` before pushing.
- If you discover a `discordWebhook` field already in `updateProfile` — skip Task 11 Step 2. If not, add it as described.
- The existing `profile/page.tsx` has change-password and delete-account modals — those must be moved into `SecurityTab.tsx` (copy verbatim), not rewritten.
