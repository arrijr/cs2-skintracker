# CS2 Skin Tracker - Programmatic SEO Strategy

**Date:** 2026-05-20
**Sprint:** Sprint 2 (8 dev-days)
**Owner:** Arthur + agent
**Linked:** 2026-05-20-ceo-strategy.md, 2026-05-20-market-analysis.md

---

## TL;DR

15,071 skins + 50 cases + sticker/agent catalog = ~15.5k programmatic pages. Competitors (csgostash, steamanalyst, csmarketcap) already rank for `{skin} price` long-tails. Wedge is freshness + first-party signals (volatility, rarity, 30/60/90d chart, alert CTA on every page).

Slug: `/skins/{weapon}/{name}` with wear-variants as `?wear=field-tested` query param sharing one canonical. JSON-LD `Product` + `Offer` + `BreadcrumbList` + `FAQPage` on every page. Sitemap split into 16 chunks (1000 URLs each, re-crawls faster than monolith).

Biggest leverage: daily-updated price-history chart. Steamanalyst pages stale, csgostash no charts. Google freshness signal + 30/60/90d chart = wedge.

---

## 1. URL + Content Architecture

### 1.1 Slug strategy - PICK /skins/{weapon}/{name} with wear-canonical

**Options compared:**

| Pattern | Pro | Con | Verdict |
|---|---|---|---|
| /items/{id} | Cheap, stable | Zero SEO value, IDs change on reseeds | NO |
| /skin/ak-47-redline-field-tested | Flat, readable | Ambiguous routing, conflicts with /skins list | NO |
| /skins/{slug} flat | Simple | No weapon hierarchy = harder breadcrumb + cluster | OK fallback |
| **/skins/{weapon}/{name} + ?wear=** | Hierarchical, breadcrumb-friendly, single canonical | Needs wear-param routing | YES |
| /skins/{weapon}/{name}/{wear} separate paths | Max long-tail coverage | 5x duplicate content per skin, link equity diluted | NO |

**Decision:** /skins/{weapon}/{name} is the canonical URL. Wear is query param ?wear=field-tested. Each canonical page renders all 5 wear variants in a table; selected wear is deep-linkable + indexable via canonical.

**Why wear-as-query, not path:**
- AK-47 | Redline exists in 5 wears with near-identical pricing patterns. Separate pages = thin/duplicate content penalty.
- Google canonical tag consolidates link equity to one URL.
- Field-Tested (most-traded wear) gets default render and ranks for both "AK-47 Redline price" and "AK-47 Redline Field-Tested price".

**Slug generation pseudocode:**

```js
weaponSlug = lowercase(weaponType).replace(/[^a-z0-9]+/g, "-")
// "AK-47" -> "ak-47", "Karambit" -> "karambit"
skinSlug = lowercase(name)
  .replace(/^(StatTraks*)?/, "")
  .replace(/s*([^)]+)$/, "")
  .replace(/s*|s*/, "-")
  .replace(/[^a-z0-9]+/g, "-")
// "AK-47 | Redline (Field-Tested)" -> "ak-47-redline"
```

**Required schema change** (Sprint 2, Phase 0, 1 hour):

```prisma
model Skin {
  // ...
  slug         String?  @unique  // null until backfilled
  weaponSlug   String?
  @@index([weaponSlug])
  @@index([slug])
}
```

Backfill script backend/scripts/backfill-skin-slugs.js. Idempotent, runs once, generates from existing name + weaponType. Collision handler appends -2, -3 if any clash (rare since name is unique per ADR-001).
### 1.2 Page template - /skins/{weapon}/{skin}

