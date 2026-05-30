---
date: 2026-05-30
type: session-log
status: in-progress
topic: price-data pipeline diagnosis + fix
tags: [session, pricing, pg_cron, render, supabase, charts]
---

# Price-Data Pipeline Fix — 2026-05-30

> Diagnose + Fix warum (a) Wear-Varianten gleiche Preise zeigten und (b) das
> Liniendiagramm seit 22.05. keine neuen Punkte mehr bekam. CEO-Mode Session.
> Verwandt: [[2026-05-22-ceo-autonomous-audit]], [[06-Tech-Debt]], [[docs/ops/README|Ops-MOC]].

## Symptome (vom User gemeldet)
1. Manche Skins zeigen über alle Wear-Stufen denselben Preis.
2. Preise werden nicht mehr ins Liniendiagramm getrackt — Charts enden am 22.05.

## Root-Cause-Analyse (verifiziert, nicht geraten)

**Beweis via SQL** (`PriceHistory` rows/Tag):

| Tag | rows |
|-----|------|
| 21.05. | 2982 ← manueller Backfill |
| 22.05. | 2993 ← manueller Backfill |
| 23.–29.05. | **10–29/Tag** |

Erwartung war ~2000/Tag. Tatsächlich ~25-30/Tag = **genau 1 Inngest-Chunk (8 Skins) × 4 Crons**.

**Warum:** Der `priceRefresh` lief auf **Inngest** (4×/Tag → HTTP-Callback an `/api/inngest` auf Render). Render **Free-Tier schläft zwischen den `step.run()`-Calls ein** → der nächste Step-Request trifft auf Cold-Start-Timeout → Function bricht nach ~1 Chunk ab.

- Verifiziert dass Inngest selbst korrekt konfiguriert ist: `/api/inngest` liefert **401** (nicht 503) → `INNGEST_SIGNING_KEY` ist gesetzt, Handler gemountet. Nadelöhr = Render-Execution-Layer, nicht der Orchestrator.

**Wear-Duplikate:** 2391 Wear-Varianten hatten `priceLatest` aus dem Katalog-Seed (Parent-Preis auf alle 5 Wears kopiert) aber `priceUpdatedAt = NULL` → nie individuell refresht.

## Fixes (was wirklich passiert ist)

### 1. Wear-Duplikate genullt (Supabase MCP, SQL)
2391 Rows mit `variantOf IS NOT NULL AND priceUpdatedAt IS NULL` → `priceLatest = NULL`.
Frontend zeigt jetzt `—` statt falscher Duplikate bis echte Per-Wear-Preise kommen.

### 2. Fake-Chart-Generator entfernt
`backend/src/controllers/skinController.js` `getPriceHistory` generierte bei leerer
History `Math.random()`-basierte Fake-Daten → Chart sah befüllt aus mit erfundenen
Preisen. 70 Zeilen ersetzt durch ehrliche leere Antwort (`source: 'none'`).

### 3. pg_cron für den täglichen Snapshot (Supabase MCP) — **autonom, kein Render/GH/Inngest**
`CREATE EXTENSION pg_cron` + 2 Jobs:
- `daily-skin-price-snapshot` — 06:30 UTC, `INSERT INTO PriceHistory SELECT priceLatest FROM Skin … ON CONFLICT DO UPDATE`
- `daily-case-price-snapshot` — 06:35 UTC, analog für `CasePriceHistory`

Ersetzt die kaputte Render/Inngest `dailySkinPriceHistory` Cron. Läuft komplett in Postgres.
**Wichtige Grenze:** kopiert nur `priceLatest` → braucht frische Werte um keine flache Linie zu zeigen.

### 4. Hybrid-Refresh Top-147 populäre Skins (curl + MCP)
Wie der Case-Backfill: `curl` holt Steam-Market-Preise, MCP schreibt `priceLatest` +
`priceUpdatedAt` + heutiger `PriceHistory`-Punkt. Bewiesen distinct: MP9 Airlock
FN $44.13 / FT $13.97 / MW $13.85 / WW $13.64 / BS $12.10 (vorher alle gleich).

### 5. GitHub-Actions-Workflow für recurring Steam-Fetch (committed, BLOCKED auf Secret)
`.github/workflows/scheduled-price-refresh.yml` — 2×/Tag `run-job.js price-refresh` direkt
gegen Supabase (GH-Runner schlafen nicht ein, 6h Laufzeit, free auf public repo).
**Erster Run failte:** Prisma `P1001 unreachable` — `DATABASE_URL` GH-Secret zeigt auf die
**direkte** Verbindung (`db.<ref>.supabase.co:5432`), die Supabase auf **IPv6-only** umgestellt
hat. GH-Runner sind IPv4 → unreachable. Render funktioniert weil es die **Pooler**-URL nutzt.
→ **CEO-Aktion:** `DATABASE_URL` Secret auf Session-Pooler-URL umstellen
(`aws-0-eu-central-1.pooler.supabase.com:5432`), dann Workflow re-triggern.

## Liquiditäts-Realität (wichtiges Finding)
Nur **~697 von 16,829 Skins** geben überhaupt einen Steam-Market-Preis zurück. Der Rest sind
base-names ohne Wear ODER Skins mit 0 Markt-Volumen (Steam liefert nichts). "96% leer" ist
**nicht komplett fixbar** — die erreichbare Menge ist die liquide Teilmenge.

## Verifikation (end-to-end)
`GET /api/v1/skins/23290/history` → `source: database`, Punkte 22.05. $44.17 → 30.05. $44.13.
Echte DB-Daten, kein Fake mehr.

## Offen
- [ ] **CEO:** `DATABASE_URL` GH-Secret → Pooler-URL (entsperrt 2000 Skins/Tag automatisch).
- [ ] Nach Secret-Fix: Inngest `priceRefresh` deaktivieren (redundant zu GH Actions).
- [ ] Stray gitlink `.claude/worktrees/cranky-wilson-bb64cf` ohne `.gitmodules` → cleanup.
- [ ] commit `230f9b7` bumpte Inngest chunk 8→20 (band-aid, jetzt durch GH-Actions abgelöst).
