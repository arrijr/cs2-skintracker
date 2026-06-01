# Admin-Panel-Modernisierung — Design-Spec

**Datum**: 2026-06-01
**Status**: Design genehmigt (Gerüst), Spec im Review
**Vom**: [[docs/superpowers/README|Process-MOC]] · [[00-Index|Vault-Home]]
**Verwandt**: [[06-Tech-Debt]] · [[02-Database-Schema]] · [[03-Backend-API]] · [[admin-metrics]] · [[docs/superpowers/specs/2026-05-10-job-trigger-infrastructure|Job-Trigger Infrastructure]]

---

## 1. Problem

Das Admin-Panel (`/admin`) ist zum großen Teil **nicht funktionstüchtig** und hängt featuremäßig hinter dem Rest des Produkts zurück.

### 1.1 Root Cause — verwaister Controller
`backend/src/controllers/adminController.js` (~940 Zeilen, ADM-1…ADM-15: overview, jobs, logs, coverage, user-management, feature-flags, backfill, API-health, data-quality, metrics-definitions) ist **in keinen gemounteten Router verdrahtet**. Die einzige Erwähnung von `adminController` im gesamten Code ist ein *Kommentar* in `adminRoutes.js:16`. Die exportierten Handler (`getOverview`, `getJobs`, `getCoverageOverview`, `runSkinPriceUpdate`, …) werden **nirgends importiert**.

Gemountet sind nur:
- `adminRoutes.js` → `POST /api/v1/admin/update-skin-data` (Legacy, `steamwebapi.com`)
- `adminMetricsRoutes.js` → `GET /api/v1/admin/metrics/{overview,realtime,range}` ✅ (funktioniert)

### 1.2 Was das Frontend ruft vs. was existiert

| Tab | Endpoint | Ergebnis |
|-----|----------|----------|
| Overview KPIs + Alerts | `GET /api/v1/admin/overview` | **404** |
| Jobs | `GET /api/v1/admin/jobs` | **404** |
| Logs | `GET /api/v1/admin/logs` | **404** |
| Coverage | `GET /api/v1/admin/coverage/{overview,segments,missing-skins}` | **404** |
| Controls | `POST /api/v1/admin/jobs/{skin-prices,portfolio-snapshots,alert-check}` | **404** |
| Controls | `POST /api/v1/admin/cache/steam/clear` | **404** (Handler existiert nirgends) |
| Overview „System Metrics" | `GET /api/v1/admin/metrics/overview` | ✅ funktioniert |

Effekt: Overview/Jobs/Logs/Coverage/Controls zeigen „Failed to load admin data". Nur die eingebetteten `AdminMiniMetrics` laden.

### 1.3 Zweiter Bug — Controller würde beim Verdrahten sofort werfen
`AuditLog` (siehe [[02-Database-Schema]]) hat **kein** `adminId`-Feld und **keine** `admin`-Relation. Spalte = `userId`, Relation = `user`. Aber der Controller nutzt durchgängig:
- `prisma.auditLog.create({ data: { adminId: req.user.id, … }})` → Prisma `Unknown arg adminId`
- `getLogs`: `include: { admin: { select: { email }}}` → Prisma `Unknown field admin`

→ Selbst nach dem Routing-Glue würde **jeder** Handler, der ein Audit-Log schreibt, zur Laufzeit werfen. Korrekte Referenz ist `adminMetricsRoutes.js` (`include: { user }`).