```
[Breadcrumb: Home > Skins > {WeaponType} > {SkinName}]

<h1>{SkinName} Price & Float History (CS2)</h1>

[Hero block]
  - Skin image (Steam CDN, lazy-loaded, AVIF + WebP fallback)
  - Current price (largest market: Steam | Skinport | CSFloat best ask)
  - 24h delta (%) with arrow
  - StatTrak / Souvenir badges
  - Wear selector tabs (FN | MW | FT | WW | BS) flips ?wear= param

[Price comparison table] - Sprint 2 multi-source, affiliate rows
  | Market    | Lowest Ask | 24h Volume | Affiliate CTA |
  | Steam     | $X         | Y sold     | Open on Steam |
  | Skinport  | $X         | Y sold     | Buy on Skinport (aff) |
  | CSFloat   | $X         | Y sold     | Buy on CSFloat (aff) |

[Price-history chart] - Chart.js, 30/60/90d toggle, daily-refreshed
  - Hover shows date + price + sold count
  - "Sign up for 1y+ history" CTA strip for Free users

[Research block - partial-public, full-paywalled]
  - Volatility score (1-10) free preview, locked detail
  - Rarity score (1-10) free preview
  - "Unlock full research with Pro 9.99 EUR/mo" anchor #pricing

[Wear comparison table] - same skin, all 5 wears

[Related skins - same weapon + same rarity, 6 thumbnails]
  - internal-link cluster, KEY for surfacing 15k pages

[FAQ block - JSON-LD FAQPage]
  - "What is the current price of {SkinName} in CS2?"
  - "Is {SkinName} a good investment?"
  - "How is {SkinName} float value calculated?"
  - "Where can I buy {SkinName} safely?"
  - 4 questions, answers programmatic from live skin data

[CTA strip]
  - "Track {SkinName} for free, set a price alert" /alerts/new?skinId={id}
  - "Add to portfolio"                              /portfolio?add={id}
```

**Uniqueness budget per page** (to dodge duplicate-content penalty):
- H1 (unique by name+wear)
- Current price + 24h delta (unique daily)
- Volatility + rarity score (unique per skin)
- FAQ answers (programmatic, pull live numbers)
- Related skins (different per skin)
- Chart (per-skin price history)

Total unique tokens per page: ~400-600. NOT duplicate. Boilerplate (nav, footer, schema-org template) is shared but indexer-friendly.

### 1.3 Wear variants - canonical vs separate

**Decision: single canonical, ?wear= query, all wears indexable as variants.**

Why: 15k skins x 5 wears x 2 StatTrak = 150k potential URLs. Most have ~$0.01 trade volume, thin content. Canonical consolidation:
- Avoids duplicate-content penalty
- Concentrates link equity
- Still ranks for "{skin} field-tested" because wear table covers it

Exception: knives + gloves (high-value, big spread between wears) get separate page per wear via /skins/karambit/crimson-web/field-tested. Detection rule: if weaponType in ["Knife", "Gloves"] AND priceMax - priceMin > $50 then separate pages. Estimated count: ~600 knife/glove pages. Manageable.

### 1.4 Internal linking - surfacing 15k pages without orphans

**Three-layer link graph:**

1. **Pillar pages** (~30 total): /skins/ak-47, /skins/awp, /skins/knives, /skins/gloves, /cases, /stickers. Lists top-50 by 7d volume + A-Z. Static-rendered, daily rebuild.

2. **Cluster pages** (~150): per-collection (/collections/dust-2), per-rarity (/rarity/covert), per-case-skin (/cases/the-dreams-and-nightmares-case). Links to every skin in cluster.

3. **Spoke pages** (15k+): individual skin pages, each linking to:
   - Parent pillar (/skins/{weapon})
   - Parent collection / case
   - 6 related skins (same weapon + same rarity, sorted by volume)

**Sitemap:**
- /sitemap.xml (index file)
- /sitemap-skins-{0..15}.xml (1000 skins each)
- /sitemap-cases.xml (50)
- /sitemap-stickers.xml (~5000)
- /sitemap-pages.xml (static: pillars, FAQs, blog)

Crawl budget: Google will not index 15k pages in week 1. Strategy: submit pillars + cluster pages first, let Google discover spokes via internal links. Boost top-1000 highest-volume skins via XML <priority>0.9</priority>.
---

## 2. Title + Meta Description Templates

### 2.1 Skin detail page

**Title** (target: 50-60 chars):

```
{SkinName} ({Wear}) Price & Float History | SkinTrackr
```

Examples:
- `AK-47 | Redline (Field-Tested) Price & Float History | SkinTrackr` 60 chars
- `Karambit | Doppler (Factory New) Price & Chart | SkinTrackr` 57 chars

Fallback if too long (knife/glove with long names):

```
{SkinName} Price & Chart | SkinTrackr
```

**Meta description** (target: 140-155 chars):

```
Live {SkinName} price, 30/60/90-day chart, Skinport & CSFloat comparison. Set free price alerts on SkinTrackr, CS2 most accurate tracker.
```

