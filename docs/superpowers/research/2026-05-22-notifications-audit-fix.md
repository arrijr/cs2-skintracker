# Notifications System — Audit + Fix Session

**Datum**: 2026-05-22
**Branch**: `main` (direct commits, kein PR)
**Scope**: Alle In-App + Email Notifications — Backend Engine, Frontend UI, Schema, Tests

---

## TL;DR

3 parallele Audit-Agents identifizierten **12 Bugs** im Notification-System (4 P0 blockers, 8 P1 correctness). Alle gefixt. 35 Unit-Tests + 12 Smoke-Tests gegen die Live-Supabase-DB grün. Migrationen angewandt. Server lokal verifiziert.

Hauptergebnis: vor diesem Fix **feuerten Alerts in Production faktisch nie** (Inngest-Scheduler hatte einen toten Import) und die "Mark all read"-Funktion war ein UI-Stub ohne DB-Persistenz.

---

## P0 Bugs gefunden + gefixt

### 1. Inngest-Scheduler tot

**File**: `backend/src/inngest/functions.js:153`
**Symptom**: Auf Vercel-Deployment feuerten Alerts nie. Inngest-Dashboard zeigte erfolgreiche Runs mit `{ skipped: true }`.
**Root Cause**:
```js
const { checkPriceAlerts } = await import('../cron/priceAlertsCheck.js').catch(() => ({
  checkPriceAlerts: null,
}));
```
Datei heißt eigentlich `priceAlertJob.js`. Der silent-catch schluckte den Modul-Resolve-Error und lieferte `{ checkPriceAlerts: null }` zurück, was dann zum freundlichen `skipped: true`-Pfad führte. Wochenlang grünes Cron, null Notifications.
**Fix**: Pfad korrigiert, silent-catch entfernt. Lazy-import bleibt für Load-Cost-Vermeidung.

### 2. Lite-Tier unerreichbar

**File**: `backend/src/controllers/alertController.js:14`
**Symptom**: Zahlende Lite-Kunden (€6.99/Mo) wurden auf Free-Quote (2 Alerts) gekappt statt 15.
**Root Cause**:
```js
function getTierFromUser(user) {
  return user?.isPremium ? 'pro' : 'free';  // las nur boolean, ignorierte User.tier
}
```
Ein TODO-Kommentar zwei Zeilen darüber kündigte den Fix für "wenn Lite distinct in DB" an — Lite IST distinct seit Sprint 0, aber niemand fixte den Reader.
**Fix**: Liest jetzt `User.tier`, fällt auf `isPremium` für Legacy-Rows zurück.

### 3. Mark-as-read war Theater

**Files**: `backend/src/routes/notificationsRoutes.js:64-69`, `prisma/schema.prisma`
**Symptom**: UI-Button "Mark all read" tat optisch nichts. Bell zeigte immer alles als ungelesen.
**Root Cause**: AlertEvent-Modell hatte kein `readAt`-Feld, der POST-Handler war literal:
```js
router.post('/mark-all-read', async (req, res) => {
  // TODO: persist read state once we add a NotificationRead table or read flag.
  return res.status(200).json({ ok: true });
});
```
Endpoint loggte 200 OK ohne irgendwas zu schreiben.
**Fix**:
- Migration `20260522000000_alert_event_read_at` fügt `AlertEvent.readAt DateTime?` + Index `(alertId, readAt)` hinzu
- Mark-all-read: `prisma.alertEvent.updateMany({ where: {alert:{userId}, readAt:null}, data:{readAt:new Date()} })`
- NEU: `POST /api/v1/notifications/:id/read` für per-item mark-on-click (akzeptiert beide ID-Formate: raw `42` und prefixed `alert-event-42`)

### 4. Bell-Body suchte nicht-existente Payload-Keys

**File**: `backend/src/routes/notificationsRoutes.js:38`
**Symptom**: Jede in-app Notification fiel auf generische "matched your alert criteria"-Copy zurück, obwohl Preise im DB-Payload waren.
**Root Cause**: Code suchte `payload.price ?? payload.triggerPrice ?? payload.value` — kein Evaluator emittiert irgendeinen dieser Keys. Tatsächliche Keys: `currentPrice` (price_threshold/volatility/float_tier) oder `casePrice` (case_ev).
**Fix**: Lookup auf `payload.currentPrice ?? payload.casePrice ?? payload.price`. Bonus: href bevorzugt jetzt Sprint-2 Slug-URLs statt legacy `/skins/${id}` (308 Redirect).

