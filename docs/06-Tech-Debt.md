# Tech Debt & Bekannte Probleme

## 🔴 Must-Fix vor Production GA

> **Re-verifiziert 2026-05-31** ([[2026-05-31-launch-readiness]]): 4 der 5 Einträge waren
> **stale** — der Code wurde 20.-22.05. gefixt, aber dieses Doc nie aktualisiert. Nur #2
> (Clerk Live-Keys) ist eine echte offene CEO-Aktion. Code-Risiko der anderen: **null.**

| # | Problem | Status (2026-05-31 verifiziert) |
|---|---------|-------|
| 1 | ~~Clerk Audience-Validierung deaktiviert~~ | ✅ **aktiv** — `verifyClerkJwt.js:83` übergibt `audience` an die JWT-Verify, Array gebaut Z.43-45 |
| 2 | **Clerk Test-Keys aktiv** | 🧑 **echte CEO-Aktion offen** — `pk_test_`/`sk_test_` → `pk_live_`/`sk_live_` in Vercel + `CLERK_AUDIENCE` auf prod |
| 3 | ~~DEV_TEST_TOKEN + DEV_FREE_TOKEN als Backdoor~~ | ✅ **nicht in src** — nur in Tests + lokaler `.env`; Dev-Bypass hinter `DEV_BYPASS_AUTH=1` gated (sonst 401). CEO-Check: NICHT in Render-prod gesetzt |
| 4 | ~~NODE_TLS_REJECT_UNAUTHORIZED=0~~ | ✅ **nicht im committed code** — nur lokale `.env` (gitignored). CEO-Check: NICHT in Render/Vercel-prod gesetzt |
| 5 | ~~CORS lässt alle Origins durch~~ | ✅ **Whitelist aktiv** — `app.js:115-126` Allowlist + Vercel-Preview-Pattern, non-match → `callback(new Error)` (reject) |

**Echtes offenes Security-Backlog:** Die 11 HIGH + 11 MEDIUM Findings aus dem
[[2026-05-22-ceo-autonomous-audit]] (separate von dieser 🔴-Sektion) sind noch offen.

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
| 5 | ~~researchService Bug~~ | ✅ **stale (2026-05-31)** — `prisma.userSubscriptions` lebt nur noch in Test-Files; `getPortfolioResearch` nutzt echte Modelle (`prisma.user`+`prisma.portfolio`). Kein Prod-Crash. Controller auf `req.userId` normalisiert (`995a59b`). Offen: `subscription.test.js` referenziert noch das tote Modell → Test failt (nicht Prod) |
| 6 | **isPremium-Source** | Dashboard liest `isPremium` aus Clerk publicMetadata (nicht DB). Subscription-Hook liest aus DB-API. Zwei Quellen der Wahrheit |
| 7 | **Verbose Debug-Logging** | Dutzende `🔍 [DEBUG]` Logs in Routes/Middleware — nicht production-ready |
| 8 | **AdminRoutes PrismaClient** | `adminRoutes.js` + `adminMetricsRoutes.js` instantiieren `new PrismaClient()` statt Singleton |
| 9 | **test:watch kein Path-Filter** | Kann node_modules treffen |
| 10 | **Doppelte Tier-Gating Middleware** | `tierGating.js` + `tier-gating.js` (Duplikat) |
| 11 | **Schema ≠ Live-DB Drift** | `prisma migrate diff` (2026-05-22) deckte auf: DB hat `APIKey`+`APILog` Tables die im Schema fehlen, `MarketSnapshot` hat `createdAt`/`updatedAt` im DB aber nicht im Schema, `Skin.slug` UNIQUE + `User.stripeSubscriptionId` UNIQUE im Schema aber nicht im DB. Braucht eigene Aufräum-Session mit sauberen Drop-Migrations. |
| 12 | ~~3 Toast-Libraries parallel mounted~~ | ✅ fixed 2026-05-30 (`c3615fd`) — nur noch sonner, shadcn `Toaster` + react-hot-toast entfernt, `ErrorContext` migriert |
| 13 | **Email-Transport Gmail SMTP** | Nodemailer + `EMAIL_USER`/`EMAIL_PASS`. CEO-Checklist §6 plant Resend-Migration. Gmail-Basic-Auth seit 2022 deprecated, braucht App-Password |
| 14 | **Recurring Steam-Fetch blocked** | `priceRefresh` auf Inngest stirbt durch Render-Free-Spin-down (~25 statt 2000 Skins/Tag). GH-Actions-Workflow gebaut (`scheduled-price-refresh.yml`) aber `DATABASE_URL` Secret = direkte (IPv6-only) URL → P1001. **CEO:** Secret auf Session-Pooler-URL umstellen. Details: [[2026-05-30-price-pipeline-fix]] |
| 15 | ~~Stray gitlink~~ | ✅ **fixed 2026-05-31** — 3 getrackte gitlinks (`.claude/worktrees/{cranky-wilson-bb64cf,gracious-wu-81807c,vigorous-elbakyan-9e5103}`) via `git rm --cached` entfernt. `.claude/` war schon in `.gitignore` (Z.25), kommen nicht zurück |
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