Variable swaps:
- If priceLatest < $1: "Live {SkinName} price under $1 in CS2..."
- If volatility > 7: "{SkinName} is a high-volatility CS2 skin..."
- Default fallback: standard template above

Per-page uniqueness comes from live values. Google sees text as boilerplate but it is compact enough not to penalize.

### 2.2 Case detail page (/cases/{slug})

**Title:** `{CaseName} Price, Drops & EV | SkinTrackr`

Example: `The Dreams & Nightmares Case Price, Drops & EV | SkinTrackr` 60 chars

**Meta:** `{CaseName} CS2 price, expected value (EV), drop chances, and all {N} skins inside. Live price chart updated daily on SkinTrackr.`

### 2.3 Category landing pages

**/skins/{weapon}** (e.g. /skins/ak-47):
- Title: `Best AK-47 Skins (CS2 Prices & Charts) | SkinTrackr` 51 chars
- Meta: `Browse all 247 AK-47 skins in CS2. Live prices, float ranges, volatility scores. Compare Steam, Skinport & CSFloat daily-updated.`

**/skins/knives**:
- Title: `CS2 Knife Skins All Prices & Float Charts | SkinTrackr`
- Meta: `Every CS2 knife skin with live Steam prices, Skinport asks, and 90-day price charts. Karambit, Butterfly, Bayonet & more. Track free.`

**/cases**:
- Title: `All CS2 Cases Prices, EV & Drop Tables | SkinTrackr`
- Meta: `Live prices and expected value (EV) for every CS2 case. Drop-table breakdown, 90-day price history, sticker EV included.`

### 2.4 Title generation safety

- Truncate to 60 chars at word boundary (avoid mid-word ellipsis)
- Always end with `| SkinTrackr` (brand). If total >60, drop `| SkinTrackr` first, then optional descriptors
- Server-side render `<title>` + `<meta>`. Do not rely on client-side React swapping (Googlebot may render but slowly)
---

## 3. Structured Data (Schema.org JSON-LD)

### 3.1 Skin detail page - Product + Offer

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "AK-47 | Redline (Field-Tested)",
  "image": "https://community.cloudflare.steamstatic.com/economy/image/{hash}",
  "description": "AK-47 | Redline is a Classified-rarity rifle skin from The Winter Offensive Collection...",
  "category": "CS2 Skin > Rifle > AK-47",
  "sku": "skin-14523",
  "brand": { "@type": "Brand", "name": "Counter-Strike 2" },
  "offers": [
    {
      "@type": "Offer",
      "price": "32.45",
      "priceCurrency": "USD",
      "url": "https://steamcommunity.com/market/listings/730/AK-47%20%7C%20Redline%20%28Field-Tested%29",
      "seller": { "@type": "Organization", "name": "Steam Community Market" },
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2026-05-21"
    },
    {
      "@type": "Offer",
      "price": "30.89",
      "priceCurrency": "USD",
      "url": "https://skinport.com/item/ak-47-redline-field-tested?ref=skintrackr",
      "seller": { "@type": "Organization", "name": "Skinport" },
      "availability": "https://schema.org/InStock"
    }
  ]
}
```

Notes:
- `aggregateRating` only emit if we have 5+ user ratings (Sprint 3+ feature). Skip until then. Do NOT fabricate, Google penalizes fake ratings.
- `priceValidUntil` = next refresh date (tomorrow for daily-refreshed prices)
- Multiple `Offer` entries valid. Google may show "from $X" in SERP
- `seller.name` is verbatim and matters for SERP enrichment

### 3.2 BreadcrumbList (all detail pages)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://skintrackr.com/" },
    { "@type": "ListItem", "position": 2, "name": "Skins", "item": "https://skintrackr.com/skins" },
    { "@type": "ListItem", "position": 3, "name": "AK-47", "item": "https://skintrackr.com/skins/ak-47" },
    { "@type": "ListItem", "position": 4, "name": "Redline" }
  ]
}
```

Last item omits `item` field (current page). Renders as breadcrumb in Google SERP, proven 30%+ CTR lift over plain URLs.

