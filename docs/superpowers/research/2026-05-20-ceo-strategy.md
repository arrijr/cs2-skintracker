# CS2 Skin Tracker — CEO Strategy (2026-05-20)

**Status:** decision-locked, in execution
**Owner:** Arthur (CEO), Claude (orchestrator)
**Source reports:**
- `2026-05-20-market-analysis.md` (competitive landscape)
- `2026-05-20-product-roadmap.md` (codebase audit + 90-day plan)

---

## TL;DR

- 4 sprints, ~25 dev-days to first revenue + initial traction
- Aggressive pricing (€9.99 Pro), no Lifetime SKU, no Discord/Telegram
- Sprint 0 fixes everything blocking the first paid charge
- Sprint 1 ships Steam inventory auto-import (table stakes — every competitor has it)
- Sprint 2 ships multi-source pricing (Skinport + CSFloat) + affiliate links + programmatic SEO
- Sprint 3 ships Chrome extension as acquisition Trojan horse

## Pricing (decision-locked)

| Tier | Monthly | Annual (-20%) | Limits |
|---|---|---|---|
| Free | €0 | — | 2 active alerts, manual portfolio, no research |
| Lite | **€6.99** | **€67/yr** | 15 alerts, 120-day history, research basic |
| Pro | **€9.99** | **€96/yr** | unlimited alerts, full history, multi-source pricing (Sprint 2), CSV export, research full |

**Rationale for €9.99 Pro:** aggressive vs market median ($7-12 / €11.99). Maximizes conversion volume, accepts lower ARPU. Cannot raise easily later — committed strategy is volume-first.

**Channels:** email + in_app only. No Discord/Telegram. Tradeoff: foregoes a proven conversion hook (CS2Locker uses it) for simpler stack + no third-party platform risk.

## Sprint Plan

### Sprint 0 — Cash-Ready (5 dev-days)
**Goal:** First Euro can flow through the system.

| Task | Owner | Days | Type |
|---|---|---|---|
| Privacy + ToS + Refund pages | Agent | 0.5 | Autonomous (template) |
| Sentry SDK install (frontend + backend) | Agent | 0.5 | Autonomous (DSN from CEO) |
| PostHog SDK install + event taxonomy | Agent | 1 | Autonomous (key from CEO) |
| Reprice pricing page + annual toggle | Agent | 0.5 | Autonomous (UI + frontend Stripe call) |
| Free tier 2 alerts (quota config) | Agent | 0.25 | Autonomous |
| Cookie consent banner (GDPR) | Agent | 0.5 | Autonomous |
| Audit `.env.example` (no prod leaks) | Agent | 0.25 | Autonomous |
| Re-enable Clerk audience validation | CEO | 0.5 | Needs prod verification |
| Stripe live keys + create live products | CEO | 0.5 | Stripe Dashboard work |
| Clerk live keys swap | CEO | 0.25 | Vercel env vars |
| Custom domain DNS + Vercel | CEO | 0.5 | DNS work |
| Remove DEV_TEST_TOKEN / DEV_FREE_TOKEN | Agent | 0.25 | Autonomous |

**Definition of done:** real Euro charged on a test purchase from outside dev machine.

### Sprint 1 — Steam Import (5 dev-days)
**Plan:** `C:\Users\Arthur\.claude\plans\scalable-spinning-parnas.md` (already written)

- Steam OpenID 2.0 account link (stateless, JWT state HMAC — no passport/sessions)
- Inventory fetch + match against 15k catalog
- Portfolio import with 3 cost-basis modes (empty / current market / bulk edit + auto-fill from PriceHistory)
- Resync endpoint (additive — never touches manual rows)

**Definition of done:** Arthur's own Steam inventory imports successfully; UI shows preview + import + resync; PostHog event `steam_import_completed` fires.

### Sprint 2 — Multi-Source Pricing + SEO (8 dev-days)
- Skinport API integration (live ask/bid)
- CSFloat API integration (live float prices)
- (NOT Buff163 — geo + scraping risk; revisit later)
- Affiliate deep-links (Skinport, CS.Money) on every price-comparison row — passive revenue
- Programmatic SEO: `/skins/[slug]` pages indexable, `<title>` + meta description + JSON-LD `Product` markup
- `sitemap.xml` listing all 15k catalog items
- `robots.txt` allowlist

**Definition of done:** 100+ Skin-detail pages indexed by Google; first affiliate click tracked.

### Sprint 3 — Chrome Extension (7-8 dev-days)
- Manifest V3 extension
- Steam Market overlay: when user views a listing on `steamcommunity.com/market`, inject our price + 7-day chart + "add to portfolio" button
- One-click alert creation from Steam page
- Auth via Clerk-issued device token (no password in extension)
- Distribution: Chrome Web Store + Edge Add-ons

**Definition of done:** 50 active installs; tracked install-to-signup conversion.

## Pre-Revenue Blockers (must clear in Sprint 0)

1. **Legal:** Privacy Policy + Terms of Service + Refund Policy. Required by Stripe + GDPR.
2. **Stripe live:** real Price IDs (currently `prod_...` placeholders), live API key, webhook verification.
3. **Clerk live:** swap test keys, re-enable JWT audience validation (`verifyClerkJwt.js` ~line 92 commented out).
4. **Custom domain:** `backend-three-theta-44.vercel.app` is a trust-killer for paid users.
5. **DEV tokens:** `DEV_TEST_TOKEN` / `DEV_FREE_TOKEN` must NOT be in Vercel prod env.
6. **Error monitoring:** Sentry on both frontend + backend.
7. **Analytics:** PostHog instrumented BEFORE shipping anything else so we can measure.

## Deferred (deliberately not shipping yet)

- Buff163 integration (geo + scraping risk)
- Native mobile app (whitespace per market, but capital-intensive — re-evaluate after 1000 users)
- Lifetime SKU (rejected this round; market opportunity noted)
- Discord / Telegram push (rejected this round)
- Sticker tracking (whale segment; revisit after Sprint 3)
- Trade-up calculator / case opening sim (audience-narrow, low ARPU lift)
- API tier for power users (no buyers proven yet)
- AppSumo / lifetime-deal launch

## KPIs to wire in Sprint 0

PostHog events to fire:
- `signup_completed` (anonymous → identified)
- `onboarding_step_completed` (step 1, 2, 3)
- `onboarding_completed`
- `steam_connect_started` / `steam_connect_completed`
- `portfolio_first_item_added` (manual or imported)
- `alert_created`
- `alert_triggered`
- `pricing_page_viewed`
- `checkout_started` (tier, billing_cycle)
- `subscription_created` (tier, amount)
- `subscription_canceled`
- `subscription_reactivated`
- `csv_export_used`
- `affiliate_click` (skin, source) — Sprint 2
- `extension_installed` — Sprint 3

North star: **Paid MRR**. Leading indicators: signup → onboarding completion %, onboarding → first alert %, alert created → paid conversion %.

## What I (CEO) need to provide

To unblock Sprint 0 autonomous work:
1. **PostHog account** — sign up at posthog.com, give me `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`
2. **Sentry account** — sign up, give me DSN for frontend + backend
3. **Domain** — pick + register (`skintrackr.com`? `cs2tracker.app`? user choice)
4. **Stripe Dashboard** — create live Products + Prices for Lite/Pro monthly + annual; share IDs
5. **Clerk Dashboard** — generate live keys, set production audience

I'll work autonomously on everything else.
