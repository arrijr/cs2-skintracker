# Backend API Endpunkte

**Base URL lokal**: `http://localhost:5000/api/v1`  
**Base URL production**: `https://backend-three-theta-44.vercel.app/api/v1`

## Auth-Middleware

| Middleware | Datei | Beschreibung |
|------------|-------|-------------|
| `verifyClerkJwt` | `middleware/verifyClerkJwt.js` | JWKS-Verify → `req.userId` (DB int) + `req.auth` |
| `clerkAuth` | `middleware/clerkAuth.js` | Clerk SDK → `req.auth.userId` (Clerk string) |
| `clerkAdminAuth` | `middleware/clerkAdminAuth.js` | clerkAuth + DB Admin-Check |
| `optionalClerkAuth` | — | Setzt `req.auth` oder null, blockiert nie |

> ⚠️ **Inkonsistenz**: Manche Controller nutzen `req.auth?.userId` (Clerk-String), andere `req.userId` (DB-Int) → vor Production vereinheitlichen

---

## /api/v1/users

| Method | Path | Auth | Beschreibung |
|--------|------|------|-------------|
| POST | /register | keine | Legacy E-Mail/Passwort-Registrierung |
| POST | /login | keine | Legacy Login |
| POST | /sync | verifyClerkJwt | Clerk-User in DB synchronisieren |
| GET | /me | clerkAuth | Profil abrufen |
| PATCH | /me | clerkAuth | Profil updaten |
| PATCH | /me/password | clerkAuth | Passwort ändern |
| DELETE | /me | clerkAuth | Account löschen |
| GET | /me/role | clerkAuth | Rolle + isPremium aus DB |

---

## /api/v1/skins

| Method | Path | Auth | Beschreibung |
|--------|------|------|-------------|
| GET | / | optional | Skins auflisten (Filter: q, min, max, rarity, wear, quality, stattrak, sort, page, pageSize max 60). 5-Min-Cache |
| GET | /presets | keine | Distinct-Werte für Filter-Dropdowns |
| GET | /:skinId | optional | Skin-Detail: Preise, Historie (90d), Case-Info, Varianten |
| GET | /:skinId/history | keine | Preishistorie |
| GET | /:skinId/variants | keine | Gleicher Waffentyp |
| GET | /:skinId/case | keine | Case via Collection |
| GET | /:skinId/market-stats | keine | Marktstatistiken |
| GET | /:skinId/related | keine | Ähnliche Skins |
| GET | /:skinId/history/quantity | keine | Mengenhistorie |

---

## /api/v1/watchlist

| Method | Path | Auth | Beschreibung |
|--------|------|------|-------------|
| GET | / | verifyClerkJwt | Watchlist abrufen |
| POST | / | verifyClerkJwt | Skin hinzufügen (body: skinId) |
| DELETE | /:skinId | verifyClerkJwt | Skin entfernen |
| PATCH | /:skinId | verifyClerkJwt | priceAlert updaten |

---

## /api/v1/portfolio

| Method | Path | Auth | Beschreibung |
|--------|------|------|-------------|
| GET | /summary | verifyClerkJwt | Portfolio-Übersicht (totalValue, unrealizedPL, positions) |
| GET | / | verifyClerkJwt | Volles Portfolio mit Marktpreisen |
| GET | /kpis | verifyClerkJwt | KPIs: value, change24h/7d, invested, risk metrics |
| GET | /contribution | verifyClerkJwt | Beitrags-Ranges (week/month/quarter) |
| POST | / | verifyClerkJwt | Eintrag hinzufügen (skinId, amount, buyPrice, buyDate) |
| DELETE | /:id | verifyClerkJwt | Eintrag löschen |
| PATCH | /:id | verifyClerkJwt | Eintrag updaten |

---

## /api/v1/subscriptions

| Method | Path | Auth | Beschreibung |
|--------|------|------|-------------|
| POST | /checkout | verifyClerkJwt | Stripe Checkout Session erstellen (body: tier = "creator"\|"pro") → `{sessionId, url}` |
| GET | /status | verifyClerkJwt | Subscription-Status (tier, canAccessResearch, canExportCSV…) |
| POST | /cancel | verifyClerkJwt | Aktive Subscription kündigen |
| POST | /webhook | keine (Stripe Sig) | Stripe Webhooks: subscription.created/updated/deleted, invoice events |

> ⚠️ Kein `UserSubscriptions`-Modell in DB — Service nutzt `User.isPremium` als Tier-Proxy

---

## /api/v1/research

| Method | Path | Auth | Tier |
|--------|------|------|------|
| GET | /portfolio | verifyClerkJwt | **Pro** |
| GET | /skins/:id | verifyClerkJwt | **Pro** |
| GET | /volatility/:id | keine | Öffentlich |
| GET | /rarity/:id | keine | Öffentlich |

---

## /api/v1/transactions

| Method | Path | Auth | |
|--------|------|------|-|
| GET | / | clerkAuth | User-Transaktionen |
| POST | / | clerkAuth | BUY/SELL hinzufügen |
| PATCH | /:id | clerkAuth | Updaten |
| DELETE | /:id | clerkAuth | Löschen |

---

## /api/v1/health

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | / | `{ok, ts, service}` |
| GET | /build-info | Version, Uptime, Memory |
| GET | /cron-status | Letzte Cron-Job Timestamps |
| GET | /clerk | JWT-Verifikations-Test |

---

## /api/v1/admin/metrics

| Method | Path | Auth | |
|--------|------|------|-|
| GET | /overview | clerkAdminAuth | Vollständige Metriken: User, Portfolio, Jobs |
| GET | /realtime | clerkAdminAuth | Aktive User (5-Min-Fenster), System |
| GET | /range | clerkAdminAuth | Wachstums-Metriken (start/end Query) |

---

## /api/v1/blog

| Method | Path | Auth | |
|--------|------|------|-|
| GET | / | keine | Posts (page, limit, category, tag, search) |
| GET | /:slug | keine | Post via Slug |
| POST | / | Admin | Post erstellen |
| PUT | /:id | Admin | Post updaten |
| DELETE | /:id | Admin | Post löschen |
| PATCH | /:id/publish | Admin | Publish-Status toggeln |