### 3.3 FAQPage (skin + case pages)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the current price of AK-47 | Redline in CS2?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AK-47 | Redline (Field-Tested) currently sells for $32.45 on Steam Market and $30.89 on Skinport (last updated May 20, 2026). Prices fluctuate daily based on supply and demand."
      }
    },
    {
      "@type": "Question",
      "name": "Is AK-47 | Redline a good investment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AK-47 | Redline has a volatility score of 4.2/10 and rarity score of 6.5/10 on SkinTrackr. Up 3.2% over the last 30 days. Past performance is not financial advice."
      }
    }
  ]
}
```

Rich-result yield estimate: FAQ rich snippets historically boost CTR 10-15% on long-tail queries. Google may show 2-3 FAQs directly in SERP.

### 3.4 ItemList (pillar + category pages)

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "AK-47 Skins in CS2",
  "numberOfItems": 247,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "/skins/ak-47/redline", "name": "AK-47 | Redline" }
  ]
}
```

(Top 20 only, do not dump all 247.)
---

## 4. Topic Cluster + 90-Day Content Calendar

### 4.1 Pillar 1 - Skin Investing & Market Analysis (highest commercial intent)

**Hub:** /blog/cs2-skin-investing-guide (Day 1, 5000-word pillar)

**Cluster articles** (Weeks 1-4):

| Week | Article | Target keyword | Intent | Links to |
|------|---------|---------------|--------|----------|
| 1 | How to Invest in CS2 Skins (2026 Guide) | "how to invest in CS2 skins" (1-3k vol) | Informational | All 15k spokes via examples |
| 1 | Best CS2 Skins to Hold Long-Term | "best CS2 skins to invest" | Commercial | Top-50 by 1y growth, programmatic table |
| 2 | CS2 Knife Investment Guide: Karambits, Butterflies & Beyond | "CS2 knife investment" | Commercial | /skins/knives + 20 knife spokes |
| 2 | What is Volatility in CS2 Skin Prices? | "CS2 skin volatility" | Informational | volatility-explainer + 10 high-vol spokes |
| 3 | CS2 Case Opening EV: Which Cases Are Actually Profitable? | "CS2 case EV", "best CS2 case to open" | Commercial | All 50 case spokes, programmatic EV table |
| 4 | StatTrak vs Normal: Which Skins Are Worth the Premium? | "StatTrak worth it CS2" | Informational | Top-20 StatTrak comparisons |

### 4.2 Pillar 2 - Skin Trading & Markets

**Hub:** /blog/cs2-skin-trading-guide (Week 5, 4000 words)

| Week | Article | Keyword | Intent |
|------|---------|---------|--------|
| 5 | Steam Market vs Skinport vs CSFloat: Which Is Cheapest? | "best CS2 marketplace" | Commercial |
| 6 | CS2 Arbitrage: Finding Price Gaps Across Markets | "CS2 skin arbitrage" | Commercial |
| 7 | How to Sell CS2 Skins Safely (Buff163, Skinport, CS.Money) | "how to sell CS2 skins" | Transactional |
| 8 | CS2 Trade Hold Explained: 7-Day Cooldown & How to Avoid It | "CS2 trade hold" | Informational |

### 4.3 Pillar 3 - Float Values & Patterns (technical, low-competition)

**Hub:** /blog/cs2-float-value-guide (Week 9)

| Week | Article | Keyword | Intent |
|------|---------|---------|--------|
| 9 | What is Float Value in CS2? Complete Float Guide | "CS2 float value", "CS2 float explained" | Informational |
| 10 | Best Float Values for Each Skin (FN vs MW vs FT) | "CS2 best float value" | Commercial |
| 11 | Rare Float Patterns That Sell for 10x: Marble Fade, Doppler, Case Hardened | "rare CS2 patterns" | Commercial |

### 4.4 Pillar 4 - News & Market Recaps (recurring, freshness signal)

**Hub:** /blog/cs2-market-news (always-on)

| Cadence | Article | Keyword |
|---------|---------|---------|
| Weekly (every Mon) | CS2 Skin Market Recap, Week of {date} | "CS2 market this week" |
| Monthly (1st) | {Month} 2026 CS2 Market Report: Biggest Gainers & Losers | "CS2 market report" |
| Event-driven | CS2 Major / Update / Case-Drop Recap | event-tied |

Programmatically generated from DB queries (`top-10-gainers-7d`, `top-10-losers-7d`, `volume-leaders-7d`). Human edit pass for headline + intro paragraph. ~30 min/week of CEO time.

### 4.5 90-day calendar summary

