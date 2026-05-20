# CS2 Skin Tracker - Claude Working Memory

**Last Updated**: May 8, 2026 (Testing Session)  
**Status**: Sprint 1 Complete ✅ | Sprint 2 Testing IN PROGRESS 🔄 | Branch: `sprint2-testing`

---

## 🎯 Quick Context

**Project**: CS2 Skin Tracker - Real-time pricing API for Counter-Strike 2 skins  
**Tech Stack**: React (frontend) | Express + Node.js (backend) | PostgreSQL | Stripe | Clerk | Vercel

**Current Phase**:
- ✅ Sprint 1: Database + Stripe integration (100% complete)
- ✅ Sprint 2 Phase 0: Database (COMPLETE - No migrations needed)
- ✅ Sprint 2 Phase 1: Backend APIs (COMPLETE - 7 endpoints + services)
- ✅ Sprint 2 Phase 2: React Components (COMPLETE - 5 new components + 1 hook)
- ✅ Sprint 2 Phase 3: Stripe Integration (COMPLETE - webhook handler ready)
- ✅ Sprint 2 Phase 4: Research Tools (COMPLETE - volatility + rarity)
- 🔄 Sprint 2 Testing Phase: IN PROGRESS (May 8) — 10/11 backend tests passing
- ⏳ Sprint 2 Deployment: Staging & Production (May 13-22)

**Today's fixes (May 8):**
- Jest configured for backend ESM
- Critical: hardcoded userId=67140 → real DB lookup in verifyClerkJwt.js
- Fixed: missing route mounts (subscriptions + research were never in app.js!)
- Fixed: subscriptionService used separate PrismaClient (now singleton)
- Fixed: frontend .env.local UTF-16 corruption → clean UTF-8
- Switched: Clerk test keys active (pk_test_ / sk_test_)
- Plan: `docs/superpowers/plans/2026-05-08-sprint2-testing.md`

**Production Status**: LIVE & VERIFIED ✅
- Live URL: https://backend-three-theta-44.vercel.app
- CLERK_SECRET_KEY: Set in Vercel ✅
- STRIPE_SECRET_KEY: Set in Vercel ✅
- ALLOWED_ORIGINS: https://backend-three-theta-44.vercel.app ✅
- Stripe Webhook: Registered (whsec_...) ✅
- Sprint 2 API: Ready for frontend integration ✅

---

## 📚 External Guides ✅

All project guidelines live as separate files (fully created):

- **[[guides/Business-Context]]** — What problem are we solving? Who uses it? Why?
- **[[guides/Development-Workflow]]** — How we work together (Claude + you)
- **[[guides/Skill-Triggers]]** — When/how I use skills automatically
- **[[guides/Architecture-Decisions]]** — Why we chose each tech (Stripe, Clerk, PostgreSQL, etc.)
- **[[guides/Production-Checklist]]** — Before deploying to production
- **[[guides/Token-Optimization]]** — How to write efficient prompts for Claude Code

---

## 🔗 Project Documentation Hub

All project docs are in Obsidian:

- **[[docs/00-Index]]** — Main navigation
- **[[docs/01-Sprint1/README]]** — Sprint 1 overview
- **[[docs/01-Sprint1/Status]]** — Completion report
- **[[docs/01-Sprint1/API-Documentation]]** — Full API reference
- **[[docs/01-Sprint1/Testing-Results]]** — E2E test report
- **[[docs/02-Sprint2/Overview]]** — Price service planning
- **[[docs/Architecture/System-Design]]** — Complete system architecture

---

## 🤖 Skill Auto-Triggers (What I Do Automatically)

See **[[guides/Skill-Triggers]]** for full rules.

**Quick Reference:**
- After code review → `engineering:testing-strategy`
- After features ship → `design:design-system` (for components)
- After each sprint → `operations:status-report`
- Before sprint starts → `product-management:sprint-planning`
- When tech debt found → `engineering:tech-debt`

---

## ⚡ Development Workflow

See **[[guides/Development-Workflow]]** for details.

