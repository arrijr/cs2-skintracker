# Tech Debt & Bekannte Probleme

## 🔴 Must-Fix vor Production GA

| # | Problem | Datei | Fix |
|---|---------|-------|-----|
| 1 | **Clerk Audience-Validierung deaktiviert** | `verifyClerkJwt.js` ~Zeile 96 | `audience: [audience, ...]` auskommentiert — wieder aktivieren |
| 2 | **Clerk Test-Keys aktiv** | `backend/.env`, `frontend/.env.local` | `pk_test_`/`sk_test_` → `pk_live_`/`sk_live_` in Vercel |
| 3 | **DEV_TEST_TOKEN + DEV_FREE_TOKEN** | `backend/.env` | Entfernen vor GA |
| 4 | **NODE_TLS_REJECT_UNAUTHORIZED=0** | `server.js` | Deaktiviert TLS global — gefährlich in Production |
| 5 | **CORS lässt alle Origins durch** | `app.js` | `callback(null, true)` immer — Whitelist ist dekorativ |

## 🟡 Tech Debt (vor Scale)

| # | Problem | Beschreibung |
|---|---------|-------------|
| 1 | **Auth-Feld-Inkonsistenz** | Manche Controller: `req.auth?.userId` (Clerk-String), andere: `req.userId` (DB-Int). Vereinheitlichen auf `req.userId` (DB-Int) |
| 2 | **Portfolio-Aggregierungs-Bug** | `getPortfolioSummary` aggregiert nicht nach skinId — mehrfache Käufe = doppelte Positionen |
| 3 | **31 Playwright-Tests übersprungen** | localStorage Mock ≠ Clerk SDK. Braucht echte Clerk Test-Accounts/Fixtures |
| 4 | **Kein UserSubscriptions-Modell** | Service nutzt `User.isPremium` als Tier-Proxy. Stripe customerId, subId, Period-Dates werden nicht persistiert |
| 5 | **researchService Bug** | `getPortfolioResearch` referenziert `prisma.userSubscriptions` — Modell existiert nicht in Schema → Runtime-Error für Pro-User |
| 6 | **isPremium-Source** | Dashboard liest `isPremium` aus Clerk publicMetadata (nicht DB). Subscription-Hook liest aus DB-API. Zwei Quellen der Wahrheit |
| 7 | **Verbose Debug-Logging** | Dutzende `🔍 [DEBUG]` Logs in Routes/Middleware — nicht production-ready |
| 8 | **AdminRoutes PrismaClient** | `adminRoutes.js` + `adminMetricsRoutes.js` instantiieren `new PrismaClient()` statt Singleton |
| 9 | **test:watch kein Path-Filter** | Kann node_modules treffen |
| 10 | **Doppelte Tier-Gating Middleware** | `tierGating.js` + `tier-gating.js` (Duplikat) |

## ❓ Offene Fragen

- [ ] Monitoring/Logging Service (Sentry?) vor Production?
- [ ] GraphQL neben REST API für Sprint 2 Frontend?
- [ ] Preisupdate soll auch historische Volatilitäts-Metriken berechnen?
- [ ] DB Backup / Disaster Recovery Plan?
- [ ] `skintrackr.com` Domain kaufen ($11.25/Jahr via Vercel)?

## Nächste Schritte Sprint 3

1. Domain kaufen: skintrackr.com
2. Clerk Live-Keys in Vercel setzen
3. Landing Page bauen (Conversion-optimiert)
4. Reddit Launch Post (r/GlobalOffensive, r/csgo)
5. researchService Bug fixen (prisma.userSubscriptions)
6. isPremium-Quellen vereinheitlichen (DB statt Clerk metadata)
