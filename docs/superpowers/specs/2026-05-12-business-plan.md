# skintrackr.com — Business Plan
**Type:** Internal Rolling Document  
**Last Updated:** 2026-05-12  
**Owner:** Arthur  
**Language:** English  
**Status:** Living document — update phase sections as each gate passes

---

## Part 1 — Evergreen

### 1.1 The Bet

CS2 has a mature, liquid skin economy worth billions of dollars annually — and the tooling for people who take it seriously is embarrassingly bad. Existing tools are either free and cluttered (Pricempire, SteamLedger), free and shallow (SkinFolio, Steamfolio), or content-first and not actionable (SteamAnalyst). Nobody has built a polished, investor-grade portfolio tool for the segment that actually has money: the serious trader with a €1–50k portfolio who wants to know their real P&L, get signal on volatility, and export for tax.

**skintrackr.com** fills that gap. The positioning is "Robinhood for CS2 Investors" — clean, dark, numbers-first UI with tiered features that get genuinely more powerful as the user's portfolio grows. Revenue model is SaaS subscriptions (Lite 4.99€/mo, Pro 19.99€/mo), with affiliate revenue from skin marketplaces added in Phase 2 once there's meaningful traffic.

This is a side-project with lifestyle goals, not a VC pitch. Success = sustainable, profitable, and useful to a real community. Exit optionality exists but is not the primary driver.

---

### 1.2 Market & Competition

**Market size (directional):**
- ~35M active CS2 players globally
- ~5M engage with skin trading/collecting meaningfully
- ~500k have portfolios worth more than a few hundred euros
- Addressable TAM for a paid tool: ~100k users (generous), ~10k realistic at launch stage

**Competitive landscape:**

| Tool | Price | Strengths | Weakness |
|------|-------|-----------|----------|
| Pricempire | Free | Huge data, community | Cluttered, no portfolio UX |
| SteamLedger | Free | Clean portfolio tracking | No alerts, shallow analytics |
| SkinFolio | Free | Simple, mobile-ish | Very limited features |
| SteamAnalyst | Free | Good content/charts | Not a portfolio tool |
| **skintrackr** | **Freemium** | **Premium UX, Smart Alerts, Pro research** | **New, no brand yet** |

**Our gap:** Nobody owns the "serious investor" segment. All competitors optimise for casual free users. We optimise for the top 5% who will pay for real tools.

---

### 1.3 Business Model

**Revenue streams (in order of activation):**

| Stream | Status | Est. Y1 Share |
|--------|--------|---------------|
| Subscriptions (Lite/Pro) | Phase 1 — active | ~70% |
| Affiliate commissions (DMarket 20%, Skinport) | Phase 2 — Month 4+ | ~25% |
| API / B2B data access | Phase 3+ | ~5% |

**Tier structure:**

| Tier | Price | Key Features | Stripe Price ID |
|------|-------|-------------|-----------------|
| Free | 0€ | Portfolio tracking, basic price history, Steam import | — |
| Lite | 4.99€/mo | Price alerts, extended history, CSV export | `price_1TUlNwAfapl1SDUrKYSVYrm9` |
| Pro | 19.99€/mo | Smart alerts, volatility/rarity research, multi-portfolio, tax export | `price_1TTkJIAfapl1SDUrKg1Nb06O` |

**Unit economics (base case):**
- CAC: ~0€ (organic community launch — Reddit, Discord)
- Avg monthly ARPU (paying users): ~7.50€ (Lite-heavy mix)
- Gross margin: ~97% (SaaS, near-zero COGS)
- LTV (12mo retention assumption, 80%): Lite ~48€, Pro ~192€
- Payback period: immediate (no paid acquisition)

---

### 1.4 Founder Context

Solo developer, side-project. Full-time employment assumed alongside this.

**Constraints:**
- ~10–15h/week available for development
- No external funding, no co-founder
- Infrastructure budget: max ~100€/month before profitability

**Risk tolerance:** Medium. Willing to invest 3–6 months building before assessing traction. If MRR stays below 100€ after 60 days post-launch → reassess core assumptions (persona, pricing, channel), don't keep building features.

**Goal:** Reach self-sustaining cash flow (≥ costs) by Month 3. Reach 1,500€ MRR by end of Year 1. Decide at 12 months whether to scale, sell, or maintain as lifestyle product.

---

## Part 2 — Financial Model

### 2.1 Monthly Operating Costs

| Service | Purpose | M1–3 | M4–6 | M7–12 |
|---------|---------|------|------|-------|
| Vercel Pro | Frontend + backend hosting | 20€ | 20€ | 20€ |
| skintrackr.com domain | DNS + renewal | 1€ | 1€ | 1€ |
| Clerk | Auth (free ≤10k MAU) | 0€ | 25€ | 25€ |
| Supabase/PostgreSQL | Database (free tier initially) | 0€ | 0€ | 25€ |
| **Total Fixed** | | **21€** | **46€** | **71€** |