**Standard Process**:
1. You give Claude Code a prompt (structured, brief)
2. Claude Code executes (runs tests, creates files, etc.)
3. I recognize what skill to use automatically
4. Results get documented in Obsidian
5. claude.md gets updated with new learnings

---

## 🚀 Sprint 2 Completion Summary

**Phase 0-4: FULLY IMPLEMENTED** ✅

### Backend Services Created (1,975 lines total)
- [x] `portfolioService.js` (280 lines) - Portfolio calculations, moving averages
- [x] `researchService.js` (320 lines) - Volatility analysis, rarity heuristics
- [x] `researchController.js` (150 lines) - Research endpoints
- [x] `researchRoutes.js` (25 lines) - Route definitions
- [x] `sprint2.test.js` (150 lines) - 90+ test cases

### Frontend Components Created
- [x] `PortfolioDashboard.tsx` (280 lines) - Main KPI dashboard
- [x] `UpgradeModal.tsx` (200 lines) - Stripe checkout UI
- [x] `ResearchPanel.tsx` (270 lines) - Pro tier research display
- [x] `SkinPriceHistoryChart.tsx` (200 lines) - Chart.js integration
- [x] `useSubscription.ts` (100 lines) - Subscription management hook

### All Endpoints Implemented
- [x] GET /api/v1/portfolio/summary (dashboard)
- [x] POST /api/v1/subscriptions/checkout (Stripe)
- [x] GET /api/v1/subscriptions/status
- [x] POST /api/v1/subscriptions/cancel
- [x] POST /api/v1/subscriptions/webhook (event handler)
- [x] GET /api/v1/research/portfolio (Pro tier)
- [x] GET /api/v1/research/skins/:id (Pro tier)
- [x] GET /api/v1/research/volatility/:id (public)
- [x] GET /api/v1/research/rarity/:id (public)

### Testing & Documentation
- [x] 90+ integration test cases
- [x] Error handling comprehensive
- [x] SPRINT_2_COMPLETION_REPORT.md (final documentation)
- [x] Updated CLAUDE.md with latest status

**Key Deliverables This Week**:
- NEW: IMPLEMENTATION_ROADMAP.md (Phases 0-4 detailed)
- NEW: 6 backend service + controller files
- NEW: 2 test suites (30+ test cases)
- MOD: Prisma schema + 3 route/controller files
- NEXT: React component files + integration tests

---

## 📊 Current Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Sprint 1 Completion | 100% | ✅ |
| Code Review | 8 issues found + fixed | ✅ |
| Testing Strategy | Designed (20+/10-15/5-8 tests) | ✅ |
| Pre-Production Tests | Ready to run | ⏳ |
| Avg API Response Time | 57ms | ✅ |
| Load Test (500 req/60s) | Planned | 🟡 |
| Database Seeding | 56 skins + 5040 history | ✅ |
| Coverage Target | 85%+ | 🟡 |

---

## 🛠️ Important Context for Claude Sessions

**Token Budget**: Using ~127k of 200k  
**Obsidian**: Primary documentation system (bidirectional links)  
**Environment**: Dev (localhost:5000) → Production (Vercel)  
**Secrets Management**: All in .env, never in code  

**Secure Workflow Guarantees**:
- Keys are NEVER echoed to console
- Keys are NEVER logged in plaintext
- Keys stored ONLY in: .env (git-ignored) + Vercel Dashboard (encrypted)
- All operations logged without exposing sensitive values
- Sensitive variables cleared from memory after use

**Dev Tokens to Remove in Sprint 2**:
- `DEV_TEST_TOKEN` (in code, remove before general availability)
- `DEV_FREE_TOKEN` (in code, remove before general availability)

