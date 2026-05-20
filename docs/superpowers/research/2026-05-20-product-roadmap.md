# CS2 Skin Tracker — Product Roadmap to First Revenue

**Date:** 2026-05-20
**Author:** Head of Product (Claude, as PM partner)
**Status:** Recommended plan, not yet committed

---

## 1. State Audit

**What works (verified by reading code):**
- 14 backend controllers, 25 route files. Real coverage: skins (15,071 items), cases, market items (stickers/agents/keys), portfolio, watchlist, alerts (4 types: price_threshold / volatility / float_tier / case_ev), research (volatility + rarity), Stripe checkout + webhook + cancel + reactivate + CSV export, Clerk JWT auth, Steam OpenID schema fields (`steamId`, `steamConnectedAt`) and `steamController.js` already exist — partial wiring.
- Frontend pages: landing, pricing, dashboard, portfolio, items, skins, cases, alerts, profile (full Clerk `<UserProfile />`), account, onboarding (scaffolded, never finished), blog, admin.
- Stripe wiring complete in code; depends on env `STRIPE_PRICE_LITE_ID` / `STRIPE_PRICE_PRO_ID`. Webhook handler ready.
- Email + in_app alert channels working. Discord deprecated 2026-05-20.
- CSV export Pro-gated with formula-injection guard.
- Pricing: Free €0 / Lite €4.99 / Pro €19.99 monthly only.

**What's broken or missing for paying customers:**
- **No Steam Import.** Empty-portfolio problem at signup. Steam controller exists but inventory preview/import/resync are unimplemented (schema is ready).
- **No privacy policy / ToS / refund / GDPR pages.** Stripe Checkout requires them; EU jurisdiction makes this hard-mandatory.
- **No production monitoring** (Sentry / equivalent).
- **`DEV_TEST_TOKEN` + `DEV_FREE_TOKEN`** still in env. `NODE_TLS_REJECT_UNAUTHORIZED=0` flagged as catastrophic if leaked.
- **Clerk audience validation disabled** in `verifyClerkJwt.js` (~line 92).
- **Stripe + Clerk on test keys.** Stripe Price IDs not the real `price_...` ones from a live product.
- **No custom domain** — running on `backend-three-theta-44.vercel.app`. Trust-killer for paid checkout.
- **No analytics** (PostHog/GA/etc.). Cannot observe funnel.
- **31 Playwright tests skipped.** No real E2E.

**Activation funnel (inferred):**
Signup (Clerk) → land on `/dashboard` (empty) → `/onboarding` page exists but unfinished → user must search skins manually → add to portfolio one-by-one → "aha" moment never arrives → leaves before alerts/research are useful → never sees paywall.

**Estimated churn points:**
1. **Signup → first portfolio item: ~70% drop.** Manual entry is the killer.
2. **Portfolio populated → first alert configured: ~50% drop.** No prompt to set one.
3. **Alert fires → upgrade to Lite: ~95% drop.** No alert quota friction surfaced yet at the right moment.

---

## 2. Pre-Revenue Blockers (ranked: criticality × inverse effort)

| # | Blocker | Criticality | Effort | Action |
|---|---|---|---|---|
| 1 | Privacy Policy + ToS + Refund Policy pages | BLOCKER (Stripe + EU/GDPR) | 0.5 day | Use generator (Termly/iubenda) → embed |
| 2 | Stripe live keys + real `price_...` IDs in Vercel | BLOCKER | 2 hrs | Create products in Stripe dashboard, copy IDs |
| 3 | Clerk live keys (pk_live / sk_live) | BLOCKER | 1 hr | Swap in Vercel env |
| 4 | Re-enable Clerk audience validation | BLOCKER (security) | 1 hr | Uncomment line ~92 `verifyClerkJwt.js`, set `cs2-skintracker-api` audience prod-side |
| 5 | Remove `DEV_TEST_TOKEN` / `DEV_FREE_TOKEN` from prod env groups | BLOCKER | 30 min | Audit Render + Vercel; delete |
| 6 | Custom domain + SSL (e.g. `skintrackr.com`) | HIGH (trust) | 0.5 day | Buy domain, attach Vercel, update `ALLOWED_ORIGINS` |
| 7 | Sentry on backend + frontend | HIGH | 0.5 day | `@sentry/node` + `@sentry/nextjs` |
| 8 | Cookie consent banner (GDPR) | HIGH (EU) | 0.5 day | Use Cookiebot or simple homegrown |
| 9 | DB backups verified (Supabase PITR enabled) | HIGH | 30 min | Check Supabase dashboard, document RPO/RTO |
| 10 | Stripe Tax / VAT collection (EU) | HIGH | 2 hrs | Enable Stripe Tax in dashboard, add to checkout session |
| 11 | `NODE_TLS_REJECT_UNAUTHORIZED=0` verified NOT in prod | BLOCKER | 15 min | Audit |
| 12 | Email-from domain SPF/DKIM (alert delivery) | MEDIUM | 1 hr | If using Resend/Postmark, verify domain |

