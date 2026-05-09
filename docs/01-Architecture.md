# Architektur

## Stack

| Layer | Technologie | Version |
|-------|-------------|---------|
| Frontend | Next.js / React / TypeScript | 15.4.3 / 19 |
| Backend | Express / Node.js ESM | 5.1.0 / 22 |
| Datenbank | PostgreSQL via Prisma | 6.12 |
| Auth | Clerk | @clerk/nextjs ^6 |
| Payments | Stripe | 22 |
| Charts | Chart.js + ApexCharts | 4 / 5 |
| UI | Radix UI + Tailwind + shadcn/ui | — |
| Data Fetching | SWR (frontend), axios (backend→Steam) | — |
| Testing | Jest + Supertest, Playwright | — |
| Scheduling | node-cron | 7 Jobs |
| Logging | Winston | — |

## Deployment

```
Frontend (Next.js)  →  Vercel
Backend (Express)   →  Vercel (serverless)
Database            →  PostgreSQL extern (DATABASE_URL)
Steam-Daten         →  SteamWebAPI.com (primär) + Steam Community Market (fallback)
```

**Live URLs**:
- Backend: https://backend-three-theta-44.vercel.app
- Frontend: (Vercel, Domain: skintrackr.com geplant)

## Tier-System

```
free     → Portfolio + Watchlist (unbegrenzt)
creator  → + 90-Tage Preishistorie
pro      → + Research Tools + CSV Export + 180-Tage Historie
```

Tier-Hierarchie im Code: `{ free: 0, creator: 1, pro: 2 }`

## Lokale Entwicklung

```bash
# Backend
cd backend && npm run dev     # http://localhost:5000

# Frontend  
cd frontend && npm run dev    # http://localhost:3000

# Tests Backend
cd backend && npm run test:sprint2

# Tests Frontend
cd frontend && npx playwright test --project=chromium
```

## Auth-Flow

```
Browser  →  Clerk (JWT)  →  Backend verifyClerkJwt  →  DB User Lookup  →  req.userId (int)
```

**Lokal ohne Clerk-ENV-Vars**: Jedes Bearer Token → `req.userId = 1` (Mock-Fallback)  
**Production**: Echter JWKS-Verify über `CLERK_JWKS_URL`

## Cron-Jobs

| Zeit | Job | Beschreibung |
|------|-----|-------------|
| 02:00 UTC täglich | updateSkinPrices | Batch-Preis-Update alle Skins |
| 02:10 UTC täglich | calculatePortfolioValues | Portfolio-History-Snapshot |
| 00:00 + 12:00 UTC | runPortfolioHistoryCron | 12-stündiges Portfolio-Sampling |
| 03:00 UTC täglich | updateSteamWebAPIData | SteamWebAPI Sync |
| alle 30 Min | checkPriceAlerts | Preisalarm-Benachrichtigungen |
| 06:00 UTC täglich | dailySteamWebAPIDataUpdate | Vollständiger täglicher Sync |
| 06:30 UTC täglich | dailyCasePriceHistory | Case-Preis-Historie |
| 07:00 UTC täglich | dailySkinPriceHistory | Skin-Preis-Snapshot |
| 07:30 UTC täglich | dailySkinQuantityHistory | Skin-Mengen-Snapshot |
