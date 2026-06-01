---
date: 2026-06-01
type: session
topic: Steam inventory import fixes + full current-price & history overhaul
tags: [session, steam, import, pricing, skinport, history, eur, edge-function, pg-cron]
---

# Steam Import + Pricing/History Overhaul (2026-06-01)

> Verwandt: [[2026-05-31-steam-inventory-datacenter-ip-block]] · [[2026-05-30-price-pipeline-fix]] · [[06-Tech-Debt]] · [[03-Backend-API]] · [[08-Environments]]
> Memory (`.claude/`, nicht im Vault): `project-steam-import-gotchas`, `project-pricing-architecture`.

## TL;DR
Steam-Import lief end-to-end durch (78 Skins importiert), aber dabei kamen mehrere echte Bugs hoch. Danach: kompletter Preis-Overhaul — Katalog-Coverage von **710 → 9.600 gepreiste Skins** (4% → 57%), History für **10.360 Skins** (vorher 3.270) + täglicher Auto-Refresh. Alles mit Live-DB verifiziert.

## 1. Steam-Import — 3 Fixes
- **Connect ≠ Import + privates Inventar.** Verbinden schreibt nur `steamId`; Skins entstehen erst beim expliziten Import. Profil public ≠ Inventar public (403). `ImportPreviewModal` zeigt jetzt eine geführte Privacy-Karte mit Deep-Link statt rotem Rohtext; `SteamConnectSection` öffnet das Import-Modal nach Connect automatisch. Details: [[2026-05-31-steam-inventory-datacenter-ip-block]].
- **Import-500 (`buyPrice`).** Der Importer schrieb `buyPrice: null`, aber `Portfolio.buyPrice` ist `NOT NULL` → Prisma-Fehler „Argument `user` is missing" (irreführend). Fix: Importer/Resync schreiben `0` (Sentinel „cost basis not set"); die Portfolio-Summary behandelt 0 invested bereits als 0% P&L. Kein Nullable-Migration nötig.
- **Radio-Auswahl unsichtbar** (Dark-Theme native radio) → `accent-pink-500` + markierte Zeile.
- Erstausstattung: **Frontend-Test-Harness** (vitest + RTL) angelegt — 7 Tests für Privacy-Guard + Auto-Prompt.

## 2. Aktuelle Preise — Root Cause + Fix
**Ursache:** Einzige aktive Quelle war der Steam-Per-Item-Refresh (3s/Call, Cap 2000/Run) → nach Monaten nur 710/16.829 gepreist. Der **Skinport-Bulk-Backfill** (1 HTTP-Call für den ganzen Katalog) war in `cron/index.js` **auskommentiert** ("Zukunftsmusik") und schrieb `priceLatest` gar nicht.

**Fix (`7bf3140` auf main):**
- `skinportBulkBackfill` schreibt jetzt `Skin.priceLatest` in **EUR** (cheapest live ask = `min_price`; Fallback `suggested_price` nur bei `quantity>0`; illiquide Zero-Listing-Items übersprungen — Skinports `suggested_price` für ungelistete Items ist teils absurd, z.B. €3926).
- **Node-18-Brotli-Fix:** Render läuft Node 18 (`Dockerfile`), dessen undici Brotli NICHT auto-dekomprimiert; Skinport verlangt `Accept-Encoding: br`. Manuelles `zlib.brotliDecompressSync` mit `res.json()`-Fallback (Test-Mocks bleiben grün).
- Skinport-Cron aktiviert (04:00 UTC) + On-Boot-One-Shot bei niedriger Coverage.

**Währung:** Die ganze App ist **EUR** (Steam-Scrape `currency=3`, Frontend `num.ts`/`CurrencyContext` EUR-nativ, kein USD→EUR-Converter). NIE mit FX multiplizieren.

## 3. Reliabler täglicher Refresh — Supabase statt Render
Renders Boot-Run-Fetch schlug still fehl (Datacenter-Egress, keine Logs einsehbar). Durabler Pfad: **`pg_cron`-Job `refresh-skinport-prices` (03:45 UTC) → `pg_net.http_post` → Edge-Function** (Deno holt Skinport mit nativem Brotli, schreibt per direkter Postgres-Connection `SUPABASE_DB_URL`). Manuell getestet: **HTTP 200, 8.951 Skins aktualisiert.** (Hinweis: `supabase-js .rpc` warf „permission denied for schema public" → direkte PG-Connection nutzen.)

## 4. Price-History
**Rückwirkende** Tagespreise sind aus KEINER kostenlosen Quelle holbar (Steam-pricehistory auth-gated, Skinport `/v1/sales/history` nur 4 Rolling-Buckets, CSFloat 403 anonym, echte Daily-History nur paid). **Vorwärts:** `dailySkinPriceHistory` (07:00 UTC, Render node-cron, läuft) schreibt 1 `PriceHistory(skinId,date,price)`-Zeile/Tag für jeden Skin mit `priceLatest>0`. Am 2026-06-01 heutigen Punkt für alle gepreisten Skins geseedet → History-Coverage 3.270 → **10.360 Skins**. Key `setHours(0,0,0,0)` = Mitternacht UTC (DB-tz = UTC) → keine Doppel-Zeilen.

## 5. Multi-Source `$`/EUR-Bug (`55e2d3a` auf main)
`/skins`-Multi-Source-Tabelle zeigte aufgeblähte USD: `parseSkinportItems` rechnete `×1.08`, `multiSourceAggregator` `×1.13` „Steam-Fee" (falsch — Steams gelisteter Preis IST der Käuferpreis). Fix: alles EUR (`askEur`/`priceEur`), Tabelle rendert €, redundante „After fees"-Spalte raus. 8 Tests grün.

## Verifikation (Live-DB)
| Metrik | Wert |
|--------|------|
| Katalog gepreist | 9.600 / 16.829 (57%) |
| Portfolio (User 1) | 78/78, €467 |
| Skins mit History | 10.360 |
| Daily-Refresh-Cron | getestet 200 / 8.951 |

## Tech-Debt / Follow-ups (→ [[06-Tech-Debt]])
- **57% Coverage-Ceiling** der kostenlosen Skinport-Quelle: No-Wear-Basiszeilen (Skinport listet per-wear), StatTrak/Handschuh-Varianten, illiquide Items. Höher nur via Wear-Aggregation oder bezahlter Quelle.
- **CSFloat-Client kaputt** — 403 anonym, braucht jetzt Auth/Key. Im `multiSourceAggregator` kommentiert (USD→EUR konvertieren falls reaktiviert).
- **Render-Skinport-Cron** jetzt redundant zum Supabase-Cron (harmlos, idempotent).
- Einmal-Edge-Function `populate-skinport-prices` neutralisiert (410) — im Supabase-Dashboard löschbar.
- Render-Boot-Run-Fetch-Fehler nie mit Logs bestätigt (kein Render-MCP).

## Git
main: `7bf3140` (Skinport-Backfill enable + Node-18-br + boot-run) · `55e2d3a` (Multi-Source EUR). Frontend-Steam-Fixes: `0f918f0`/`3ef49be`/`61606e4`/`9abbe77`. Deploys via isolierte Worktrees (User arbeitete parallel auf Feature-Branches).