| Month | Theme | Pillar articles | Spoke articles | Programmatic launches |
|-------|-------|----------------|----------------|----------------------|
| Month 1 (W 1-4) | Investing foundation | Pillar 1 hub + 6 cluster | - | 15k skin spokes (after slug-backfill) |
| Month 2 (W 5-8) | Trading mechanics | Pillar 2 hub + 4 cluster | 4 weekly recaps | 50 case spokes, /collections/* pages |
| Month 3 (W 9-12) | Float & patterns | Pillar 3 hub + 3 cluster, Pillar 4 ongoing | 4 weekly + 1 monthly recap | /rarity/* + /float/* landing pages |
---

## 5. Link-Building Plan (no-paid-budget, no-spam)

### Tactic 1 - Reddit case-study posts (highest ROI)

**Subs to target:** r/csgomarketforum (180k), r/GlobalOffensiveTrade (650k), r/csgotrading (290k), r/csgo (1.7M, careful with rules).

**Format that works (per market-analysis doc):**
- "I tracked my CS2 portfolio for 6 months, here is what I learned" (with screenshots from our dashboard)
- "Built a free volatility score for every CS2 skin, feedback wanted" (link to /skins or /research)
- "Data: top-10 CS2 skins by 30-day price change" (link to /skins/top-gainers, auto-generated)

**Cadence:** 1 post/week from CEO personal account (not branded), max. Reddit hates promotion. Every post must lead with value, mention tool once at the bottom.

**KPI:** referral traffic from `*.reddit.com` in PostHog + GSC.

### Tactic 2 - Steam Community Guides

Anyone can publish a guide on steamcommunity.com/sharedfiles. CS2 trading guides routinely hit 100k+ views.

**Guide ideas:**
- "How to Read CS2 Skin Price Charts (Beginner Guide)" embed screenshots of our charts, link in description
- "Every CS2 Knife Skin Ranked by 1-Year Price Growth" programmatically generated from DB

**Linking:** Steam allows external URLs in guide descriptions. 1 link per guide is fine.

**Cadence:** 2 guides published in Month 1, monitor performance, expand.

### Tactic 3 - YouTube comments + CS-investing channel partnerships

**Phase 1 (free):** comment thoughtfully on Sparkles / Whose / mid-tier CS investment YouTubers videos. Add value (e.g. "Skinport has been $2 under Steam on this skin all month, here is the chart" with link). Do NOT spam.

**Phase 2 (if budget ever opens, Sprint 5+):** sponsor 1-2 mid-tier channels for $500-2k flat. Mentioned in market-analysis doc as highest-leverage paid channel.

### Tactic 4 - Competitor "vs" content

Write /blog/skintrackr-vs-pricempire, /blog/skintrackr-vs-steamledger comparison pages. Honest pros/cons (no trash-talk, Reddit will flame us). Target comparison queries: `pricempire alternative`, `is SteamLedger free`.

These often get picked up by listicle sites (esportfire, tradeit.gg blog) because they want a "competitor comparison" angle for their reviews. Free backlink potential.

### Tactic 5 - Open data + API freebies for citation farming

Publish a public /api/v1/public/top-movers?period=7d endpoint (no auth, rate-limited) that returns top-10 gainers/losers as JSON. Reddit/Discord script-kiddies will use it. When they post charts, ask them to credit `data: skintrackr.com`. Cheap freelance-marketing.

**Out of scope:** paid links, PBN, comment-spam, guest-post-link-buying. All explicitly excluded per CEO directive.
---

## 6. SEO KPIs in PostHog + Google Search Console

### 6.1 New PostHog events to add (Sprint 2, same PR as SEO ship)

Extend `frontend/src/lib/analytics.ts` discriminated union:

```typescript
| {
    name: "seo_landing_viewed";
    properties: {
      page_type: "skin_detail" | "case_detail" | "weapon_pillar" | "blog_post";
      slug: string;
      referrer_host?: string;       // "google.com", "reddit.com"
      organic: boolean;             // referrer_host in (google, bing, duckduckgo)
    };
  }
| {
    name: "seo_internal_link_clicked";
    properties: {
      from_slug: string;
      to_slug: string;
      link_type: "related_skin" | "breadcrumb" | "pillar_to_spoke" | "wear_variant";
    };
  }
| {
    name: "seo_signup_funnel_step";
    properties: {
      step: "landed_organic" | "viewed_pricing" | "started_signup" | "completed_signup";
      from_slug?: string;
    };
  }
| {
    name: "seo_affiliate_click";          // extends existing affiliate_click
    properties: {
      skin: string;
      source: "steam" | "skinport" | "csfloat" | "cs_money";
      from_organic_session: boolean;
    };
  }
```

Why these:
- `seo_landing_viewed` cohort "users who landed organically on a skin page" track their funnel
- `seo_internal_link_clicked` measure whether internal-link graph actually surfaces 15k pages
- `seo_signup_funnel_step` "organic-to-paid" conversion rate, north-star
- `seo_affiliate_click` flag revenue attribution to organic search

### 6.2 PostHog dashboards to build (1 day of work)

1. **Organic Acquisition Funnel** `seo_landing_viewed (organic=true)` -> `pricing_page_viewed` -> `signup_completed` -> `subscription_created`
2. **Top SEO Landing Pages** `seo_landing_viewed` grouped by `slug`, sorted by count last 7d
3. **Internal-Link Performance** `seo_internal_link_clicked` heatmap (from_slug x link_type)
4. **Organic to Affiliate Revenue** `seo_affiliate_click (from_organic_session=true)` x estimated commission

### 6.3 Google Search Console weekly review checklist

Set up GSC + Bing Webmaster Tools immediately after sitemap deploy. Weekly review (10 min):

| Metric | Target (Month 3) | Action if below |
|--------|------------------|-----------------|
| **Total clicks** | 5,000/mo | More content, faster |
| **Total impressions** | 200,000/mo | Submit more URLs, fix indexation |
| **Avg CTR** | >2% | Improve title/meta templates |
| **Avg position** | <20 | Fix on-page SEO + backlinks |
| **Indexed pages** | >12,000 of 15,071 | Check Coverage report, fix excluded URLs |
| **Core Web Vitals: LCP** | <2.5s on mobile | Optimize hero image, defer non-critical JS |
| **Core Web Vitals: CLS** | <0.1 | Reserve image/chart space |
| **Pages crawled per day** | >500 | Improve internal linking |

**Critical reports to check weekly:**
1. **Performance Queries** what searches we rank for. Look for surprise long-tails we did not plan for.
2. **Coverage Excluded** pages Google will not index. Top exclusion reasons usually: "Discovered but not indexed" (need more links), "Duplicate without canonical" (canonical tag broken).
3. **Enhancements Product/FAQ/Breadcrumb** confirms our JSON-LD parses correctly.
4. **Manual Actions** should always be empty. If not, panic immediately.

### 6.4 SEMrush / Ahrefs alternative for $0

GSC + Bing WMT covers 80% of what paid tools give. For competitor research, use the **Google `site:` operator manually**:
- `site:pricempire.com inurl:"/skin/"` count of indexed skin pages
- `site:csgostash.com "AK-47 Redline"` what content do they have?
- `"AK-47 Redline" -site:steamcommunity.com` who else ranks for this query?

Saves $99-499/mo.
---

## 7. Sprint 2 Implementation Plan (8 dev-days)

| Day | Task | Owner | Definition of done |
|-----|------|-------|---------------------|
| 1 | Schema add: `slug` + `weaponSlug` + backfill script | Agent | All 15,071 skins have unique slugs in DB |
| 1 | Next.js dynamic routes /skins/[weapon]/[slug] + /skins/[weapon] + /cases/[slug] | Agent | Routes render with placeholder data |
| 2 | Page template: hero + price-comparison + chart + FAQ + CTA | Agent | One sample skin renders end-to-end |
| 2 | JSON-LD generators (Product, BreadcrumbList, FAQPage) | Agent | Validated via Google Rich Results Test |
| 3 | Title + meta templates with truncation safety | Agent | All variants render <60ch / <155ch |
| 3 | Sitemap generator: index + 16 chunked sitemaps | Agent | /sitemap.xml accessible, passes XML validator |
| 4 | robots.txt + <link rel="canonical"> on every page | Agent | Canonical tags verified on 5 sample pages |
| 4 | Internal-link graph: related-skins query + pillar pages | Agent | Top-50 skins per weapon listed |
| 5 | PostHog SEO events added to analytics.ts | Agent | Events fire in dev console |
| 5 | Page-speed: lazy-loaded images, deferred Chart.js | Agent | Lighthouse mobile score >85 |
| 6 | Blog scaffold: /blog/[slug] + Pillar 1 hub article published | Agent + CEO | "How to Invest in CS2 Skins" live |
| 6 | Spoke article 1: "Best CS2 Knife Investments" with programmatic table | Agent | Live, internal-linked from Pillar 1 |
| 7 | Submit sitemap to Google Search Console + Bing WMT | CEO | "Submitted" status confirmed in GSC |
| 7 | Affiliate links wired into price-comparison rows (Skinport + CS.Money) | Agent | Click tracking via affiliate_click event |
| 8 | QA + Rich Results Test on 20 sample pages | Agent | Zero validation errors |
| 8 | Reddit launch post drafted in CEO voice | CEO | Posted in r/csgomarketforum |

**Out-of-Sprint-2 (Sprint 3+):**
- Long-form blog (weekly recaps automation)
- Knife/glove per-wear separate pages
- More affiliate sources (CSFloat, SkinSwap)
- Schema.org Review markup (needs user-review system)

---

## 8. Quick Wins (ship before Sprint 2 ends, low-effort high-leverage)

1. **301-redirect any /items/{id} URLs to /skins/{weapon}/{slug}** preserve any existing link equity (Vercel/Next.js middleware).
2. **Open Graph + Twitter Card meta on every page** same data as Schema.org but for social. Reddit/Discord/Twitter preview cards = free referral traffic.
3. **hreflang once we add non-EN markets** not Sprint 2, but mark in plan.
4. **/skins.json machine-readable index** let scrapers/AI agents discover us. Important if LLM-search becomes default by 2027.
5. **Compress images via Next.js <Image> with AVIF + WebP fallback** Steam CDN images are PNG (avg 80KB). AVIF cuts to 15KB, improves LCP, ranks better.