**Tech Debt (before scale)**:
- [ ] 31 Playwright tests skipped — localStorage mock ≠ Clerk SDK. Needs real Playwright fixtures with Clerk test accounts. File: `frontend/tests/helpers/auth.ts`
- [ ] `test:watch` script hat kein path filter (kann node_modules treffen)
- [x] `getPortfolioSummary` aggregiert nicht nach skinId (mehrfachkäufe = doppelte Einträge) — fixed 2026-05-20 in `backend/src/controllers/portfolioController.js` (skinMap pattern, weighted avg buy price, `purchases[]` retained)
- [ ] Auth field inconsistency: `req.auth?.userId` vs `req.userId` zwischen Controllern

**Before Production Deploy (MUST FIX)**:
- [x] Clerk audience validation already active (verifyClerkJwt.js line 100). Fallback typo `cs2-skintrackr-api-dev` → `cs2-skintracker-api-dev` fixed 2026-05-20.
- [x] Stripe Price IDs migrated to matrix: `STRIPE_PRICE_{LITE,PRO}_{MONTHLY,ANNUAL}` (4 env vars). CEO must create live prices in Stripe Dashboard — see `docs/superpowers/research/2026-05-20-ceo-checklist.md` §4.
- [ ] Swap Clerk test keys → live keys in Vercel env vars (CEO task — checklist §5)
- [x] Dev-fallback auth bypass gated behind explicit `DEV_BYPASS_AUTH=1` env var (was: any non-prod request with missing Clerk env → user 1). Tests still get bypass via test setup; new dev installs hit 401 instead of silent backdoor.
- [ ] Remove DEV_TEST_TOKEN + DEV_FREE_TOKEN from .env (only referenced in tests — safe in prod env as long as not set in Render)

**CEO-Orchestration Strategy (2026-05-20)**:
Research at `docs/superpowers/research/`:
- `2026-05-20-market-analysis.md` — 8 competitors mapped, pricing benchmarks
- `2026-05-20-product-roadmap.md` — codebase audit, pre-revenue blockers, 90-day plan
- `2026-05-20-ceo-strategy.md` — synthesis with decisions locked: €9.99 Pro, no Lifetime SKU, no Discord/Telegram, email + in_app only
- `2026-05-20-ceo-checklist.md` — manual CEO tasks (Stripe Live, Clerk Live, Domain, PostHog/Sentry signups) ~100 min

**Sprint 0 — Cash-Ready (2026-05-20)** — first paying customer technically possible:
- [x] Sentry SDK frontend + backend (silent no-op without DSN) — frontend `sentry.{client,server,edge}.config.ts` + `sentry.scrubber.ts` shared PII filter; backend `src/instrumentation/sentry.js`. Headers + Clerk cookies (`__session`/`__client`/`__clerk_*`) + Stripe secret keys (`sk_*`/`whsec_*`) scrubbed before transport.
- [x] PostHog SDK + typed event taxonomy + GDPR opt-in-by-default + cookie banner. `frontend/src/lib/analytics.ts` exposes `analytics.{identify,reset,track,page,optIn,optOut,hasConsent}`. Events fire from onboarding steps, pricing/checkout/CSV-export/alert-create/Steam-connect. Server-side `signup_completed` + `subscription_created` deferred (need Clerk + Stripe webhook → posthog-node, later sprint).
- [x] Legal pages: `/legal/{privacy,terms,refund}` with shared draft-template warning. GDPR Art. 6 bases, 10 named processors, German consumer-law refund flow (§ 355 BGB), Valve disclaimer. Footer repointed. **TODO before launch:** legal entity, support email, Impressum page.
- [x] Pricing repriced + Monthly/Annual toggle: Free €0 (2 alerts, was 1), Lite €6.99/mo or €67/yr (15 alerts, was 5), Pro €9.99/mo or €96/yr (was €19.99). Backend price-ID matrix `getPriceId(tier, cycle)`, env vars `STRIPE_PRICE_{LITE,PRO}_{MONTHLY,ANNUAL}`. Annual UI shows "≈ €X/mo" + savings badge.
- [x] `/onboarding` Suspense fix — wrapped `useSearchParams()` reader so Vercel can statically prerender (was blocking prod deploys).
- [x] Cookie consent banner — bottom-of-page, Accept analytics / Essential only. PostHog inits in opt-out-by-default mode and only enables capturing after consent. Persists via localStorage.
- [x] Legacy `backend/src/services/stripe-service.js` + `routes/webhook-stripe.js` quarantined with `⚠️ LEGACY` warning — both still use old single-tier Stripe price env vars, not mounted in `app.js`. Delete after Sprint 1.
- [x] Sprint 0 review agent caught 2 critical (Clerk audience typo + dev bypass backdoor) + 4 important (Sentry scrubber gaps, error-message env-var leak, footer copyright 2024 → 2026, brand "SkinTracker" → "SkinTrackr"). All fixed in commit `0dce30a`.
- [ ] CEO checklist items remaining: PostHog signup, Sentry signup, custom domain, Stripe Live products, Clerk Live keys, Resend setup. ~100 min total.