**Total pre-revenue effort: ~3 dev-days.** This is the cheapest, highest-leverage work in the entire roadmap.

---

## 3. Revenue Roadmap — Next 90 Days

### Sprint 1 (Weeks 1–2): "Cash-Ready" — ship pre-revenue blockers + Steam Import

**Theme:** Remove every excuse not to take money. Solve empty-portfolio onboarding.

**Ships:**
1. **All Pre-Revenue Blockers** (table §2, items 1–12). 3 dev-days.
2. **Steam Inventory Import** (spec ready, 4.5 days). Wires preview → bulk-edit → import end-to-end. Hook into `/onboarding` so it's step 1 after signup.
3. **Finish `/onboarding` flow.** 3 screens: Connect Steam → Import preview → "Set your first alert." 1 day.

**Revenue impact:** Acquisition + activation. Steam import compresses time-to-value from hours to 30 seconds. Expect activation rate (signup → ≥10 portfolio items) to jump from ~10–15% to 50%+.

**Effort:** ~9 dev-days (with parallel agents: 5 calendar days).

**Success metric:**
- Signup → Steam connect rate ≥ 60%
- Steam connect → import committed ≥ 80%
- Stripe Checkout success rate (test live with own card): 100%

**Dependencies:** Pre-revenue blockers must land BEFORE Steam import push goes live (otherwise no checkout possible). Steam spec is already ready (`docs/superpowers/specs/2026-05-11-steam-inventory-import.md`), execution plan at `~/.claude/plans/scalable-spinning-parnas.md`.

---

### Sprint 2 (Weeks 3–5): "Conversion Engine" — paywall + alerts + first SEO

**Theme:** Make Lite the obvious upgrade. Drive traffic.

**Ships:**
1. **Alert-Quota Paywall UX.** Free user creates 2nd alert → modal "Lite gives you 5 alerts + email" → Stripe Checkout. Currently this friction isn't sharp enough. 1 day.
2. **Smart upgrade nudges in dashboard.** Portfolio worth >€500 → "Pro users get volatility/rarity research on your skins" CTA card. 1 day.
3. **Annual pricing (-20%).** Lite €47.88/y (€3.99/mo equiv), Pro €191.88/y (€15.99/mo equiv). 1 day. Adds annual `price_...` IDs, toggle in pricing page.
4. **SEO landing pages from the 15k catalog.** Programmatic SSG: `/skins/[slug]` already exists — ensure it's indexable with schema.org Product markup + sitemap.xml entries. Target long-tail like "AK-47 Redline Field-Tested price." 2 days.
5. **Email alert template + transactional sender on production domain.** 1 day.

**Revenue impact:** Conversion + acquisition (SEO). Annual pricing typically lifts ARPU 30–40% on the cohort that picks it. Programmatic SEO is slow but cheap.

**Effort:** ~6 dev-days.

**Success metric:**
- Free → Lite conversion ≥ 3% within 14 days of signup
- Annual chosen by ≥ 15% of paying users
- ≥ 50 indexed `/skins/[slug]` pages in Google Search Console by end of sprint
- First 5 paid subscribers (mix of Lite/Pro)

---

### Sprint 3 (Weeks 6–9): "Retention + Differentiation" — multi-source pricing + price-watch browser extension

**Theme:** Become sticky. Become differentiated.

**Ships:**
1. **Multi-source pricing — Phase 1: Skinport + CSFloat.** Add `MarketSnapshot.source` values; show "best buy / best sell" per skin; arbitrage gap as a Pro-tier insight. NOT Buff163 yet (region/legal complexity — phase 2). 4 days.
2. **Browser extension (Chrome).** Reads skin pages on Steam Market / Skinport, overlays your portfolio cost basis + alert status. 3 days. Massive recurring-engagement driver — the user opens it daily without thinking.
3. **Affiliate links** to Skinport / CSFloat on every skin detail page (revenue share + lifts perceived utility). 1 day.

**Revenue impact:** Retention (extension = daily active), Expansion (multi-source is a Pro-only insight, drives Lite → Pro), Monetization beyond subs (affiliate). Extension is also the single best acquisition channel for this audience — friends see overlays on each other's screens.

**Effort:** ~8 dev-days.

