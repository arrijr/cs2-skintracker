# Tech Debt & Bekannte Probleme

## 🔴 Must-Fix vor Production GA

| # | Problem | Datei | Fix |
|---|---------|-------|-----|
| 1 | **Clerk Audience-Validierung deaktiviert** | `verifyClerkJwt.js` ~Zeile 96 | `audience: [audience, ...]` auskommentiert — wieder aktivieren |
| 2 | **Clerk Test-Keys aktiv** | `backend/.env`, `frontend/.env.local` | `pk_test_`/`sk_test_` → `pk_live_`/`sk_live_` in Vercel |
| 3 | **DEV_TEST_TOKEN + DEV_FREE_TOKEN** | `backend/.env` | Entfernen vor GA |
| 4 | **NODE_TLS_REJECT_UNAUTHORIZED=0** | `server.js` | Deaktiviert TLS global — gefährlich in Production |
| 5 | **CORS lässt alle Origins durch** | `app.js` | `callback(null, true)` immer — Whitelist ist dekorativ |

## ✅ Resolved 2026-05-22 (Notifications Audit + Fix)

Vollständige Dokumentation: [[superpowers/research/2026-05-22-notifications-audit-fix]]

| # | War | Status |
|---|-----|--------|
| - | Inngest `priceAlertsCheck` Import zeigte auf nicht-existente Datei → Alerts feuerten in Produktion **nie** | Pfad korrigiert, silent-catch entfernt |
| - | `getTierFromUser` ignorierte `User.tier` → Lite-User auf Free-Quote gekappt | Reads `tier` mit `isPremium`-Fallback |
| - | `mark-all-read` war No-op Stub, AlertEvent ohne `readAt` | Migration `20260522000000` + echter Endpoint |
| - | Bell-Body suchte `payload.price` — kein Evaluator emittiert das | Lookup auf `currentPrice ?? casePrice` |
| - | Alert über Threshold feuerte jeden Cooldown — kein Edge-Trigger Dedup | Migration `20260522010000` (`Alert.lastConditionState`) + `shouldFire()` |
| - | Email-Service Crash ohne `EMAIL_USER`/`EMAIL_PASS` | Lazy-Init mit klarer Error-Message |
| - | `JSON.stringify(payload)` leakte interne Feldnamen in Email-Body | `renderPayload()` Key:Value-Rows mit €/% Formatting |
| - | Email ohne Plain-Text-Alt | Text-Alt für Deliverability ergänzt |
| - | `pushAlerts` Toggle in UI → DB-Column ohne Reader → Dead-UX | Replaced mit "Coming soon" Badge |
| - | AlertCard zeigte nur Email-Channel-Icon, nicht `in_app` | Bell-Icon ergänzt |
| - | `alerts/page.tsx` Mutations warfen unhandled rejections | Sonner Toast-Wrap |
| - | NotificationsDropdown mark-as-read hatte silent failure | Optimistic mutate + per-item endpoint |

## ✅ Resolved 2026-05-30 (Price-Pipeline Fix)

Vollständige Doku: [[2026-05-30-price-pipeline-fix]]

| War | Status |
|-----|--------|
| Wear-Varianten zeigten identische Preise (Parent-Seed, nie refresht) | 2391 Dupes genullt (SQL); 147 populäre per Hybrid frisch geholt → distinct |
| `getPriceHistory` generierte `Math.random()` Fake-Daten bei leerer History | Ehrliche leere Antwort (`source: 'none'`), Fake-Generator entfernt |
| `dailySkinPriceHistory` Cron lief nie zuverlässig (Render spin-down) | Ersetzt durch **pg_cron** in Postgres (jobid 1+2, 06:30/06:35 UTC) — autonom |
| PriceHistory wuchs 25/Tag statt 2000 | Root-Cause Render-IPv6/spin-down diagnostiziert; GH-Actions-Fix gebaut (blocked auf Secret, siehe #14) |

## 🟡 Tech Debt (vor Scale)

| # | Problem | Beschreibung |
|---|---------|-------------|
| 1 | **Auth-Feld-Inkonsistenz** | Manche Controller: `req.auth?.userId` (Clerk-String), andere: `req.userId` (DB-Int). Vereinheitlichen auf `req.userId` (DB-Int) |
| 2 | **Portfolio-Aggregierungs-Bug** | `getPortfolioSummary` aggregiert nicht nach skinId — mehrfache Käufe = doppelte Positionen (✅ fixed 2026-05-20) |
| 3 | **31 Playwright-Tests übersprungen** | localStorage Mock ≠ Clerk SDK. Braucht echte Clerk Test-Accounts/Fixtures |
| 4 | **Kein UserSubscriptions-Modell** | Service nutzt `User.isPremium` als Tier-Proxy. Stripe customerId, subId, Period-Dates werden nicht persistiert |
| 5 | **researchService Bug** | `getPortfolioResearch` referenziert `prisma.userSubscriptions` — Modell existiert nicht in Schema → Runtime-Error für Pro-User |
| 6 | **isPremium-Source** | Dashboard liest `isPremium` aus Clerk publicMetadata (nicht DB). Subscription-Hook liest aus DB-API. Zwei Quellen der Wahrheit |
| 7 | **Verbose Debug-Logging** | Dutzende `🔍 [DEBUG]` Logs in Routes/Middleware — nicht production-ready |
| 8 | **AdminRoutes PrismaClient** | `adminRoutes.js` + `adminMetricsRoutes.js` instantiieren `new PrismaClient()` statt Singleton |
| 9 | **test:watch kein Path-Filter** | Kann node_modules treffen |
| 10 | **Doppelte Tier-Gating Middleware** | `tierGating.js` + `tier-gating.js` (Duplikat) |
| 11 | **Schema ≠ Live-DB Drift** | `prisma migrate diff` (2026-05-22) deckte auf: DB hat `APIKey`+`APILog` Tables die im Schema fehlen, `MarketSnapshot` hat `createdAt`/`updatedAt` im DB aber nicht im Schema, `Skin.slug` UNIQUE + `User.stripeSubscriptionId` UNIQUE im Schema aber nicht im DB. Braucht eigene Aufräum-Session mit sauberen Drop-Migrations. |
| 12 | ~~3 Toast-Libraries parallel mounted~~ | ✅ fixed 2026-05-30 (`c3615fd`) — nur noch sonner, shadcn `Toaster` + react-hot-toast entfernt, `ErrorContext` migriert |
| 13 | **Email-Transport Gmail SMTP** | Nodemailer + `EMAIL_USER`/`EMAIL_PASS`. CEO-Checklist §6 plant Resend-Migration. Gmail-Basic-Auth seit 2022 deprecated, braucht App-Password |
| 14 | **Recurring Steam-Fetch blocked** | `priceRefresh` auf Inngest stirbt durch Render-Free-Spin-down (~25 statt 2000 Skins/Tag). GH-Actions-Workflow gebaut (`scheduled-price-refresh.yml`) aber `DATABASE_URL` Secret = direkte (IPv6-only) URL → P1001. **CEO:** Secret auf Session-Pooler-URL umstellen. Details: [[2026-05-30-price-pipeline-fix]] |
| 15 | **Stray gitlink** | `.claude/worktrees/cranky-wilson-bb64cf` committed als Submodule ohne `.gitmodules` → `git submodule` Warnung in CI-cleanup. Entfernen via `git rm --cached` |
| 16 | **Inngest priceRefresh redundant** | Nach GH-Actions-Fix doppelt sich der Steam-Refresh. Inngest-`priceRefresh` Function deaktivieren sobald GH-Actions-Schedule gesund läuft |

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
