# Profile + Settings Production-Readiness Plan

**Date:** 2026-05-18
**Author:** Claude (audit pass — read-only)
**Scope:** `/profile`, `/account`, `/settings` pages + supporting backend (`/api/v1/users/me*`)
**Status:** Recon complete. No code modified.

---

## Current state (inventory)

### Page 1 — `/profile` (the tabbed shell)
File: `frontend/src/app/profile/page.tsx`

Tabs (all in `frontend/src/app/profile/_tabs/`):

| Tab | File | Sections | Endpoints hit |
|---|---|---|---|
| Account | `AccountTab.tsx` | Email (disabled), Display name, Timezone, Currency, Theme | `GET /api/v1/users/me`, `PATCH /api/v1/users/me` |
| Billing | `BillingTab.tsx` | Tier badge, renewal date, cancel-at-period-end pill, Upgrade CTA, Stripe Portal button | `GET /api/v1/subscriptions/status`, `POST /api/v1/subscriptions/portal`, `POST /api/v1/subscriptions/checkout` |
| Notifications | `NotificationsTab.tsx` | Email alerts, Push alerts, Discord webhook URL | `GET /api/v1/users/me`, `PATCH /api/v1/users/me` |
| Security | `SecurityTab.tsx` | Steam connect (reuses SteamConnectSection), Change password, Danger Zone (Delete account) | `PATCH /api/v1/users/me/password`, `DELETE /api/v1/users/me`, Steam endpoints |

Header card: `_components/ProfileHeader.tsx` — avatar, displayName, email, tier badge, "Member since" date. Pulls `GET /api/v1/users/me`.

### Page 2 — `/account`
File: `frontend/src/app/account/page.tsx`

Contains two sections:
- **Connections (hero)** — `SteamConnectSection` — gradient CTA when disconnected, status card when connected. Hits `/api/v1/steam/{status,connect/redirect,disconnect,inventory/preview,inventory/import}`.
- **Profile (quiet)** — read-only email + member-since pulled from `useUser()` (Clerk client-side). No backend call.

### Page 3 — `/settings`
File: `frontend/src/app/settings/page.tsx`

Standalone (NOT a Profile tab). Contains:
- Preferences card: Display name + Timezone + Email/Push checkboxes → `PATCH /api/v1/users/me`
- Quick Actions: Change Password (modal), My Portfolio link, Sign Out
- Danger Zone: Delete account modal (type DELETE → `DELETE /api/v1/users/me`)
- Hits `GET /api/v1/users/me` on load.

### Backend
- `backend/src/routes/userRoutes.js` — mounts `verifyClerkJwt` on every `/me*` route. Mounted in `app.js:101` behind `sensitiveLimiter` (100 req / 15min).
- `backend/src/controllers/userController.js` — `getProfile` (returns role + isPremium + Stripe... wait, NOT Stripe IDs), `updateProfile` (whitelisted fields), `changePassword` (FAKE — stores literal `'clerk_handled'` in `passwordHash`), `deleteAccount` (raw `prisma.user.delete`).
- `backend/src/middleware/verifyClerkJwt.js` — JWKS verify; **fallback path on lines 80-91** mocks `req.userId = 1` if Clerk env vars missing (gated by `NODE_ENV !== 'production'`, OK).
- `backend/prisma/schema.prisma` model User — Watchlist, Portfolio, CasePortfolio, PortfolioHistory, Transaction, Alert relations do NOT specify `onDelete: Cascade`.

### Three settings surfaces, two of them live
`/profile`, `/account`, `/settings` ALL exist and overlap heavily:
- `/profile?tab=account` ≈ `/settings` Preferences (displayName, timezone, currency, theme)
- `/profile?tab=security` ≈ `/settings` password change + danger zone
- `/profile?tab=security` Steam Connect ≈ `/account` Connections section

ProfileDropdown (`components/ProfileDropdown.tsx`) links to BOTH `/profile` and `/settings`. Confusing.

---

## Gap analysis (vs Stripe / Linear / GitHub Settings)