### 1.4 Weitere Stale-Stellen
- `getJobs` gibt **hardcoded Fake-Daten** zurück (`updated: 1250`, „2 hours ago") statt der echten `JobRun`-Tabelle.
- `getOverview.alerts24h` ist **fix auf `{0,0,0}`** verdrahtet (Kommentar: „would need actual alert table") — `Alert`/`AlertEvent` existieren längst.
- `getOverview` nutzt Raw-SQL `MAX(priceUpdatedAt) … FROM "Skin"`: in Postgres wird unquoted `priceUpdatedAt` zu `priceupdatedat` gefoldet → Spalte existiert nicht → Query wirft.
- `req.user.userId` in ~6 Write-Handlern (`updateUserStatus`, `updateUserEmailAlerts`, `updateUserPremiumStatus`, `updateFeatureFlag`, `executeBackfillTask`, `getBackfillHistory`) — `clerkAdminAuth` setzt aber `req.user.id`. → `adminId: undefined`.

### 1.5 „Auf dem neusten Stand" — fehlende Surfaces
Das Panel ist vor diesen Subsystemen entstanden und kennt sie nicht: Multi-Source-Pricing (Skinport/CSFloat), Notifications-Overhaul (Alert/AlertEvent/Inngest), Steam-Import, Tier-System (free/lite/pro). Der eine gemountete Schreib-Pfad (`update-skin-data`) nutzt die alte Single-Source `steamwebapi.com`.

---

## 2. Ziel & Nicht-Ziele

**Ziel**: Admin-Panel vollständig funktionstüchtig + auf den aktuellen Feature-Stand bringen, in 3 deploybaren Phasen.

**Nicht-Ziele**:
- Kein Big-Bang-Rewrite des 940-Zeilen-Controllers. Bugfix in P1; domänenweises Aufsplitten erst beim Bau der jeweiligen UI (P2/P3).
- Keine Schema-Migrationen für die Kern-Reparatur (P1). Alle nötigen Tabellen/Felder existieren bereits.
- Keine Änderung der Frontend-URLs in P1 (Endpoints existieren nur endlich; bestehende `fetchJson`-Pfade bleiben).
- Pre-existing Schema-Drift (`APIKey`/`APILog` fehlen im Prisma-Schema etc., siehe [[06-Tech-Debt]]) wird **nicht** in diesem Spec behoben — nur gemieden.

---

## 3. Architektur (Ansatz B — fokussierte Module)

Neuer Ordner `backend/src/routes/admin/`. Pro Domäne ein Express-Router, jeder unter `/api/v1/admin/*` gemountet, jeder hinter `adminLimiter` + `clerkAdminAuth`.

```
backend/src/routes/admin/
  systemRoutes.js     # GET /overview, GET /logs, GET /metrics-definitions, POST /cache/steam/clear
  jobsRoutes.js       # GET /jobs, GET /jobs/status, GET /jobs/:jobRunId,
                      # POST /jobs/{skin-prices,portfolio-snapshots,alert-check}
  coverageRoutes.js   # GET /coverage/{overview,segments,missing-skins,segment-skins}
  # P2: usersRoutes.js, flagsRoutes.js, backfillRoutes.js, healthRoutes(admin) , dataQualityRoutes.js
  # P3: pricingRoutes.js, notificationsAdminRoutes.js
```

**Mounting** (in `app.js`, Ansatz B = explizite Mounts, kein Barrel): jedes Modul wird mit `app.use("/api/v1/admin", adminLimiter, <module>)` registriert. Express erlaubt mehrere Router am selben Base-Path; jeder definiert seine eigenen Sub-Pfade. Der bestehende `adminRoutes.js` (`/update-skin-data`) und `adminMetricsRoutes.js` (`/metrics/*`) bleiben unverändert montiert.

**Controller**: `adminController.js` bleibt in P1 die Implementierung; die Route-Module importieren die jeweiligen Exports und verdrahten sie auf Pfade. Auth-Gate kommt aus dem geteilten `clerkAdminAuth` (nicht pro-Handler).

**Begründung**: matcht das bestehende Repo-Muster (jede Domäne = eigene Routes-Datei), klare Grenzen, jede spätere Phase hängt ihr Modul an, ohne bestehende anzufassen. Vgl. [[CONVENTIONS]] (kleine, klar abgegrenzte Units).

---

## 4. Phase 1 — Reparieren (detailliert)

Ziel: Overview/Jobs/Logs/Coverage/Controls laufen mit **echten** Daten.

### 4.1 Routing
1. `routes/admin/systemRoutes.js`, `jobsRoutes.js`, `coverageRoutes.js` anlegen, Controller-Exports verdrahten (Pfade exakt wie in §1.2, damit Frontend unverändert bleibt).
2. In `app.js` die drei Module unter `/api/v1/admin` mounten (hinter `adminLimiter`).
3. **Neuer Handler** `clearSteamCache` (`POST /cache/steam/clear`): leert den In-Memory-Cache von `steamInventoryClient.js`. Dazu in `steamInventoryClient.js` eine `clearCache()`-Funktion exportieren (Map leeren) und im Handler aufrufen. Audit-Log schreiben. Production-Write-Gate **nicht** nötig (read-only Cache-Invalidierung), aber Admin-Gate ja.

### 4.2 Bugfixes in `adminController.js`
- **Audit-Log-Feld**: alle `prisma.auditLog.create({ data: { adminId: … }})` → `userId: …`. (Mehrfach: getOverview, getJobs, getLogs, runSkinPriceUpdate, runPortfolioSnapshot, runAlertCheck.)
- **Audit-Log-Relation**: `getLogs` `include: { admin: { select: { email }}}` → `include: { user: { select: { email }}}`. Frontend normalisiert bereits `l.user ?? l.admin` — bleibt kompatibel.
- **Auth-Feld**: `req.user.userId` → `req.user.id` in allen Write-Handlern (auch den P2-Handlern gleich miterledigt).
- **`getJobs` → echte Daten**: Fake-Array ersetzen durch Query über `JobRun`: letzter Run je `jobName` (`distinct`/`groupBy` + `orderBy startedAt desc`), Felder `name=jobName`, `lastRun=startedAt`, `status`, `duration` aus `completedAt - startedAt` (laufend → „running"), `resultCounts` aus `{updated:updatedCount, inserted:insertedCount, failed:failedCount}`. Shape exakt passend zum Frontend-Interface `AdminJob`.
- **`getOverview.alerts24h` → echte Daten**: siehe §4.3 (offene Entscheidung).
- **`getOverview` Raw-SQL → Prisma-Aggregate**:
  - `lastPriceUpdate` = `prisma.skin.aggregate({ _max: { priceUpdatedAt: true }})`
  - `pricesWritten24h` = `prisma.skin.count({ where: { priceUpdatedAt: { gte: now-24h }}})`
  - `priceCoverage` = `pricesWritten24h / prisma.skin.count()` × 100, gerundet
  - eliminiert Quoting/Drift-Risiko komplett.

### 4.3 Offene Produktentscheidung (User-Input, 5–10 Zeilen)
Zwei Stellen brauchen Produkt-Judgment, kein Code-Default:

**(a) `alerts24h`-Semantik** — was zählt als „checked / sent / skipped"?
- Vorschlag: `sent` = `AlertEvent` mit `triggeredAt >= now-24h` und `delivered` non-empty; `failed` = `failed` non-empty; `checked` = aktive `Alert`-Zahl (Proxy, da kein per-Check-Log existiert). Alternative Definitionen möglich.

**(b) Job-Gesundheit** — Schwellen für `healthy / warning / error` pro Cron-Job (Staleness). Beispiel: Preis-Update >26h = warning, >50h = error; Alert-Check >2h = warning. Wird als `jobHealth(jobName, lastRun)`-Helper vorbereitet; User füllt die Schwellen. Speist die `system.health.cron`-Anzeige + ein neues Health-Feld pro Job.

Beide werden als vorbereitete Funktionssignaturen mit `// TODO(user)` angelegt; Implementierung im Pairing.

### 4.4 Frontend
Erwartet minimal Änderung — die Seite rendert die Tabs bereits. Sobald die Endpoints die im Frontend-Interface erwarteten Shapes liefern (`AdminOverview`, `AdminJob`, `AdminLog`, `CoverageOverview`, `SegmentCoverage`, `MissingSkin`), funktioniert die Seite. Falls `getJobs`/`getOverview` minimal abweichen → Shape im Controller angleichen (nicht im Frontend), damit P1 frontend-frei bleibt.

### 4.5 Tests
- `backend/src/__tests__/adminRoutes.test.js` (Jest, `cross-env NODE_OPTIONS=--experimental-vm-modules`):
  - Auth-Gate: ohne Token → 401; Nicht-Admin → 403.
  - `GET /overview` liefert Shape mit echten Aggregaten (gegen Test-DB/Seed).
  - `GET /jobs` liefert `JobRun`-abgeleitete Einträge (Seed 1–2 JobRuns).
  - `GET /logs` enthält `user.email` (Relation-Fix verifiziert).
  - `POST /cache/steam/clear` → 200 + Cache geleert.
  - Production-Write-Gate: `NODE_ENV=production` ohne `ALLOW_ADMIN_WRITES_IN_PROD` → 403 auf Job-POSTs.
- Regression: ein Test, der sicherstellt, dass `auditLog.create` mit `userId` (nicht `adminId`) aufgerufen wird (kein Prisma-Throw).

### 4.6 Verifikation
Vor „fertig": die neuen Queries gegen **Live-Supabase** (MCP) gegenprüfen — bestätigt Spalten/Relationen real existieren und der dokumentierte Drift ([[06-Tech-Debt]]) keine der P1-Queries trifft. Danach `/admin` lokal laden und alle 5 Tabs gegen echte Daten sichten.

---

## 5. Phase 2 — Verstecktes freischalten (Outline)

Bereits **vollständig gebaute** Services sichtbar machen (Backend existiert, v.a. Routing + UI nötig):

| ADM | Service | Neue Route-Modul | Frontend-Tab |
|-----|---------|------------------|--------------|
| 13 | `UserManagementService` | `usersRoutes.js` | Users (Suche, Detail, Status/Tier/Email-Alerts setzen) |
| 14 | `FeatureFlagsService` | `flagsRoutes.js` | Feature-Flags (Liste, Toggle, Validierung, Rollout) |
| 15 | `BackfillService` | `backfillRoutes.js` | Backfill (Data-Gaps, priorisierte Tasks, Verlauf) |
| 10 | `APIHealthService` | in `systemRoutes` | Health (24h/7d-Metriken, Time-Series, Job-Runs) |
| 11 | `DataQualityService` | `dataQualityRoutes.js` | Data-Quality (Alerts-Liste, Checks ausführen) |

Querschnitt: `updateUserPremiumStatus` setzt künftig **auch** `User.tier` (free/lite/pro), nicht nur `isPremium` — fixt die im Notifications-Audit gefundene tier/isPremium-Drift ([[2026-05-22-notifications-audit-fix]]). Production-Write-Gate auf allen Mutationen. Audit-Log pro Aktion.

---

## 6. Phase 3 — Neue Surfaces (Outline)

Surfaces für seit dem Panel dazugekommene Systeme:

- **Pricing-Health**: `MarketSnapshot` nach `source` (skinport/csfloat/steam) × Tag aggregieren → „welche Quelle hat wann wie viele Rows geliefert", letzte Aktualisierung je Quelle, Lücken. Optional Cache-Stats des `multiSourceAggregator`.
- **Notifications/Inngest**: `AlertEvent`-Throughput (gesendet/gelesen/failed über Zeit), letzte Cron-Läufe aus `JobRun` (`price-alerts-check` etc.), Inngest-Funktionsstatus soweit abfragbar.
- **Steam-Import**: `JobRun` mit `jobName = "steam_skin_import"` + Anzahl User mit `steamId` + importierte Portfolio-Rows (`importedFromSteamAt`). Verknüpft mit dem prod-Datacenter-IP-Risiko ([[2026-05-31-steam-inventory-datacenter-ip-block]]).
- **Tier-Verwaltung**: `User.tier`-Verteilung (free/lite/pro), promote/demote-Aktion mit **Stripe-Caveat** (manuelles Setzen umgeht Stripe — nur für Support/Testing, deutlich gewarnt + auditgeloggt).
- **Legacy-Kennzeichnung**: `update-skin-data` (steamwebapi) als Legacy markieren bzw. auf Multi-Source umlenken.

---

## 7. Querschnittsbelange

- **Auth**: einheitlich `req.user.id` (aus `clerkAdminAuth`). `req.auth?.userId` vs `req.userId`-Inkonsistenz ([[06-Tech-Debt]]) wird im Admin-Bereich nicht eingeschleppt.
- **Production-Write-Safety**: bestehendes `ALLOW_ADMIN_WRITES_IN_PROD`-Gate bleibt auf allen schreibenden Operationen.
- **Audit-Logging**: jede Admin-Aktion schreibt `AuditLog` mit korrektem `userId`.
- **Rate-Limiting**: `adminLimiter` (50/15min) bleibt vor allen Admin-Routen.
- **Doku**: dieser Spec + späterer Implementation-Plan als Obsidian-Notes unter `docs/`, verlinkt von [[docs/superpowers/README|Process-MOC]] + [[00-Index]] ([[CONVENTIONS]]).

---

## 8. Risiken & Mitigation

| Risiko | Mitigation |
|--------|------------|
| Service-Interfaces (`JobService`, `CoverageService` …) weichen von Controller-Annahmen ab | P1 berührt nur `getJobs`/`getOverview` (self-contained Queries) + Routing; Service-abhängige Handler (Job-POSTs) gegen echte Service-Signaturen prüfen, bevor verdrahtet |
| Schema-Drift trifft eine Query | §4.6 Live-DB-Verifikation vor Done; Raw-SQL durch Prisma ersetzt |
| Frontend-Shape-Mismatch | Shapes im Controller an Frontend-Interfaces angleichen (P1 frontend-frei) |
| Prod-Sicherheit beim Freischalten von User-/Tier-Mutation (P2/P3) | Write-Gate + Audit + explizite UI-Warnungen |

---

## 9. Reihenfolge

1. **P1** (Fundament) — blockiert P2/P3, daher zuerst. Eigener Implementation-Plan via writing-plans.
2. **P2** — nach P1-Merge.
3. **P3** — nach P2-Merge.

Jede Phase: Plan → Implementierung (TDD wo sinnvoll) → Review → Merge → Obsidian-Update.