---

## P1 Bugs gefunden + gefixt

| # | Bug | Fix |
|---|-----|-----|
| 5 | `EMAIL_USER`/`EMAIL_PASS` fehlten silent → generischer SMTP-535-Error, kein Hinweis auf Env-Problem | Lazy-Init Transporter wirft `EMAIL_USER and EMAIL_PASS` mit klarer Message |
| 6 | Email-Body dumpte `JSON.stringify(payload)` mit internen Feldnamen (`wearMatches: true`) | `renderPayload()` rendert structured rows mit €/% Formatting |
| 7 | Email hatte nur HTML, kein Text-Alt → schlechte Deliverability | Plain-text alternative ergänzt |
| 8 | `pushAlerts`-Toggle in UI → DB-Column `User.pushAlerts` → wird NIRGENDS gelesen. Dead-loop UX. | Replaced mit "Coming soon" Badge |
| 9 | `AlertCard` zeigte nur Email-Icon, nicht `in_app` | Bell-Icon zusätzlich gerendert |
| 10 | `alerts/page.tsx` Mutations (`onToggle`, `onDelete`) warfen unhandled rejections | Sonner `toast.success/error` Wrap |
| 11 | Bell-Dropdown mark-all-read hatte `catch{}` → silent failure | Optimistic mutate + funktionierender POST + Reconciliation auf Error |
| 12 | Engine feuerte jeden Cooldown-Window wenn Preis über Threshold parkte (24h-Plateau = 24 Emails) | Edge-Trigger Dedup via `Alert.lastConditionState` |

---

## Edge-Trigger Dedup (P1 → User-Design-Call)

Vor Fix: `runAllAlerts` prüfte nur `lastTriggeredAt` (Cooldown). Ein Alert auf "Preis über €100" feuerte bei jedem Run, solange Preis über €100 war.

Nach Fix: neue Spalte `Alert.lastConditionState Boolean?`. Engine merkt sich nach jeder Evaluation, ob die Condition gerade `true` war. Feuert nur, wenn:
```
lastConditionState !== true  AND  current evaluation === true
```
→ d.h. false→true Transition. Preis muss erst wieder unter Threshold fallen und dann erneut darüber steigen, damit ein zweites Mal gefeuert wird.

Pure-function helper für Testbarkeit:
```js
export function shouldFire(lastConditionState, isTriggered) {
  return isTriggered === true && lastConditionState !== true;
}
```

Cooldown bleibt als zusätzlicher Floor erhalten (defensiv gegen rapide Oszillation um den Threshold).

User-Choice: 4 Optionen wurden angeboten (hard edge-trigger / significant-move / one-shot / not now). **Hard edge-trigger** wurde gewählt.

---

## Migration-Strategie

Die Supabase-DB hatte **9 Migrationen-Drift**: `prisma migrate status` zeigte 9 alte als "not applied", obwohl die Spalten in der DB existierten. Vermutung: Migrationen wurden früher via Supabase SQL-Console manuell eingespielt, ohne Prisma's `_prisma_migrations`-Ledger zu updaten.

**Gewählter Pfad**: Ledger reparieren statt `db push` oder neue Datenbank.

1. `prisma migrate diff --from-schema-datasource ... --to-schema-datamodel ...` verifizierte, dass die einzigen echten Schema-Diffs meine 2 neuen Migrations-Inhalte waren (plus pre-existing Drift in `APIKey`/`MarketSnapshot`-Tabellen — Out-of-Scope).
2. `prisma migrate resolve --applied <name>` für die 9 alten — markiert als "applied" ohne SQL zu rerunnen.
3. `prisma migrate deploy` für die 2 neuen → sauber angewandt.
4. `prisma generate` → Client mit neuen Feldern regeneriert.

---

## Pre-existing Drift gefunden (Out-of-Scope, dokumentiert)

`prisma migrate diff` deckte auf, dass `Prisma-Schema` ≠ `Live-DB` auch außerhalb von Notifications:
- DB hat `APIKey` + `APILog` Tables, Schema nicht (Modelle wurden im Code gelöscht, aber DB-Drop-Migration fehlt)
- `MarketSnapshot` hat in der DB `createdAt`+`updatedAt`, im Schema nicht
- Diverse Indexes im DB existieren, im Schema nicht
- `Skin.slug` UNIQUE-Constraint, `User.stripeSubscriptionId` UNIQUE-Constraint sind im Schema, aber nicht in der DB