**Variable costs:**
- Stripe processing: 2.9% + 0.30€/transaction (deducted from gross revenue below)
- At 250€ MRR: ~7.25€/mo Stripe fees
- At 1,000€ MRR: ~29€/mo Stripe fees
- At 1,500€ MRR: ~44€/mo Stripe fees

---

### 2.2 Monthly P&L — Base Case (M1–M12)

Assumptions:
- Lite:Pro paying ratio = 85:15
- Average ARPU = (0.85 × 4.99) + (0.15 × 19.99) = 4.24 + 3.00 = **7.24€/paying user**
- Monthly churn: 8% (conservative, SaaS benchmark for indie tools)
- Free users grow from community channels; conversion rate = ~3.5% free→paid

| Mo | Free Users | Paying (Lite/Pro) | Gross MRR | Stripe Fees | Fixed Costs | **Net** |
|----|-----------|-------------------|-----------|-------------|-------------|---------|
| 1 | 400 | 14 (12/2) | 98€ | 3€ | 21€ | **74€** |
| 2 | 800 | 33 (28/5) | 239€ | 7€ | 21€ | **211€** |
| 3 | 1,200 | 52 (44/8) | 377€ | 11€ | 21€ | **345€** |
| 4 | 1,600 | 70 (60/10) | 507€ | 15€ | 46€ | **446€** |
| 5 | 2,100 | 88 (75/13) | 637€ | 18€ | 46€ | **573€** |
| 6 | 2,600 | 108 (92/16) | 787€ | 23€ | 46€ | **718€** |
| 7 | 3,100 | 128 (109/19) | 927€ | 27€ | 71€ | **829€** |
| 8 | 3,600 | 146 (124/22) | 1,057€ | 31€ | 71€ | **955€** |
| 9 | 4,100 | 163 (139/24) | 1,180€ | 34€ | 71€ | **1,075€** |
| 10 | 4,600 | 177 (150/27) | 1,281€ | 37€ | 71€ | **1,173€** |
| 11 | 5,100 | 191 (162/29) | 1,383€ | 40€ | 71€ | **1,272€** |
| 12 | 5,600 | 203 (173/30) | 1,470€ | 43€ | 71€ | **1,356€** |

**Break-even: Month 1** (costs only 21€, revenue covers from first paying users).  
**Year 1 total net revenue (cumulative): ~8,831€**  
**MRR at end of Y1: ~1,470€** *(in line with 1,500€ target)*

---

### 2.3 Scenario Model

| Scenario | Assumption | M6 MRR | M12 MRR | Y1 Cumulative Net |
|----------|-----------|--------|---------|-------------------|
| **Slow** | Launch flops (200 users M1), 2% conversion | ~280€ | ~520€ | ~3,500€ |
| **Base** | Solid Reddit launch, 3.5% conversion | ~787€ | ~1,470€ | ~8,831€ |
| **Fast** | Goes viral, 5% conversion, affiliate added M4 | ~1,800€ | ~3,500€ | ~20,000€ |

**Decision trigger (Slow case):** If MRR < 100€ at 60 days post-launch → pause feature work, interview 10 users, reassess positioning or channel before Month 3.

---

### 2.4 Affiliate Revenue Model (Phase 2, Month 4+)

Activated once traffic > 2,000 MAU. Requires no engineering beyond adding referral links.

| Partner | Commission | Activation |
|---------|-----------|-----------|
| DMarket | 20% of first transaction | Public program, plug-and-play |
| Skinport | BD negotiation needed | Outreach Month 3 |
| CS.MONEY | B2B FAQ exists | Outreach Month 4 |

Projected affiliate contribution: ~5–10% of MRR once active. Upside if traffic grows faster than subscriptions.

---

## Part 3 — Phases

---

### Phase 1 — Foundation & Launch
**Timeline:** Months 1–3 (May–July 2026)  
**Goal:** Production-ready, polished, first 50 paying users, sustainable early revenue.

#### Features
- [ ] Bug fixes: `isPremium` source of truth (DB not Clerk metadata), `researchService` crash for Pro users
- [ ] Security: Clerk audience validation re-enabled, Clerk live keys in Vercel, DEV tokens removed
- [ ] Landing page at `/` — conversion-optimised: pitch, pricing section, single CTA "Start Free"
- [ ] Design system sprint: unify all pages to `slate-950` base + purple/pink accent tokens
- [ ] CORS whitelist enforce, `NODE_TLS_REJECT_UNAUTHORIZED` removed

#### Budget
- Fixed: 21€/month × 3 = 63€ total
- Domain registration: ~15€ one-time
- **Phase 1 total cost: ~78€**

#### KPIs
| Metric | Target |
|--------|--------|
| Free users (30 days post-launch) | 1,000 |
| Paying users (30 days) | 50 |
| MRR (end of Month 2) | ~250€ |
| MRR (end of Month 3) | ~400€ |
| Organic Reddit mentions | 5+ |