**Success metric:**
- Extension: 100 installs in first 14 days
- Lite → Pro upgrade rate ≥ 8% (driven by multi-source feature gate)
- First €100 in affiliate commission revenue
- Day-30 retention for Lite+ ≥ 60%

**Dependencies:** Skinport/CSFloat public price APIs (free tier exists for both); Chrome Web Store review (1-week lead time — submit early in sprint).

---

### Deferred (Q3+, deliberately NOT in 90-day plan)

- **Buff163 integration** — region risk, no clean API, needs Chinese market research first.
- **Discord bot** — was deprecated; reconsider only if browser extension underperforms.
- **Mobile native app** — PWA fallback if needed; native is too expensive for the conversion lift.
- **Trade-up calculator / case-opening simulator** — vanity feature, doesn't pay.
- **API access tier ($$/mo for power users)** — schema is there (`APIKey`/`APILog`), but TAM too small at this stage. Re-evaluate at 500 paying users.
- **Lifetime deal / AppSumo** — kills LTV math, and tooling isn't polished enough to handle that volume of feedback yet. Reconsider at 1,000 free users.

---

## 4. Pricing Recommendation

**Current:** Free €0 (5 watchlist, 1 alert) / Lite €4.99 (unlimited watchlist, 5 alerts, 90d history) / Pro €19.99 (unlimited alerts, research, 180d history, CSV, future API).

**Audience reality check:** 16–25yo CS traders with €50–€5,000 portfolios. They will pay €5/mo without blinking. They will NOT pay €19.99/mo for "research" unless the research demonstrably makes them money.

**Recommendations:**

1. **Bump Lite to €6.99/mo** but include **15 alerts** and **120-day history.** Lite is the volume tier — wider net + better value perception. The €1.99 lift on a tier that costs you near-zero per user is pure margin.
2. **Drop Pro to €14.99/mo.** €19.99 is a psychological cliff for this audience. €14.99 keeps it premium but accessible.
3. **Add annual: -20%** (Lite €67.10/y ≈ €5.59/mo, Pro €143.90/y ≈ €11.99/mo). This is the single highest-ROI pricing change.
4. **Add a "Trader" tier at €39/mo** when you have multi-source + extension: 1) priority data refresh, 2) arbitrage signal alerts, 3) API key with 10k req/day. Targets the 5% of users with €5k+ portfolios. Don't ship until Sprint 3 lands.
5. **Free tier: tighten.** 5 watchlist → keep. 1 alert → 2 alerts (gives them one "aha" moment before paywall hits).

**Don't do:**
- Don't add a 7-day Lite trial. CS audience will abuse it. Use a 30-day money-back guarantee instead (cheap to honor, builds trust).

---

## 5. KPIs to Instrument BEFORE Shipping Anything Else

Pick a tool first. **Recommendation: PostHog (self-hostable, EU region, generous free tier, product-analytics-focused).** Connect on the frontend with `posthog-js` and on backend with `posthog-node` for server-side events.

**The seven metrics:**

| # | Metric | Why | Instrumentation |
|---|---|---|---|
| 1 | Signup → activation (≥10 portfolio items within 24h) | Predicts every downstream conversion | PostHog event `portfolio_item_added` + cohort funnel |
| 2 | Activation → first-alert-set | "Aha moment" | Event `alert_created` |
| 3 | Free → paid conversion (D14, D30) | The number that determines if the business works | Stripe webhook → PostHog event |
| 4 | MRR (monthly recurring revenue) | North star | Stripe → daily snapshot in a `MRRSnapshot` table |
| 5 | Alert delivery success rate (email + in_app) | Product credibility | Backend log → `AlertEvent.delivered` / `.failed` aggregation, already in schema |
| 6 | Day-7 / Day-30 retention | Are we sticky? | PostHog retention cohort, no extra code |
| 7 | Steam Import success rate (preview → committed import) | Validates the new funnel | Event `steam_import_completed` with `matched_count`, `total_count` |

**Implementation cost:** ~1 day to wire PostHog + the 7 events. Do this **BEFORE Sprint 1 ships** so you have baseline numbers.

---

## TL;DR

Current state: technically capable product, zero monetization-readiness. Eight blockers between you and a first euro, all of them small. Empty portfolios kill activation; Steam Import is the single biggest unlock and the spec is ready.

**Order of operations (next 14 days):**
1. Wire PostHog (1 day).
2. Pre-revenue blockers (3 days).
3. Steam Import end-to-end + finish onboarding (5.5 days).
4. Charge first euro.

Everything else (pricing tweaks, SEO, extension, multi-source) is Sprint 2+ — but the above is the minimum viable path to revenue. Ship that, then iterate on data, not opinions.