---

## 9. Risks + Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Google delays indexing 15k pages (typical: 6-12 weeks for fresh domains) | High | Submit pillars first, link spokes from pillars, manual "Request Indexing" for top-100 skins |
| Thin-content penalty (per-skin pages too similar) | Medium | FAQ + chart + research-score + related-skins delivers ~500 unique tokens; should pass |
| Competitor counter-attack (Pricempire SEO team) | Medium | Cannot outspend them, wedge is freshness (daily refresh) + better UX (charts) |
| Affiliate disclosure compliance (FTC) | Low but legally required | Add "Some links are affiliate links, we may earn a commission" footer + per-link rel="sponsored" |
| Steam CDN image hot-linking ban | Low | Mirror critical images to our CDN as fallback (Cloudflare R2, ~$1/mo for 15k images) |
| Duplicate-content with our own /skins/{weapon} listing pages | Medium | Strict canonical tags + noindex on ?wear= variants except default |

---

## 10. Success Metrics, 90 Days from Sprint 2 Ship

**Conservative target:**
- 2,500 organic clicks/mo from GSC by Day 90
- 1,000+ indexed pages
- 200+ Free signups attributable to organic
- 5-15 Pro conversions from organic (50-150 EUR MRR)

**Optimistic target (if Reddit posts hit + 1 viral blog):**
- 10,000 organic clicks/mo
- 8,000+ indexed pages
- 1,500 Free signups
- 80+ Pro conversions (800 EUR MRR)

**Reality check:** competitors took 12-36 months to reach current rankings. We will not match Pricempire in 90 days. But 2.5k clicks/mo at 5% signup x 5% Pro conversion = real revenue.

---

## Decision Lock

**Approved by CEO 2026-05-20:**
- Slug pattern: /skins/{weapon}/{name} + ?wear= query (wear-canonical)
- Knife/glove exception: separate pages per wear when spread >$50
- JSON-LD: Product + Offer + BreadcrumbList + FAQPage (no fake Reviews)
- Sitemap: index + 16 chunked files
- Content: 4 pillars x 3 spokes minimum in 90 days
- Link-building: Reddit + Steam Guides + Vs-content + Open API. No paid links.
- Analytics: 4 new SEO PostHog events + GSC weekly review

**Open questions for CEO:**
1. Custom domain decision `skintrackr.com`? Affects all canonical URLs (currently a Sprint 0 blocker).
2. Affiliate program approval Skinport invite-only, CS.Money standard 7%. Both need CEO to apply.
3. Knife/glove threshold ($50 spread) confirm or adjust before backfill script runs.
