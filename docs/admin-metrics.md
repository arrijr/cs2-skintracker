Admin Metrics — Definitions & Rules

Scope
Read-only Kennzahlen für Admin UI (Overview, Coverage, API Health, Data Quality).
Berechnungen laufen in UTC; Anzeige kann in der User-Timezone erfolgen.

Time Windows (defaults)

24h = now − 24 h

7d = now − 7 Tage

30d = now − 30 Tage

90d = now − 90 Tage

Stale Threshold = 48 h

Coverage Window = 7 Tage (konfigurierbar)

Data Sources

Skin – Stammdaten / letzte bekannte Preise (priceAvg, lastPriceAt falls vorhanden)

PriceHistory – Zeitreihe pro Skin (date, price)

PortfolioHistory – tägliche Portfolio-Snapshots pro User (date, value)

Watchlist, Transaction – optional für Zähler/Flows

JobRun – Ergebnisse der Cron-Jobs (counts, duration, status)

AuditLog – Admin-Aktionen (für „resolve/note“)

Coverage & Freshness

Price Coverage %

Anteil der Skins mit „frischem“ Preis im Coverage-Window.
Formula:
coverage = skins_with(lastPriceAt >= now-7d AND priceAvg NOT NULL) / total_skins * 100

Freshness (Median age)

Median der Zeitdifferenz now - lastPriceAt über alle Skins mit Preis.

Stale %

Anteil der Skins, deren letzter Preis älter als 48 h ist.
stale = skins_with(lastPriceAt < now-48h) / skins_with_any_price * 100

Skins without history (30d)

count(distinct skinId) WHERE no PriceHistory entries in last 30d

Fallbacks: Wenn lastPriceAt nicht gepflegt ist, nutze MAX(PriceHistory.date).

Price Update / Jobs

Last Price Update (timestamp)

MAX(PriceHistory.date) oder jüngster JobRun der Preis-Pipelines.

Prices written (24h)

count(PriceHistory WHERE date >= now-24h)

Job Status (per Cron)

lastRunAt, duration, status (ok/failed), counts (z. B. updated, failed, skipped)

Portfolio KPIs (Admin Overview)

Total Portfolio Value ($)

Σ (letzter Preis je Skin × gehaltene Menge) über das Portfolio eines Users / aggregiert.

Change 24h / 7d (%)

(Value_t − Value_ref) / Value_ref * 100, mit Value_ref von t-24h bzw. t-7d.
Hinweis: Falls Value_ref = 0 → „—“.

Portfolio Snapshot last run

MAX(PortfolioHistory.date) pro User bzw. global.

Alerts

Alerts checked (24h)

Aus JobRun.counts.checked der Alert-Pipelines, Summe 24 h.

Alerts sent (24h)

JobRun.counts.sent (E-Mail/Push).

Alerts skipped (24h)

JobRun.counts.skipped (z. B. Opt-out, Cooldown, Bedingung nicht erfüllt).

Alert Throughput % (24h vs 7d-Median)

checked_24h / median(checked_per_day_last_7d) * 100 (nur Info-Karte).

External API Health

Success Rate (24h)

successful_requests / total_requests * 100

4xx / 5xx / 429 (24h)

Zähler der jeweiligen Klassen (Rate-Limit = 429).

Latency p50 / p95 (24h / 7d)

Perzentile der Request-Latenzen (ms), aus JobRun/Log-Aggregaten.

Allocation & Movers (Portfolio)

Allocation by Segment

weight_i = positionValue_i / totalValue * 100
Segment = Weapon Type (Default) / Rarity / Wear.
Nullpreise: Entweder ausschließen oder letzten verfügbaren Preis verwenden – Entscheidung in der UI dokumentieren.

Top Movers (24h)

Für Holdings des Users:
return_24h = (price_now − price_24h_ago) / price_24h_ago * 100
Zeige Top-3 Gainer/Loser (nur mit beiden Zeitpunkten verfügbar).

Risk & Analytics (optional / flagged)

Volatility (30d)

StdDev der täglichen Renditen r_t = Value_t / Value_{t-1} − 1 über 30 Tage.
Anzeige nicht annualisiert (reine 30d-Volatility).
Min. Beobachtungen: ≥ 15; sonst „Not enough data“.

Max Drawdown (90d)

Größter relativer Peak-to-Trough-Rückgang in den letzten 90 Tagen.
MDD = min_{t} (Value_t / max_{τ≤t} Value_τ − 1) * 100

Contribution % (Range)

Beitrag jeder Position zur Gesamt-Δ im gewählten Zeitraum.
Nahelegung:
contrib_i ≈ weight_avg_i * return_i
oder exakter:
(Value_i_end − Value_i_start − flows_i) / (Value_total_end − Value_total_start − flows_total) * 100
Flows (Käufe/Verkäufe) ignorieren, wenn nicht belastbar → UI kennzeichnen.

Formatting & Edge Rules

Währung: $ mit 2 Dezimalstellen; große Zahlen mit Tausendertrennzeichen.

Prozent: mit Vorzeichen, 2 Dezimalstellen; null-safe (bei 0/0 → „—“).

Zeit: Anzeige in User-Timezone; Berechnung in UTC.

Null/fehlende Daten: klar als „—“/„Not enough data“ zeigen (keine stillen 0).

Stale-Badges: Preis älter als 48 h.

Low-Coverage Segment: Coverage < 95 %.

Feature Flags (relevant)

ADMIN_COVERAGE_EXPLORER – Coverage Explorer (Preview ON, Prod OFF)

ADMIN_API_HEALTH – API Health (Preview ON, Prod ON/read-only)

ADMIN_DQ_ALERTS – Data Quality Alerts (Preview ON; Prod read-only, Aktionen via ENV)

PORTFOLIO_INSIGHTS, PORTFOLIO_TRANSACTIONS, PORTFOLIO_ALLOCATION_FILTER, PORTFOLIO_LASTUPDATED_CHIP

Validation Checklist (for QA)

Formeln liefern gleiche Werte bei Reload & in unterschiedlichen Views (KPI ↔ Chart).

Graceful Fallbacks bei leeren/mangelnden Daten.

Zeitfenster-Umschalter (24h/7d/30d/90d) aktualisiert alle abhängigen Kacheln konsistent.

Keine Full-Table-Scans: Pagination/Limits bei großen Tabellen.

Keine PII/Secrets in UI oder Logs.