#### Decision Gate
> **Go/No-Go at Day 60 post-launch:** If paying users < 20 OR MRR < 100€ → user interviews before any Phase 2 work. Don't build features, build understanding.

---

### Phase 2 — Smart Alerts + Affiliate
**Timeline:** Months 4–6 (August–October 2026)  
**Goal:** Ship the killer differentiator, activate 2nd revenue stream, 200 paying users.

#### Features
- [ ] Volatility alerts — "Skin X moved >5% in 24h"
- [ ] Float-tier alerts — "Rare Float (FN < 0.01) just listed"
- [ ] Case EV inversion detection — "Case cheaper than drop EV"
- [ ] Email alerts — all tiers (Free→Paid conversion hook)
- [ ] Discord bot — Pro tier, user adds to their server
- [ ] Affiliate link integration (DMarket, Skinport) — passive revenue activation
- [ ] Telegram bot — stretch goal

#### Budget
- Fixed: 46€/month × 3 = 138€ total
- No one-time costs anticipated

#### KPIs
| Metric | Target |
|--------|--------|
| Paying users | 200 |
| MRR | ~1,000€ |
| Affiliate MRR | ~50–100€ |
| Discord bot installs | 50+ |

#### Decision Gate
> **At end of Month 6:** Is MRR growth accelerating or plateauing? If plateau without hitting 1,000€ → pricing experiment (Lite at 3.99€?) before Phase 3 Pro investment.

---

### Phase 3 — Pro Lock-in
**Timeline:** Months 7–12 (November 2026–April 2027)  
**Goal:** Make Pro tier so compelling that 19.99€/month is a no-brainer. ~200 Pro users.

#### Features
- [ ] Realized P&L tracking — user logs sales, system calculates profit/loss
- [ ] Tax export — FIFO/LIFO cost basis, CSV, German capital gains format
- [ ] Multi-portfolio — separate portfolios (own vs. managing for friends)
- [ ] Investor metrics on dashboard: Sharpe ratio, drawdown, allocation pie, beta vs. market index
- [ ] AI market thesis (basic) — "Why is Skin X moving?" correlated with CS2 operations and Majors
- [ ] PWA setup — mobile home screen widget

#### Budget
- Fixed: 71€/month × 6 = 426€ total

#### KPIs
| Metric | Target |
|--------|--------|
| Pro paying users | 100+ |
| MRR | ~1,500€ |
| Y1 cumulative net | ~8,000€+ |
| Pro churn rate | <5%/month |

#### Decision Gate
> **At end of Month 12 (Year 1 Review):** Choose one of three paths — see Phase 4+.

---

### Phase 4+ — Year 2 Options
**Timeline:** Month 13+ (May 2027+)  
**Triggered by:** Year 1 review — evaluate which path to take based on traction.

| Path | Trigger | Actions |
|------|---------|---------|
| **A — Lifestyle** | MRR 1,000–3,000€, stable, low churn | Keep feature-minimal, optimise for retention, enjoy the income |
| **B — Scale Up** | MRR > 3,000€ or clear demand for expansion | Hire part-time help, expand to Rust/Dota 2, consider mobile apps, build B2B API |
| **C — Sell** | Acquisition interest from marketplace (Skinport, DMarket, etc.) | Negotiate. Floor: 24× MRR (~36k€ at 1,500€ MRR). Don't sell below that. |
| **D — Pivot/Wind Down** | MRR < 300€ at Month 12 and no clear path | Document learnings, archive codebase, move on. Not a failure — a data point. |

**Not in scope for any phase:**
- Native mobile apps (PWA covers this)
- Gambling / case opening site integration
- VC funding / external investors
- Multi-game before CS2 is profitable
- Social features before core is stable

---

## Appendix

### A — Key Assumptions to Revisit

| Assumption | Used Where | Re-evaluate When |
|-----------|------------|-----------------|
| 3.5% free→paid conversion | P&L model | After M2 launch data |
| 8% monthly churn | P&L model | After M3 retention data |
| Lite:Pro ratio = 85:15 | ARPU calc | After M2 payment data |
| CAC = 0€ | Unit economics | If organic acquisition stalls |
| Clerk free until 10k MAU | Cost model | When MAU hits 8k |

### B — Open Questions

- [ ] Should Sentry (error monitoring) be added before launch? ~$26/mo, adds crash visibility.
- [ ] Is 19.99€ the right Pro price, or should it launch at 14.99€ with planned increase?
- [ ] Will DMarket's 20% affiliate program still be active by Month 4?
- [ ] Does tax export require legal review for German tax law compliance?

### C — Links

- Product Strategy Spec: `docs/superpowers/specs/2026-05-10-product-strategy.md`
- Month 1 Launch Plan: `docs/superpowers/plans/2026-05-10-month1-launch.md`
- Month 2 Smart Alerts Plan: `docs/superpowers/plans/2026-05-10-month2-smart-alerts.md`
- Sprint 2 Testing Plan: `docs/superpowers/plans/2026-05-08-sprint2-testing.md`