| Dimension | Feature | Status | Notes |
|---|---|---|---|
| **Account** | Email display | ✓ | Read-only from Clerk |
| | Email change | ✗ | Not exposed in app (Clerk supports it via `<UserProfile>`) |
| | Display name | ✓ | AccountTab + Settings |
| | Avatar upload | ✗ | Uses initials/gradient placeholder only |
| | Bio / handle | ✗ | No public profile concept |
| | MFA / 2FA | ✗ | Clerk supports; not surfaced in our UI |
| | Active sessions list | ✗ | Clerk has it; not surfaced |
| | Account deletion w/ confirmation | ~ | UI exists, type-DELETE pattern, **backend will fail on FK cascade** |
| **Billing** | Current tier badge | ✓ | BillingTab |
| | Renewal date | ✓ | BillingTab |
| | Payment method last-4 | ✗ | Deferred to Stripe Portal |
| | Invoice history | ✗ | Deferred to Stripe Portal |
| | Upgrade / downgrade CTA | ~ | Upgrade-to-Pro only; no "Downgrade to Lite", no tier comparison inline |
| | Cancel flow | ~ | `cancel()` hook exists but **not wired to any UI button** — only Stripe Portal can cancel |
| | "Cancels on X" pill | ✓ | BillingTab |
| | Reactivate after cancel | ✗ | No CTA when cancelAtPeriodEnd true |
| **Notifications** | Email alerts toggle | ✓ | NotificationsTab |
| | Push alerts toggle | ✓ | Toggle present, no push pipeline yet on backend |
| | Discord webhook | ~ | Field exposed; no validation/test-ping button |
| | Per-skin alert preferences | ✗ | Lives in /alerts, not surfaced here |
| | Marketing opt-out | ✗ | No transactional/marketing split |
| | Frequency / digest | ✗ | All alerts fire immediately |
| **Integrations** | Steam Connect | ✓ | SteamConnectSection, good UX |
| | Disconnect Steam | ✓ | DELETE /steam/disconnect |
| | API tokens (personal) | ✗ | Public-API route exists for partners; no user-facing token UI |
| | Discord OAuth | ✗ | Removed per CLAUDE.md history |
| | Connected services list | ~ | Only Steam, no unified "Connections" pane |
| **Privacy & Data** | Data export (CSV/JSON portfolio) | ✗ | Only Pro tier `canExportCSV` flag, no export UI |
| | Data deletion request (GDPR) | ~ | Delete account exists but cascade broken |
| | Cookie preferences | ✗ | No banner / consent |
| | Privacy policy / ToS link | ✗ | Not on these pages (may exist in footer) |
| **Preferences** | Currency (EUR/USD/GBP) | ✓ | AccountTab + CurrencySelect |
| | Timezone | ✓ | AccountTab + Settings |
| | Theme toggle | ~ | UI present, only dark works ("Light mode lands soon") |
| | Language | ✗ | No i18n |
| | Date format / number format | ✗ | Inferred from locale only |
| **Profile / Identity** | Public display name | ~ | Saved, never rendered publicly |
| | Public profile URL | ✗ | No social/public surface |
| | Bio | ✗ | — |
| **Activity / Security** | Recent logins | ✗ | Clerk has it; not surfaced |
| | Audit log of changes | ~ | DB has `AuditLog` model, not surfaced to user |
| | Last-seen IP | ✗ | — |

**Legend:** ✓ present · ~ partial · ✗ missing

---

## Security findings

### 🚨 CRITICAL — Missing Authorization header on every write to /users/me
`fetchJson` (in `frontend/src/lib/api.ts`) does NOT attach Clerk tokens automatically. The following mutations call it with NO `Authorization: Bearer ...` header — they will 401 in production:

| File | Line | Call |
|---|---|---|
| `app/settings/page.tsx` | 80 | `PATCH /api/v1/users/me` (save preferences) |
| `app/settings/page.tsx` | 106 | `PATCH /api/v1/users/me/password` |
| `app/settings/page.tsx` | 130 | `DELETE /api/v1/users/me` |
| `app/profile/_tabs/AccountTab.tsx` | 75 | `PATCH /api/v1/users/me` (save) |
| `app/profile/_tabs/NotificationsTab.tsx` | 56 | `PATCH /api/v1/users/me` (save) |
| `app/profile/_tabs/SecurityTab.tsx` | 63 | `PATCH /api/v1/users/me/password` |
| `app/profile/_tabs/SecurityTab.tsx` | 92 | `DELETE /api/v1/users/me` |