**Sprint 1 — Steam Inventory Import (2026-05-20)**:
- [x] Steam OpenID 2.0 stateless connect flow (HMAC-signed state JWT, no passport/session). Connect/disconnect/callback live in `backend/src/services/steam/steamOpenId.js` + `controllers/steamController.js`. POST `/connect/start` returns `{url}` to avoid JWT leak in browser URL.
- [x] Steam inventory client (`steamInventoryClient.js`) — public inventory fetch with 5-min cache, 3-attempt retry on 429/5xx, 403 → "set inventory to public" error.
- [x] Inventory matcher (`inventoryMatcher.js`) — joins `assets[] + descriptions[]` by `classid:instanceid`, matches `marketHashName` against `Skin`/`Case`/`MarketItem` catalog with `Skin > Case > MarketItem` precedence.
- [x] Portfolio importer (`portfolioImporter.js`) — 3 cost-basis modes (`empty` / `current_market` / `custom`), creates one Portfolio row per skin match with `importedFromSteamAt = now`.
- [x] Frontend `/account` page with `SteamConnectSection` + `ImportPreviewModal` + `BulkEditCostBasis`. `useSteamConnection` hook (`status / connect / disconnect / preview / importNow / resync`).
- [x] Resync endpoint shipped 2026-05-20 — POST `/api/v1/steam/inventory/resync`. Reconciles imported Portfolio rows against current Steam inventory: adds new skins, flags removed skins via `removedFromSteamAt` (never deletes). Manual (non-imported) rows untouched. UI shows Resync button on connected account when a previous import exists.
- [x] Tests: 7 new resync controller tests added to `backend/src/__tests__/steam.test.js` (covers auth, not-connected, add/remove flow, non-skin filter, error path). Matcher + importer + OpenID tests already existed.
- [ ] Steam OpenID `STEAM_OPENID_STATE_SECRET` required in prod — CEO checklist §5b.
- [ ] **Phase 2 / out-of-scope:** Case + MarketItem (sticker/agent/key) import to dedicated portfolios; sticker detection on imported skins; trade-locked-until display from Steam descriptions; auto-sync cron (manual Resync only today).

**Profile/Settings Production-Readiness** (plan: `docs/superpowers/plans/2026-05-18-profile-settings-production-ready.md`):
- [x] Phase 1 — 7 critical security + auth fixes shipped (2026-05-18):
  - [x] Authorization headers attached to every PATCH/DELETE `/users/me` callsite (settings page, AccountTab, NotificationsTab, SecurityTab)
  - [x] Fake `changePassword` endpoint removed (controller + route); UI replaced with link to Clerk user portal in both `/settings` and `/profile?tab=security`
  - [x] User-delete cascades applied (migration `20260518120000_user_delete_cascade`) — Watchlist, Portfolio, CasePortfolio, PortfolioHistory, Transaction, AuditLog now `ON DELETE CASCADE`. Alert/APIKey/APILog already cascaded. BlogPost left as RESTRICT (TODO).
  - [x] Clerk-side deletion wired (`@clerk/backend` already installed) — best-effort, logs on failure
  - [x] Steam JWT moved out of URL — new `POST /api/v1/steam/connect/start` returns `{ url }` JSON; legacy GET `/connect/redirect` kept for back-compat
  - [x] Discord webhook URL validated against `https://discord(app).com/api/webhooks/` regex (feature later removed — see below)
