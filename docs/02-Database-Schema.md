# Datenbank-Schema

**ORM**: Prisma 6.12 | **DB**: PostgreSQL

---

## User

| Feld | Typ | Notizen |
|------|-----|---------|
| id | Int PK | auto-increment |
| email | String unique | |
| passwordHash | String? | optional (Clerk-User brauchen kein Passwort) |
| clerkId | String? unique | Clerk User ID |
| displayName | String? | |
| timezone | String? | IANA |
| emailAlerts | Boolean | default true |
| pushAlerts | Boolean | default false |
| **isPremium** | Boolean | default false — **Haupt-Subscription-Gate** |
| role | String | "user" oder "admin" |
| createdAt | DateTime | |

> ⚠️ Kein `tier`-Feld! Tier wird aus `isPremium` abgeleitet: `isPremium ? 'pro' : 'free'`

---

## Skin

| Feld | Typ | Notizen |
|------|-----|---------|
| id | Int PK | |
| name | String | |
| marketHashName | String unique | Steam Market Hash |
| imageUrl | String? | |
| weaponType, collection, wear, rarity, quality | String? | |
| isStattrak, isStar | Boolean? | |
| itemType, itemName, itemGroup | String? | von SteamWebAPI |
| priceLatest, priceLatestSell, priceMedian, priceAvg, priceSafe, priceMin, priceMax | Float? | aktuelle Preise |
| priceMedian24h/7d/30d/90d | Float? | historische Medianpreise |
| priceAvg24h/7d/30d/90d | Float? | historische Durchschnittspreise |
| soldToday/24h/7d/30d/90d/Total | Int? | Verkaufsstatistiken |
| hoursToSold | Float? | |
| buyOrderPrice/Median/Avg | Float? | |
| buyOrderVolume, offerVolume | Int? | |
| priceUpdatedAt | DateTime? | |
| unstable, unstableReason | Boolean?/String? | |

---

## Watchlist

| Feld | Typ | Notizen |
|------|-----|---------|
| id | Int PK | |
| userId | Int → User | |
| skinId | Int → Skin | |
| priceAlert | Float? | Alert-Schwellwert |
| createdAt | DateTime | |
| **Unique**: [userId, skinId] | | |

---

## Portfolio

| Feld | Typ | Notizen |
|------|-----|---------|
| id | Int PK | |
| userId | Int → User | |
| skinId | Int → Skin | |
| amount | Int | Anzahl |
| buyPrice | Float | Kaufpreis |
| buyDate | DateTime | |

> ⚠️ **Kein Unique-Constraint** auf (userId, skinId) — gleicher Skin kann mehrere Kaufeinträge haben

---

## CasePortfolio

| Feld | Typ | |
|------|-----|-|
| id, userId, caseId, amount, buyPrice, buyDate | | |
| **Unique**: [userId, caseId] | | |

---

## PriceHistory

| Feld | Typ | |
|------|-----|-|
| id, skinId, date, price | | |
| **Unique**: [skinId, date] | | |

---

## PortfolioHistory

| Feld | Typ | |
|------|-----|-|
| id, userId, date, value, invested, unrealizedPL | | |
| updatedAt: @updatedAt | | |
| **Index**: [userId, date] | | |

---

## Transaction

| Feld | Typ | |
|------|-----|-|
| id, userId, skinId, type (BUY/SELL), amount, price, date, notes | | |

---

## BlogPost

| Feld | Typ | |
|------|-----|-|
| id, slug (unique), title, description, content (MDX), excerpt, category, tags[], authorId, featuredImage, isPublished, publishedAt, viewCount | | |

---

## Weitere Modelle

- **JobRun** — Tracking für Admin-Jobs (cuid PK, status, parameters JSON, Zähler)
- **MarketSnapshot** — Skin-Markt-Snapshots (Unique: [skinId, date])
- **Case** — CS2 Cases mit Preis/Supply-Daten
- **CaseSupply** — Case Supply-Historie (Unique: [caseId, date])
- **CaseSkin** — M:N zwischen Case und Skin
- **CasePriceHistory** — Case-Preis-Historie
- **SkinQuantityHistory** — Skin-Mengen-Historie
- **AuditLog** — User-Aktionen-Log
