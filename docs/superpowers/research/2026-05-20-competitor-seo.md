# Competitor SEO Analysis — CS2 Skin Tracking (2026-05-20)

Source: searchfit-seo:competitor-analyzer agent run during Sprint 2 planning.

## 1. URL Pattern + Rendering Matrix

| Competitor | Skin Detail URL Pattern | Rendering | Indexed Pages | Title Pattern |
|---|---|---|---|---|
| **steamanalyst.com** | `/skin/[weapon-skin]` + `/skin/[weapon-skin]/[wear]` + `/guides/[skinid]` | Next.js SSR | Heavy — per wear + StatTrak + long-form guides | "AK-47 Redline Price & Float Values \| SteamAnalyst" |
| **csgostash.com** (`stash.clash.gg`) | `/index.php/skin/[id]/[Name]` + `/item/[id]/[variant-wear]` | PHP SSR (bot-protected) | Massive — every skin × wear × StatTrak × souvenir | "AK-47 \| Redline - CS2 Stash" |
| **pricempire.com** | `/cs2-items/skin/[skin-slug]` + `/cs2-items/skin/[skin]/[variant-wear]` | SSR (Cloudflare 403) | Strong — overview + per-variant + comparison + sticker | "AK-47 \| Redline \| CS2 Market Stats & Analysis" |
| **skinport.com** | `/item/[skin-wear]` + `/item/[skin-wear]/[steamid]` | SSR (Cloudflare 403) | Marketplace, every listing indexable | "AWP \| Asiimov (Field-Tested) - Counter-Strike 2" |
| **csmoney.com** | `/csgo/[skin-wear]/` + `/[lang]/csgo/...` | SSR, geo-localized | Strong — multiple locale variants | "Trade CS:GO/CS2 skins on CS.MONEY" |
| **csgobackpack.net** | `/?nick=[steamid]` (user inv only) | Plain PHP | User inventories indexed, not skins | Generic |
| **csgoskins.gg** | `/items/[skin-slug]` + `/items/[skin]/[wear]` | SSR + structured data | Strong aggregator | "AWP \| Asiimov - CSGOSKINS.GG" |

## 2. SERP Drivers (top 3 trends)

- "ak-47 redline price field-tested" → SteamCommunity, **steamanalyst.com** (skin + guide), **pricempire.com**. Drivers: per-wear pages + price history charts + multi-market table.
- "awp asiimov field-tested price" → SteamCommunity, **csgoskins.gg**, **steamanalyst.com**, then pricempire/skinport/csmoney. Drivers: 18+ market price comparison panels.
- "butterfly knife fade price cs2" → pricempire, steamanalyst, **csgoskins.gg**, **HLTV**. Long-form pattern explainers win.
- "doppler phases" → SteamAnalyst guide ranks alongside DMarket/Tradeit blogs. Long-form (3,200-word) pattern explainers dominate.

## 3. Content Gaps We Could Fill

- **Multi-market price aggregation panel** (csgoskins.gg shows 18+, pricempire 21, steamanalyst 8)
- **Per-wear/StatTrak/Souvenir** indexed pages (csgostash dominant)
- **Pattern indices** — Fade %, Doppler phases, Case Hardened blue gem
- **Sticker craft valuations** + sticker tracker
- **Float distribution drop charts**
- **Pro player inventory references**
- **Year-by-year price history narrative**
- **Trade-up calculator integration**

## 4. Recommended Differentiation Wedge

**"Real-time multi-source price + alert pages"** — programmatic comparison pages.

Sprint 2 ships multi-source pricing → ship one page per skin per wear:
`/skins/[slug]/[wear]/best-price` showing live cross-market delta + price-alert CTA.

**Defensible because:**
- pricempire/steamanalyst show static "current price"; nobody owns the **"cheapest right now" + alert** intent.
- AlertCS (alertcs.com) is the closest competitor but still waitlist.
- Stack with Schema.org `Product` + `Offer` for rich SERP results.

**Runner-ups:**
- **Comparison pages** (`/compare/ak-47-redline-vs-ak-47-elite-build`) — zero current strong rankers; pure programmatic play.
- **Investment scoring** — competitors describe; nobody quantifies with a published methodology.

## 5. Quick-Win Keywords (rank in <90 days)

| # | Keyword Template | Why Winnable |
|---|---|---|
| 1 | `[skin] field-tested vs minimal wear` | No dedicated per-skin pages — only generic blogs |
| 2 | `[skin] cheapest price now` | Buyer-intent. Competitors show static, not "now" |
| 3 | `[skin] price alert` | AlertCS not live; pricempire buries this feature |
| 4 | `[skin] worth buying 2026` | Mostly thin blogs; build dated programmatic answer |
| 5 | `[skin] good investment` | Steamanalyst hints but no scored verdict |
| 6 | `[skin-A] vs [skin-B] price` | Almost no head-to-head pages |
| 7 | `best ak-47 skin under $[X]` | Skinsmonkey/eneba blogs only — programmatic page-per-budget |
| 8 | `[skin] stattrak price difference` | Steamanalyst has data but not landing pages |
| 9 | `cs2 [skin] float for [budget]` | Niche; tradeup/budget intent unanswered |
| 10 | `cs2 [skin] price history 2026` | Mostly chart widgets, no narrative |

## Other notes

- 4 of 6 competitors returned 403 to plain WebFetch → strong Cloudflare/bot protection. Implies rich SSR HTML, harder to scrape. We should serve clean SSR + structured data and avoid same defensive posture initially for crawl-friendliness.

## Sources

- https://www.steamanalyst.com/skin/ak-47-redline
- https://www.steamanalyst.com/guides/ak47-redline
- https://www.steamanalyst.com/guides/doppler-phases
- https://pricempire.com/cs2-items/skin/ak-47-redline
- https://pricempire.com/inventory
- https://pricempire.com/comparison
- https://skinport.com/item/awp-asiimov-field-tested
- https://cs.money/csgo/ak-47-redline-field-tested/
- https://csgoskins.gg/items/awp-asiimov
- https://www.cs2stickertracker.com/
- https://www.alertcs.com/
- https://tradeit.gg/cs2-float-checker
