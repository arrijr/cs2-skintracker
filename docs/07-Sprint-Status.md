# Sprint Status

## Sprint 1 ✅ Abgeschlossen

- Datenbank-Schema (PostgreSQL + Prisma)
- Basis-API (Skins, Watchlist, Portfolio)
- Stripe-Integration (initial)
- 56 Skins + 5040 Preishistorie-Einträge geseedet
- Ø API-Antwortzeit: 57ms

## Sprint 2 ✅ Abgeschlossen (Testing Mai 2026)

### Phase 0: Datenbank — ✅
Keine Migrationen nötig

### Phase 1: Backend APIs — ✅
- `portfolioService.js` (280 Zeilen)
- `researchService.js` (320 Zeilen)
- `subscriptionService.js`
- `researchController.js` / `researchRoutes.js`
- `subscriptionController.js` / `subscriptionRoutes.js`
- Alle Routen in `app.js` gemountet

### Phase 2: React Komponenten — ✅
- `PortfolioDashboard.tsx`
- `UpgradeModal.tsx` (Stripe Checkout UI)
- `ResearchPanel.tsx`
- `SkinPriceHistoryChart.tsx`
- `useSubscription.ts`

### Phase 3: Stripe Integration — ✅
- Webhook Handler bereit
- Test-Key aktiv: `sk_test_51TTkHg...`
- Price ID: `price_1TTkJIAfapl1SDUrKg1Nb06O` (19.99€/Monat Pro)

### Phase 4: Research Tools — ✅
- Volatility-Analyse (7d/30d/90d)
- Rarity-Scoring Heuristiken

### Testing — ✅ (10/11 Backend Tests, Playwright teilweise)
- Jest konfiguriert für ESM
- 10/11 Sprint2 Backend-Tests bestehen
- 31 Playwright-Tests übersprungen (Clerk Auth-Mock Problem)

### Fixes dieser Phase
- `verifyClerkJwt.js`: Hardcoded userId=67140 → echter DB-Lookup
- Fehlende Route-Mounts (subscriptions + research waren nie in app.js)
- `subscriptionService`: Eigener PrismaClient → Singleton
- `frontend/.env.local` UTF-16 Korruption → sauber UTF-8
- Clerk Test-Keys aktiviert (`pk_test_` / `sk_test_`)
- `useSubscription`: `getToken` von `useAuth()` statt `useUser()`
- Stripe Checkout: `loadStripe().redirectToCheckout()` statt direkter URL

## Notifications Audit + Fix ✅ Abgeschlossen (2026-05-22)

Vollständig: [[superpowers/research/2026-05-22-notifications-audit-fix]]

**Auslöser**: User-Request "Ich will, dass Du mithilfe von Agents die Notifications überprüfst, ob die alle funktionieren, ob es Bugs gibt".

**Vorgehen**: 3 parallele Audit-Agents über Backend, Frontend, API+Schema. 12 Bugs identifiziert (4 P0 blockers, 8 P1).

**Hauptergebnis**: Vor dem Fix feuerten Alerts in Produktion **faktisch nie** (Inngest hatte einen toten Import) und die "Mark all read"-Funktion war ein UI-Stub ohne DB-Persistenz.

**Schema-Changes**:
- `AlertEvent.readAt DateTime?` (Migration `20260522000000_alert_event_read_at`)
- `Alert.lastConditionState Boolean?` (Migration `20260522010000_alert_last_condition_state`)

**Test-Coverage**:
- 35 Unit-Tests (`alerts.test.js` + neu `notifications.test.js`)
- 12 Smoke-Tests (`scripts/smoke-notifications.mjs`) gegen Live-Supabase

**Migrations-Ledger-Drift gelöst**: 9 alte Migrationen waren in `_prisma_migrations` nicht getrackt, obwohl die Spalten in der DB existierten (manuelle Supabase SQL-Console-Einspielung). Per `prisma migrate resolve --applied` repariert.

**Status**: Code im Working Tree (uncommitted). Migrationen auf Live-DB angewandt. Lokaler E2E-Test grün. Pending: `git push` + Email-Env in Vercel.

---

## Sprint 3 🔄 Laufend

| Aufgabe | Status |
|---------|--------|
| Domain skintrackr.com kaufen | In Arbeit |
| Clerk Live-Keys in Vercel | Ausstehend |
| Landing Page | Ausstehend |
| Reddit Launch Post | Ausstehend |
| Stripe Checkout end-to-end testen | In Arbeit |
| Notifications: `git push` + Email-Env setzen | Ausstehend (post-Audit) |
| Inngest Dashboard: `price-alerts-check` Function prüfen | Ausstehend (post-Audit) |

## Sprint 4 (geplant)

- Erste echte User onboarden
- Monitoring (Sentry?)
- Performance-Optimierung
- SEO-Content (Blog)
