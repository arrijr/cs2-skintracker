# Profile Refactor: Tabs + Currency + Theme + Billing

**Date**: 2026-05-18
**Status**: Approved, ready for implementation plan
**Branch**: `claude/cranky-wilson-bb64cf` (worktree)

## Goal

Refactor the existing profile page (`frontend/src/app/profile/page.tsx`, currently ~718 LOC monolithic) into a tabbed layout with four sections, add user preferences for currency and theme, surface subscription/billing management directly on the profile.

## Non-Goals (YAGNI)

- Light-mode visual styling — only store the pref, render everything dark
- Avatar image upload (initials remain)
- Two-factor authentication, sessions list
- Public/shareable profile URLs
- Telegram / SMS / email-digest notification channels (Discord webhook UI only, leveraging existing schema field)
- Live FX rates from external API — static table only

## Architecture

### Tab Layout

URL-synchronized tabs on the profile page using `?tab=<id>`:

| Tab | Purpose |
|---|---|
| `account` | Display name, email (readonly), timezone, currency, theme, member-since |
| `billing` | Current tier, renewal date, Stripe Customer Portal link, upgrade CTA |
| `notifications` | Email alerts, push alerts, Discord webhook URL |
| `security` | Change password, Steam connection, delete account |

Default tab: `account`. Tab nav is a horizontal pill row at the top. Tab content swaps below — no full page reload.

### Backend Changes

#### Prisma Schema (`backend/prisma/schema.prisma`)

Add two fields to `User`:

```prisma
preferredCurrency String @default("USD") // USD | EUR | GBP
themePreference   String @default("DARK") // DARK | LIGHT | SYSTEM
```

Migration name: `add-user-preferences`.

#### Currency Config (`backend/src/config/currency.js` — new)

```js
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'];
export const FX_RATES = { USD: 1.00, EUR: 0.92, GBP: 0.79 };
export const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };
export const SUPPORTED_THEMES = ['DARK', 'LIGHT', 'SYSTEM'];
```

Rates are committed values — update is a code-change deploy, not a runtime concern.

#### Endpoints

- `PATCH /api/v1/users/me` — extend to accept `preferredCurrency`, `themePreference`. Reject unknown values (400). Existing validation in `userController.updateProfile()` is the place.
- `GET /api/v1/users/me` — include both new fields in response.
- `POST /api/v1/subscriptions/portal` — NEW. Creates a Stripe Customer Portal session for the authenticated user and returns `{ url }`. Auth required. Returns 404 if user has no Stripe customer ID.
- `GET /api/v1/users/me/currency` — NEW (optional, can also be inlined in `/me`). Returns `{ currency, symbol, rate, supported: [...] }` for the current user. Used by frontend `CurrencyContext`.

#### Subscription Status Endpoint

Existing `GET /api/v1/subscriptions/status` must surface:
- `tier` (`free` | `pro`)
- `renewal_date` (ISO timestamp or null)
- `cancel_at_period_end` (boolean)
- `stripe_customer_id` (presence only — flag whether portal is available)

If any of these aren't already returned, extend the response shape.

### Frontend Changes

#### File Structure

```
frontend/src/app/profile/
  page.tsx                    # New shell: tab nav + active tab routing (under 200 LOC)
  _tabs/
    AccountTab.tsx            # Display name, timezone, currency, theme
    BillingTab.tsx            # Tier, renewal, portal, upgrade CTA
    NotificationsTab.tsx      # Email/push toggles, Discord webhook input
    SecurityTab.tsx           # Pwd change, Steam, delete
  _components/
    TabNav.tsx                # Pill-row tab navigation
    CurrencySelect.tsx        # Dropdown
    ThemeSelect.tsx           # Dropdown
```

The existing monolithic `page.tsx` is decomposed — its sections become tab components. Risk metrics + KPI overview stay above the tab nav as a header (it's the "at-a-glance" view).

#### CurrencyContext (`frontend/src/contexts/CurrencyContext.tsx` — new)

```tsx
type CurrencyContextValue = {
  currency: 'USD' | 'EUR' | 'GBP';
  symbol: string;
  rate: number;
  format: (usdAmount: number, opts?: { decimals?: number }) => string;
  isLoading: boolean;
};
```

- Reads `user.preferredCurrency` on mount via `/users/me`.
- `format(123.45)` → multiplies by `rate`, applies `Intl.NumberFormat` with the user's locale, prefixes/postfixes symbol.
- Provider wraps the app at root layout level.

#### Currency Display Touch Points

Files that currently hardcode `$` or USD-only numbers and need to call `format()`:

- `frontend/src/app/profile/page.tsx` (KPI cards)
- `frontend/src/app/components/PortfolioDashboard.tsx`
- `frontend/src/app/components/ResearchPanel.tsx`
- `frontend/src/app/components/SkinPriceHistoryChart.tsx` (Y-axis labels)
- Anywhere a `toFixed(2)` with `$` prefix appears (grep for `\$\{.*toFixed`)

Estimated 5–8 files.

#### Billing Tab Logic

Extend existing `frontend/src/hooks/useSubscription.ts` to expose the new fields from `/subscriptions/status`. Add `openPortal()` method that POSTs to `/subscriptions/portal` and `window.location = url`.

- **Free user** → "Upgrade to Pro" CTA opens existing `UpgradeModal`.
- **Pro user** → tier badge, renewal date, "Manage Subscription" button (calls `openPortal()`).
- **Pro + cancel_at_period_end=true** → "Subscription ends on <date>" + "Resume" link via portal.

### Data Flow

```
User picks EUR in AccountTab dropdown
  → PATCH /users/me { preferredCurrency: 'EUR' }
  → Server validates, updates row, returns full profile
  → useUser() refetch triggers
  → CurrencyContext re-derives { currency: 'EUR', rate: 0.92, symbol: '€' }
  → All consumers (KPI cards, portfolio, research) re-render
  → "$1,234.56" becomes "€1,135.80"
```

## Error Handling

- **Invalid currency / theme**: server 400, frontend shows inline form error.
- **Stripe portal unavailable** (user has no Stripe customer): button shown but disabled with tooltip "Subscribe first to manage billing".
- **Discord webhook URL**: optional, validated server-side via URL regex. Empty string clears.
- **PATCH /me failure**: revert optimistic update, show toast.

## Testing

### Backend
- Unit: `currency.js` exports — valid currencies pass, invalid rejected.
- Integration: `PATCH /users/me` with new fields (happy + invalid value).
- Integration: `POST /subscriptions/portal` — happy path (mock Stripe), 404 when no customer.

### Frontend
- Unit: `CurrencyContext.format()` — USD passthrough, EUR conversion, locale formatting.
- Render: each tab renders without error, given mock user/subscription.
- Manual: switch currency in AccountTab, verify portfolio + KPIs reflect new symbol+value.

## Migration / Rollout

1. Backend migration — additive only, defaults backfill existing rows.
2. Backend endpoints — deploy first, idle until frontend lands.
3. Frontend ships tabbed page + currency context together.
4. No feature flag — additive change with safe defaults.

## Out of Scope / Future

- Avatar upload (Vercel Blob + crop UI)
- Live FX rates with caching
- Light-mode visual implementation (Tailwind theme refactor)
- 2FA, sessions, public profile, additional notification channels