Diese Drift ist nicht durch unsere Notification-Fixes verursacht und wurde nicht angefasst. Empfehlung: separate Aufräum-Session mit `prisma migrate dev` und sauberen Drop-Migrations.

---

## Test Coverage

### Vorher
- 16 Evaluator-Unit-Tests in `alerts.test.js` (Pure-Function Coverage)
- Kein Test für: Controller-Quote, mark-as-read, Engine-Orchestrator, Email-Delivery, AlertEvent-Erstellung

### Nachher
- **35 Unit Tests** (`alerts.test.js` + neu `notifications.test.js`):
  - `getTierFromUser` (4 Cases — Lite/Pro/Legacy/Fallback)
  - `TIER_QUOTA` correctness (1)
  - `renderPayload` (4 — Euro/Prozent/`reason`-Filter/null)
  - `sendAlertEmail` env-guard (2)
  - `notificationBody` rendering (4)
  - `shouldFire` edge-trigger (5)
- **12 Smoke Tests** (`scripts/smoke-notifications.mjs`) gegen Live-DB:
  - Engine-Run 1: false→true → AlertEvent created with `readAt=null` ✓
  - `lastConditionState=true` persistiert ✓
  - Engine-Run 2: still-true → kein Re-fire ✓
  - mark-all-read updateMany schreibt `readAt` ✓
  - Engine-Run 3: nach false-Reset → feuert wieder (re-arm) ✓

---

## Files Changed

**Backend (5 modified, 2 created):**
- `src/inngest/functions.js` — tote Import-Pfad-Korrektur
- `src/controllers/alertController.js` — `getTierFromUser` repariert, `TIER_QUOTA` exportiert
- `src/routes/notificationsRoutes.js` — komplett rewrite mit echtem mark-as-read + per-item endpoint + Slug-URLs + Logger statt console.error
- `src/services/emailService.js` — Lazy-Transporter mit Env-Guard, structured `renderPayload`, Plain-Text-Alt, dead `sendPriceAlertEmail` entfernt
- `src/services/alerts/alertEngine.js` — `shouldFire` Helper + Edge-Trigger Logik in `runAllAlerts`
- `prisma/schema.prisma` — `AlertEvent.readAt` + `Alert.lastConditionState` Felder
- NEW `prisma/migrations/20260522000000_alert_event_read_at/migration.sql`
- NEW `prisma/migrations/20260522010000_alert_last_condition_state/migration.sql`
- NEW `src/__tests__/notifications.test.js`
- NEW `scripts/smoke-notifications.mjs`

**Frontend (4 modified):**
- `src/app/profile/_tabs/NotificationsTab.tsx` — `pushAlerts` Toggle entfernt, "Coming soon" Badge
- `src/app/alerts/AlertCard.tsx` — Bell-Icon für in_app Channel
- `src/app/alerts/page.tsx` — Sonner-Toast auf onToggle/onDelete
- `src/components/NotificationsDropdown.tsx` — optimistic mark-all-read + per-item mark-on-click

---

## Was noch fehlt für Live-Status

1. **`git push origin main`** — Code-Sync zu Vercel
2. **`EMAIL_USER` + `EMAIL_PASS`** in Vercel-Env (oder Resend-Migration laut CEO-Checklist §6)
3. **Inngest Dashboard**: bestätigen dass `price-alerts-check` Function auf die aktuelle Vercel-URL pointet und aktiviert ist
4. **Smoke-Test in Production**: Test-Alert anlegen, eine Stunde warten oder Inngest manuell triggern, Email + Bell prüfen

---

## Bewusst nicht angefasst

- **Resend Migration** — größerer Sprung, CEO-Entscheidung, separat
- **Toast-Library-Konsolidierung** (3 libs simultan mounted) — Refactor across whole app
- **Web Push API** — Sprint 3 Material, braucht Service Worker
- **AlertEvent Pagination** — premature optimization
- **Pre-existing Schema-Drift** (APIKey/MarketSnapshot) — Out-of-Scope dieser Session

---

## Related Docs

- [[02-Database-Schema]] — Alert + AlertEvent Modelle dokumentiert
- [[03-Backend-API]] — `/alerts` + `/notifications` Endpoints dokumentiert
- [[06-Tech-Debt]] — Resolved Items markiert
- [[07-Sprint-Status]] — Session-Summary
- [[guides/Production-Checklist]] — Email-Env Setup