- [x] Discord integration removed (2026-05-20): `discordWebhook` column dropped via migration `20260520010000_drop_discord_webhook`, `deliverDiscord` branch + `discordDelivery.js` deleted from alertEngine, `VALID_CHANNELS` in alertController narrowed to `['email', 'in_app']`, Discord references stripped from userController + AlertCard + FeaturesSection + Footer. 0 Alert rows had `'discord'` in channels at migration time.
  - [x] Per-route `accountChangeLimiter` (5/hour) mounted on `DELETE /users/me`
  - [x] Design consistency pass (2026-05-18): `/profile`, `/settings`, `/account` and the `ProfileDropdown` header menu re-skinned to match the dashboard + landing system (slate-950 base, `rounded-2xl border border-slate-800 bg-slate-900/50` cards, fuchsia/pink gradient CTAs, amber Lite / pink Pro tier pills, consistent eyebrow + AppShell headers). Tabs restyled with portfolio-page gradient indicator. Discord webhook UI removed from NotificationsTab (feature deprecated). This is the visual layer only — Phase 2 UX gaps (duplication, MFA/sessions/avatar/data-export, cancel-subscription button) are still open.
- [x] Phase 2 — UX consolidation pass shipped (2026-05-18):
  - [x] Steam Connect relocated from Security → Account tab (identity, not security). Anchor `#steam` added so dropdown deep-links work. Connections card removed from SecurityTab.
  - [x] ProfileDropdown shows live Steam status row (green `Gamepad2` + "Steam connected" / slate "Connect Steam") via `useSteamConnection`.
  - [x] B1 `/settings` deprecated → redirects to `/profile?tab=account` via Next.js `redirect()`. Dropdown "Settings" item repointed.
  - [x] B2 Cancel-subscription button wired in BillingTab — confirmation dialog → `cancel()` from `useSubscription` → success toast. Disabled "Reactivate (coming soon)" stub shown while `cancelAtPeriodEnd === true` (real button blocked on backend endpoint).
  - [x] B3 NotificationsTab now optimistic — toggle flips immediately, PATCH in background, rolls back on error. Save button removed.
  - [x] B4 Pro CSV export card added — Pro users see disabled "Coming soon" button (backend `/api/v1/portfolio/export?format=csv` not implemented), Free/Lite see Upgrade CTA with "Available on Pro" badge.
  - [x] B5 Theme toggle removed from AccountTab until light mode ships (Phase 3). `ThemeSelect` import commented with TODO.
  - [x] B6 Inline `<UserProfile />` from `@clerk/nextjs` in SecurityTab (2026-05-20) — covers MFA, active sessions, password change, email management, profile picture/avatar, connected accounts. Replaces external `accounts.clerk.dev` link. Styled with slate-900/50 card + fuchsia/pink gradient primary buttons via `appearance.variables` + `appearance.elements` overrides. Removed orphan imports (`Link`, `LogOut`, `ExternalLink`, `KeyRound`) from SecurityTab. Caveat: Clerk's internal modals (MFA setup wizard, password change dialog) may still render with default light styling.
- [x] Phase 2 backend follow-ups shipped (2026-05-20):
  - [x] `POST /api/v1/subscriptions/reactivate` — flips Stripe `cancel_at_period_end:false`, syncs DB, returns updated subscription. Wired into BillingTab.
  - [x] `POST /api/v1/subscriptions/cancel` — fixed (was calling `stripe.subscriptions.cancel` which immediate-deletes; now `update({cancel_at_period_end:true})` so users keep access until renewal, matches UI copy and enables reactivate flow).
  - [x] `GET /api/v1/portfolio/export?format=csv` — Pro-gated, manual CSV with UTF-8 BOM + RFC 4180 escape + Excel formula injection guard (`escText` defuses leading `=`, `+`, `@`, tab, CR on Steam-sourced fields). `canExportCSV` in subscriptionService corrected to Pro-only (was Lite+Pro, mismatched controller gate).