GET calls do pass `Authorization` manually; mutations were forgotten. Two fixes possible:
1. Pass `Authorization` header at each call site (mirroring the GETs).
2. Refactor `fetchJson` to take an optional `getToken` and attach it for us (preferred — eliminates a whole class of bug).

### 🚨 CRITICAL — Fake password change writes literal string to DB
`backend/src/controllers/userController.js:270-274` — `changePassword` writes `passwordHash = 'clerk_handled'` (a literal string, NOT a hash) on every password change request, ignoring the actual passwords sent. Two problems:
- No actual password change happens (Clerk owns auth — this endpoint should either proxy Clerk's API or be removed entirely).
- Stores a plaintext sentinel, which (a) leaks intent and (b) means anyone who later checks `bcrypt.compare("clerk_handled", hash)` may pass.

Fix: remove the endpoint and direct UI to `<UserProfile />` Clerk component, OR proxy to Clerk's backend SDK `users.updateUserPassword(userId, { newPassword })`.

### 🚨 CRITICAL — `DELETE /users/me` will fail FK cascade
`prisma.user.delete({ where: { id: userId } })` in `userController.js:136` will throw `P2003` (FK constraint) because `Watchlist`, `Portfolio`, `CasePortfolio`, `PortfolioHistory`, `Transaction`, `Alert`, `AuditLog`, `JobRun`, `BlogPost` relations on `model User` (schema.prisma:36-44) lack `onDelete: Cascade`. Account deletion will appear to fail in production.

Fix options:
- Add `onDelete: Cascade` on those relations (destructive — data is gone).
- Soft-delete: add `deletedAt DateTime?` + filter everywhere (preserves audit + GDPR proof of deletion timing).
- Multi-step transaction: delete children first, then user.

GDPR also requires Clerk-side deletion (`clerkClient.users.deleteUser(clerkId)`) — currently not called.

### ⚠️ CONCERN — Mass-assignment bounds (good, but verify)
`updateProfile` whitelists fields explicitly (`userController.js:181-188`). Role / isPremium / Stripe IDs CANNOT be patched. ✅ Safe.

### ⚠️ CONCERN — JWT dev fallback path
`verifyClerkJwt.js:80-91` — if Clerk env vars missing AND `NODE_ENV !== 'production'`, attaches `req.userId = 1` (the admin/test user, Arri). Gated correctly, but a missing env var in prod would 500 (good) rather than silently authenticating. Confirm Vercel envs are set BEFORE next deploy.

### ⚠️ CONCERN — Sensitive data exposure in GET /me
`getProfile` returns `isPremium` and `role`. `role` exposes admin status to anyone with the user's JWT — fine for self, but ensure it's only ever the requesting user's. (It is — query is `where: { id: req.userId }`.) ✅ OK.

Notably NOT returned: `passwordHash`, `clerkId`, `stripeCustomerId`, `stripeSubscriptionId`, `steamId`. ✅ Good.

### ⚠️ CONCERN — Discord webhook field
`updateProfile` accepts arbitrary string for `discordWebhook` (no URL/host validation). User could store internal URLs → SSRF on alert dispatch. Add allowlist regex `^https://discord(app)?\.com/api/webhooks/...` before saving.

### ⚠️ CONCERN — Steam token in query string
`useSteamConnection.ts:66` — `connect()` does `window.location.href = ${apiUrl}/api/v1/steam/connect/redirect?token=${token}`. JWT in URL is logged by Render's access logs and any intermediate proxies. Use `state` param signed server-side, or set short-lived cookie.

### ⚠️ CONCERN — Rate limit too generous for sensitive paths
`sensitiveLimiter` = 100 req / 15min / IP. For `DELETE /me` and `PATCH /me/password`, that's effectively unlimited for brute force on `currentPassword`. Add per-route limit (5-10 / 15min) for password + delete.

### ✅ SECURE
- CSRF: backend is stateless JWT, not cookie-session → CSRF N/A. (`credentials: include` in `fetchJson` adds Clerk session cookie though — verify Clerk verifies signature not just presence.)
- XSS: React escapes by default. `displayName` rendered via `{...}`, never `dangerouslySetInnerHTML`. ✅
- HTTPS-only in prod (Vercel + Render). ✅

---

## Accessibility quick-scan

- ✅ Form labels: every Input has matching `<Label htmlFor>` in Profile tabs and Settings.
- ✅ Keyboard nav: shadcn Dialog handles focus trap; Tabs are radix.
- ⚠️ Color contrast: `text-slate-400` on `bg-slate-900` measures ~4.1:1 — borderline AA for normal text. Body copy in NotificationsTab descriptions uses `text-slate-400`.
- ✅ aria-live: Profile tabs use `aria-live="polite"` for save toasts. Settings page does NOT — toast updates only on screen-reader users won't be announced.
- ⚠️ icon-only buttons: most icons are `aria-hidden="true"` with a sibling text label. ✅. The avatar circle in ProfileHeader has `aria-hidden="true"` and the displayName next to it — OK.
- ⚠️ Delete modal autofocus lands on first focusable (Cancel?) — should land on the type-DELETE input.

---

## Production-readiness gaps

- ⚠️ Stripe price IDs: per CLAUDE.md "Before Production Deploy", `prod_...` placeholders not yet replaced with `price_...` IDs. Checkout will 500 in prod until done.
- ⚠️ Stripe live keys: still on test mode per CLAUDE.md.
- ✅ Error states: Profile tabs surface "Couldn't load…" and "Couldn't save…" messages.
- ⚠️ Loading skeletons: Profile has them; Settings page has them; AccountTab shows plain text "Loading account…".
- ✅ Empty states: BillingTab handles tier=free + cancelAtPeriodEnd.
- ⚠️ Optimistic updates: AccountTab waits for server roundtrip — no optimistic write/rollback. Toggle latency feels slow.
- ⚠️ Mobile: TabsList has `overflow-x-auto` ✅. Profile tabs render full-width cards — fine. Delete-confirm input is centered → keyboard on mobile may push it offscreen.
- ✅ Validation client+server: timezone validated both sides, currency/theme allowlisted server-side.
- ⚠️ DUPLICATE PAGES: `/settings` and `/profile?tab=account` save the same fields via the same endpoint. Pick one, redirect the other. Currently the ProfileDropdown shows BOTH "Profile" and "Settings" as separate items, which is confusing.

---

## Implementation roadmap (phases)

### Phase 1 — CRITICAL: working auth + account deletion safe (Day 1, ~3h)

Goal: every Profile/Settings mutation works in prod; deletion doesn't crash.

- [ ] **Refactor `fetchJson`** in `frontend/src/lib/api.ts` to accept a `getToken` parameter (or create an `authFetchJson` wrapper). Default to no-token; helper attaches `Authorization: Bearer ${token}`.
- [ ] **Fix `app/settings/page.tsx`** lines 76-91, 93-121, 123-136: pass `await getToken({ template: 'backend' })` into each `fetchJson` call.
- [ ] **Fix `app/profile/_tabs/AccountTab.tsx`** line 70-97 (`save` fn): pass token.
- [ ] **Fix `app/profile/_tabs/NotificationsTab.tsx`** line 51-75: pass token.
- [ ] **Fix `app/profile/_tabs/SecurityTab.tsx`** lines 50-82 (password) and 84-98 (delete): pass token.
- [ ] **Fix account deletion cascade** — edit `backend/prisma/schema.prisma` model User relations; add `onDelete: Cascade` to Watchlist, Portfolio, CasePortfolio, PortfolioHistory, Transaction, Alert, AuditLog, JobRun, BlogPost. Run `npx prisma migrate dev --name user_cascade_delete`. **Verify locally** that test user delete now succeeds.
- [ ] **Add Clerk-side delete** — in `userController.js#deleteAccount`, after Prisma delete, call `clerkClient.users.deleteUser(user.clerkId)`. Import from `@clerk/clerk-sdk-node`. Treat Clerk 404 as success (already gone).
- [ ] **Remove fake password endpoint** — delete `changePassword` handler in `userController.js` and the route in `userRoutes.js:23`. Replace the modal in SecurityTab with a link to Clerk `<UserProfile />` page (`/user-profile` or use `useUser().user.update({ password })` with current-password verification). Or hide the section entirely until properly wired.

**Verification:** Manual e2e:
1. Sign in as Arri (id=1) in prod.
2. Open `/profile?tab=account`, change displayName, Save → see "Saved." toast.
3. `/profile?tab=notifications`, toggle email alerts, Save → toast + reload retains value.
4. `/profile?tab=security`, click Delete (don't confirm) → modal opens.
5. (In staging only) actually delete a throwaway user → cleanly removes user + all FK rows.

### Phase 2 — Core UX completeness (Day 2-3, ~6h)

- [ ] **Collapse `/settings` into `/profile`**. Either:
  - (a) Make `/settings` a 308 redirect to `/profile?tab=account`, OR
  - (b) Delete `app/settings/page.tsx` and update ProfileDropdown to remove the Settings link.
  - Recommendation: (b). Drop ~250 lines of duplicate code.
- [ ] **Wire "Cancel subscription" UI** — BillingTab currently has `cancel()` hook unused. Add a `<Button variant="outline">Cancel subscription</Button>` that shows a confirm dialog ("You'll keep Pro until {renewalDate}") then calls `cancel()`. Show success toast.
- [ ] **Add "Reactivate" CTA** when `cancelAtPeriodEnd === true`. Backend needs an `uncancel` endpoint that calls `stripe.subscriptions.update(id, { cancel_at_period_end: false })`.
- [ ] **Discord webhook validation** — client-side regex check on URL host; backend allowlist `discord.com|discordapp.com`. Add a "Test webhook" button that POSTs a sample payload.
- [ ] **Data export** — add "Export portfolio (CSV)" button on AccountTab for Pro users (gated by `canExportCSV`). Backend route `GET /api/v1/portfolio/export` returns CSV.
- [ ] **Move Steam Connect to Account tab** — feels misplaced under Security. Reorganize: Account tab gets Connections sub-section (Steam), Security tab keeps password + delete only. Or: keep `/account` page as the Connections home and drop Steam from SecurityTab.
- [ ] **Optimistic toggle updates** — NotificationsTab checkboxes should flip immediately; revert on error.
- [ ] **Replace the broken Change Password modal with Clerk `<UserProfile />`** (or `useUser().update({password})` flow). UI should: (1) reveal Clerk-managed flow OR (2) deep-link to `https://accounts.skintrackr.io/user/security`.

**Verification:** UX click-through with stakeholder. Each save reflects in DB on next page reload.

### Phase 3 — Professional polish (Week 1, ~10h)

- [ ] **MFA / 2FA enablement** — surface Clerk's MFA setup. Add card on SecurityTab: "Two-factor authentication: Off · Set up". Links to Clerk-hosted flow.
- [ ] **Active sessions list** — Clerk's `useUser().user.sessions` (if available) or `clerkClient.sessions.getSessionList({ userId })`. Display with revoke buttons.
- [ ] **Light theme** — finally implement. AppShell reads `themePreference` from `useCurrency`/new `useTheme` context, toggles Tailwind dark class.
- [ ] **Public profile page** — `/u/[handle]` showing displayName + selected portfolio items (opt-in). Adds `handle` field to User model.
- [ ] **Avatar upload** — Clerk supports it via `user.setProfileImage(file)`. Add to AccountTab.
- [ ] **Tier comparison inline** — when on Free, BillingTab shows a 3-column Free / Lite / Pro card with feature checkmarks before the upgrade CTA.
- [ ] **Invoice history** — display last 10 invoices inline (from `stripe.invoices.list({ customer })`) so users don't always need the Portal.
- [ ] **Audit log surface** — list last 20 entries from `AuditLog` table for the user. New endpoint `GET /api/v1/users/me/audit`.
- [ ] **Email change flow** — Clerk supports it via `user.createEmailAddress({ email })` → verification. Surface in AccountTab.
- [ ] **Add aria-live to Settings page** before deletion (deferred: Settings page may be removed in Phase 2).

### Phase 4 — Long-tail / Nice-to-have (later)

- [ ] Per-skin alert preferences moved into NotificationsTab
- [ ] Marketing/transactional email split
- [ ] Cookie consent banner + preferences modal
- [ ] Personal API tokens (rotate, revoke, scope)
- [ ] Webhook signing for outgoing Discord pushes
- [ ] i18n (DE first — Arri is German-speaking, comments are bilingual)
- [ ] Per-user rate-limit dashboard for Pro+ users

---

## Out of scope / Deferred (with rationale)

- **MFA enforcement / step-up auth**: Pro feature later. Phase 3 surfaces it, doesn't force it.
- **SOC 2 / GDPR audit work**: separate compliance pass.
- **Mobile native app**: not on roadmap.
- **Discord OAuth login**: explicitly removed previously; not re-adding.
- **Subscription gifting / coupons**: post-revenue feature.
- **Custom domains / SSO**: enterprise tier, distant future.

---

## Verification (per phase)

### Phase 1
1. Open browser devtools → Network → confirm every `/users/me` request shows `Authorization: Bearer eyJ...`.
2. Edit displayName, Save, reload page → field persists.
3. In staging, create throwaway user with seeded portfolio → trigger Delete → confirm row removal in `User`, `Portfolio`, `Watchlist`, `Alert`, `AuditLog`. Also confirm Clerk user is gone.
4. Confirm `/users/me/password` route returns 404 (removed) OR proxies Clerk successfully.

### Phase 2
1. ProfileDropdown shows only one settings entry.
2. Free user can complete checkout → returns to `/profile?tab=billing` → can click "Cancel" → modal → confirm → status flips to `cancelAtPeriodEnd`.
3. Reactivate button appears, click → resubscribed.
4. Invalid Discord webhook URL → backend 400, UI shows error.
5. Pro user clicks Export → CSV file downloads with portfolio rows.

### Phase 3
1. Set up MFA via SecurityTab → Clerk flow completes → "On" badge appears.
2. Sessions list shows current session + other devices.
3. Theme toggle switches between Dark/Light without reload.
4. `/u/arthur` renders public profile.
5. Click "Update avatar" → upload PNG → image appears on next render.

---

## Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cascade-delete migration loses real user data | Low (mig. is destructive) | High | Run on staging first; back up `User` + related tables before prod migrate; consider soft-delete instead |
| Removing `changePassword` endpoint breaks active sessions | Low | Low | Endpoint is non-functional today (writes literal string); removing it improves security; users can still use Clerk's password UI |
| Removing `/settings` route 404s for users who bookmarked it | Medium | Low | Use 308 redirect to `/profile?tab=account` rather than hard delete; remove in 6 months |
| `fetchJson` refactor breaks other call sites | Medium | Medium | Keep old signature working — make `getToken` optional. Tests should catch regressions. |
| Stripe Portal session creation fails when no `stripeCustomerId` | Low | Medium | BillingTab already gates on `hasStripeCustomer` ✅ |
| Steam token-in-URL fix breaks the connect flow | Medium | Medium | Treat as Phase 2/3 — separate plan, not bundled here |
| Clerk SDK install adds bundle size | Low | Low | `@clerk/clerk-sdk-node` is backend-only; frontend already has Clerk |

---

## Total task count

- Phase 1: 7 tasks
- Phase 2: 8 tasks
- Phase 3: 9 tasks
- Phase 4: 7 tasks
- **Total: 31 tasks**

## Effort estimate

- Phase 1: ~3h (critical security + auth fixes)
- Phase 2: ~6h (core UX)
- Phase 3: ~10h (polish)
- Phase 4: ~deferred

**Recommended sequence:** ship Phase 1 today, Phase 2 over 2 days, Phase 3 over the next week, Phase 4 backlog.
