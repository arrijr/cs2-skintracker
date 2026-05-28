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
| pushAlerts | Boolean | default false — **dead column** (kein Reader, UI zeigt "Coming soon") |
| **tier** | String? | `'free' \| 'lite' \| 'pro'` — **echte Tier-Quelle seit Sprint 0** |
| **isPremium** | Boolean | default false — Legacy-Boolean, Fallback wenn `tier` null ist |
| stripeCustomerId / stripeSubscriptionId | String? | unique, Stripe-Verknüpfung |
| subscriptionStatus | String? | `active \| canceled \| past_due \| trialing` |
| currentPeriodStart / currentPeriodEnd | DateTime? | Stripe Billing-Period |
| cancelAtPeriodEnd | Boolean | default false |
| onboardingCompletedAt | DateTime? | null = User noch nicht durch Onboarding-Flow |
| preferredCurrency | String | default 'EUR' (EUR/USD/GBP) |
| themePreference | String | default 'DARK' (DARK/LIGHT/SYSTEM) |
| steamId | String? | unique, Steam OpenID-Verknüpfung |
| steamConnectedAt | DateTime? | |
| role | String | "user" oder "admin" |
| createdAt | DateTime | |

> ℹ️ `tier`-Feld existiert seit Sprint 0 (2026-05-20). `getTierFromUser` liest jetzt `tier` direkt, fällt nur für Legacy-Rows auf `isPremium ? 'pro' : 'free'` zurück.

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

## Alert

| Feld | Typ | Notizen |
|------|-----|---------|
| id | Int PK | |
| userId | Int → User | onDelete: Cascade |
| skinId | Int? → Skin | null = portfolio-wide oder case-based alert |
| caseId | Int? → Case | für `case_ev`-Alerts |
| type | String | `price_threshold \| volatility \| float_tier \| case_ev` |
| config | Json | type-spezifische Konfiguration (threshold, percent, tier, etc.) |
| channels | String[] | `['email']`, `['in_app']`, oder beide |
| isActive | Boolean | default true |
| cooldownMinutes | Int | default 60 — Mindestabstand zwischen Feuern |
| lastTriggeredAt | DateTime? | letzter Fire-Zeitpunkt für Cooldown-Check |
| **lastConditionState** | Boolean? | **Edge-Trigger Dedup** — feuert nur auf false→true Transition (Sprint 2026-05-22) |
| createdAt, updatedAt | DateTime | |
| **Index**: [userId, isActive], [type, isActive] | | |

**Quotas pro Tier** (`alertController.js`):
- Free: 2 active alerts
- Lite: 15
- Pro: 999 (effectively unlimited)

---

## AlertEvent

| Feld | Typ | Notizen |
|------|-----|---------|
| id | Int PK | |
| alertId | Int → Alert | onDelete: Cascade |
| triggeredAt | DateTime | default now() |
| **readAt** | DateTime? | **null = unread** (Sprint 2026-05-22) |
| payload | Json | Evaluator-Output (currentPrice, casePrice, etc.) |
| delivered | String[] | Channels die erfolgreich delivered haben |
| failed | String[] | Channels die fehlgeschlagen sind |
| errorLog | String? | per-Channel Fehler-Details |
| **Index**: [alertId, triggeredAt], [alertId, readAt] | | |

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

---

## ⚠️ Bekannte Schema-Drift (2026-05-22)

`prisma migrate diff` deckte Inkonsistenzen zwischen Schema und Live-DB auf:
- DB hat `APIKey` + `APILog` Tables, Schema nicht (Drop-Migration fehlt)
- `MarketSnapshot` hat in der DB `createdAt`+`updatedAt`, im Schema nicht
- `Skin.slug` UNIQUE-Constraint + `User.stripeSubscriptionId` UNIQUE im Schema, aber nicht in der DB
- Diverse Indexes nur einseitig vorhanden

Out-of-Scope für Notifications-Fix. Braucht eigene Aufräum-Session mit sauberen Drop-Migrations. Siehe [[06-Tech-Debt]] #11.