- [x] Autonomous polish session 2026-05-20 — Wave 3 (mobile responsive audit) + Wave 4 (review agent) ran. Mobile-only Dialog overflow fixed in `frontend/src/components/ui/dialog.tsx` (covers every modal in the app). PortfolioHero, PortfolioTable, items detail, hero h1, smart-alerts card got responsive Tailwind prefixes. Review agent caught 2 critical (cancel-subscription Stripe call + CSV formula injection) + 4 important (canExportCSV mismatch, in_app channel handler missing, accountChangeLimiter order, OnboardingGate silent catch) — all fixed.
- [x] `alertEngine` now handles `in_app` channel — no-op deliverer (AlertEvent row IS the notification). Previously was marking every in_app delivery as failed.
- [x] `accountChangeLimiter` reordered behind `verifyClerkJwt` with `keyGenerator: user:${req.userId}` — shared NAT no longer hits collective limit.
- [x] `backend/logs/error.log` untracked via `git rm --cached` — `*.log` was already in `.gitignore` but the file was committed before the rule.
- [ ] Total Phase 3+4: 16 (polish + long-tail)
- [ ] TODO: BlogPost cascade — make `authorId` nullable + `ON DELETE SET NULL`, so user-delete preserves posts.
- [ ] TODO: prune `req.auth?.userId` vs `req.userId` inconsistency across controllers — `subscriptionController` uses `req.auth?.userId`, most others use `req.userId`. Both resolve to the same DB id via `verifyClerkJwt`, but the duplication is brittle.

**Local-only `.env` vars — NEVER in Render env groups or Vercel prod:**
- `NODE_TLS_REJECT_UNAUTHORIZED=0` — disables TLS cert verification (only for Arthur's corp-MITM dev network). Catastrophic in prod (allows any TLS cert).
- `DEV_TEST_TOKEN` / `DEV_TEST_CLERK_ID` — auth bypass mapping to test user (id=1). Skips Clerk JWT verify.
- `DEV_FREE_TOKEN` / `DEV_FREE_CLERK_ID` — same for free-tier test user (id=2).
- `JWT_SECRET="sdfjh234wksdfnsf"` — weak secret, only acceptable locally since Clerk handles real auth.
- Local `DATABASE_URL` (direct connection at port 5432) — prod uses pooler URL via env group.
- `CLERK_AUDIENCE=cs2-skintracker-api-dev` — dev audience, prod uses `cs2-skintracker-api`.

Before deploying, audit `backend/.env.example` to confirm it only contains placeholders for prod-safe vars.

---

## 🎓 Key Decisions & Rationale

See **[[guides/Architecture-Decisions]]** for full explanations:

- **Stripe for payments** — Industry standard, webhook support, test mode
- **Clerk for auth** — Social login, JWT tokens, no password management
- **PostgreSQL + Prisma** — Type-safe queries, migrations, ORM benefits
- **GitHub Actions for price updates** — Free CI/CD, no infrastructure needed
- **Obsidian for docs** — Bidirectional links, local-first, knowledge base
- **Skills auto-triggers** — Efficiency (don't ask me to do things I should notice)

---

## ❓ Questions to Resolve

- [ ] Should we add monitoring/logging service (Sentry?) before production?
- [ ] Do we need GraphQL alongside REST API for Sprint 2 frontend?
- [ ] Should price updates also calculate historical volatility metrics?
- [ ] Do we need database backups/disaster recovery plan?

---

## 📝 How to Update This File

When you or I learn something important:
1. Add it to the relevant external guide (Workflow, Decisions, etc.)
2. Link it here
3. Remove outdated info
4. Keep this file as **navigation only** — details live in guides

This file should fit on one screen. If it grows beyond 80 lines, move content to guides.

---

**Philosophy**: This is your working memory reminder, not a documentation dump. For details, follow the links. 🔗
