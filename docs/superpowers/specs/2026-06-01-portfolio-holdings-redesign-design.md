---
title: Portfolio Holdings Redesign — Grouped Card Grid
date: 2026-06-01
status: Draft — awaiting user review
type: design-spec
scope: frontend-only
area: Portfolio
---

# Portfolio Holdings Redesign — Grouped Card Grid

> **Brainstorm-Ergebnis.** Ersetzt die flache Karten-Liste in
> [[05-Frontend-Components|PortfolioTable]] durch ein gruppiertes, gefiltertes
> Card-Grid. Verlinkt von [[00-Index]] · [[docs/features/README|Features-MOC]].

## 1. Problem

Heutige Holdings-Ansicht (`frontend/src/app/portfolio/PortfolioTable.tsx`) ist eine
**flache Liste** aus `bg-zinc-900`-Karten, eine pro Skin. Bei großen Steam-Importen:

- **Unübersichtlich**: Endlos-Scroll, keine Struktur, alles gleich gewichtet — ein
  €0-Item nimmt so viel Platz wie ein €550-Messer.
- **Sieht nicht gut aus**: `zinc`-Schwarz statt dem `slate-900/50` + `rounded-2xl`
  System des restlichen Portfolios. Bricht visuell aus der Seite aus.
- **Müll dominiert**: Viele Items haben `marketPrice == null` → „Market —", „0.0%".
  Diese Zeilen füllen den Screen, tragen aber nichts bei.

## 2. Ziele / Nicht-Ziele

**Ziele**
- Große Inventare (Zielgröße **50–200 Skins**) bleiben übersichtlich.
- Visuell konsistent mit dem Rest der Seite (Design-Tokens, slate/rounded-2xl,
  purple→pink Akzent).
- Wichtiges zuerst: Positions-**Wert** und **P/L** sofort scanbar.
- Items ohne Marktpreis verschwinden aus der Hauptansicht, ohne gelöscht zu werden.

**Nicht-Ziele**
- Kein Backend-/API-/DB-Change. Alle Daten kommen bereits aus
  `useAuthenticatedPortfolio` (jede Entry hat `amount`, `avgPrice`, `purchases[]`,
  `skin.{marketPrice, weaponType, weaponSlug, rarity, wear, name, …}`).
- Keine Virtualisierung (bei ≤200 Karten unnötig; gruppiertes + einklappbares
  Rendering reicht). Falls später 1000+ → eigener Folge-Task.
- Watchlist-Tab bleibt unberührt.

## 3. Gewählte Richtung (vom User bestätigt)

**Direction C — Refined Card Grid**, kombiniert mit **Gruppen + Filtern**.
Mockup: `.superpowers/brainstorm/.../mockup-c-refined.html`.

## 4. Architektur / Komponenten

`PortfolioTable.tsx` wird vom Monolith (385 Zeilen) zu einem Orchestrator, der
reine Helfer + fokussierte Sub-Komponenten zusammensetzt:

| Unit | Datei | Zweck | Abhängigkeiten |
|------|-------|-------|----------------|
| `groupPortfolio()` + Helfer | `frontend/src/lib/portfolio-grouping.ts` | **Reine Funktionen**: Gruppieren nach Waffe, Aggregation (Gruppen-Wert, Gruppen-P/L), no-price-Bucket, Sortierung von Gruppen + Items, Filter anwenden. Voll unit-testbar. | keine (pure) |
| `PortfolioTable` | bestehend, umgebaut | State (search, sort, filter, collapse-map), ruft Helfer, rendert Toolbar + Gruppen. | grouping-Helfer, Sub-Komponenten |
| `PortfolioToolbar` | `frontend/src/app/portfolio/_components/PortfolioToolbar.tsx` | Suche + Sort-Select + Rarity/Wear-Select + Waffen-Filter-Chips + „no-price"-Toggle. | — |
| `PortfolioGroup` | `frontend/src/app/portfolio/_components/PortfolioGroup.tsx` | Einklappbare Sektion: Header (Icon, Name, Count, Subtotal, Gruppen-P/L) + Grid-Body. | `PortfolioSkinCard` |
| `PortfolioSkinCard` | `frontend/src/app/portfolio/_components/PortfolioSkinCard.tsx` | Eine Karte; klick → öffnet Lots inline (full-width). Hält Badge-Logik (Alert/Stale/Link). | `PurchaseAccordion` (bestehend) |

`PurchaseAccordion` wird **wiederverwendet** (edit/add/delete der Lots), nicht neu gebaut.

## 5. Daten & Aggregation (Formeln)

Pro Entry:
- `positionValue = (marketPrice ?? 0) × amount`
- `costBasis = avgPrice × amount`
- `pl% = marketPrice != null && costBasis > 0 ? (marketPrice − avgPrice)/avgPrice × 100 : null`
- `hasPrice = typeof marketPrice === 'number'`

Pro Gruppe (nur `hasPrice`-Items zählen in Wert & P/L):
- `groupValue = Σ positionValue`
- `groupCost  = Σ costBasis (nur hasPrice)`
- `groupPL%   = groupCost > 0 ? (groupValue − groupCost)/groupCost × 100 : null`

Gewichts-Balken pro Karte: `positionValue / maxPositionValueImPortfolio` (0–100%).

## 6. Gruppierung

- **Gruppen-Key**: `skin.weaponSlug` falls vorhanden, sonst aus `name` geparst
  (Teil vor `|`, führendes `★ ` entfernt → „AK-47", „Bayonet", „AWP", „AUG").
  Fallback „Other" wenn nichts greift.
- **No-price-Bucket**: alle Items mit `marketPrice == null` → eine Sammelgruppe
  **„No market price"** ganz unten, **aus P/L ausgeschlossen**, default eingeklappt.
- **Gruppen-Reihenfolge**: nach `groupValue` desc (wertvollste Waffe oben);
  no-price-Bucket immer zuletzt.
- **Item-Reihenfolge** in der Gruppe: folgt dem globalen Sort (default: Wert desc).

## 7. Karte (Anatomie)

```
[thumb 34] Name (truncate, Link→Detail)            [qty „2×"]
WERT 550,44 €  [P/L-Pill −5.2%]            ← Hero-Zeile
Avg 290,38 · Market 275,22                  ← Subzeile (muted)
[■■■■■□□□□] Gewichts-Balken
```
- Alert-Bell (wenn Watchlist-Alert), Stale-Badge (>48h), Link auf Name bleiben
  wie heute erhalten.
- Klick irgendwo auf Karte (außer Name-Link) → Lots öffnen inline; die offene
  Karte spannt `grid-column: 1 / -1`. `PurchaseAccordion` darunter.

## 8. Toolbar / Filter

- **Suche** (bestehend), **Sort-Select** (bestehend: Value/Name/Performance/Recent/Weight — neu default „Value").
- **Waffen-Filter-Chips**: „All" + je Waffe (Count); single-select, scrollbar auf Mobile.
- **Rarity- + Wear-Select**: optionale Eingrenzung (kombinierbar mit Chips + Suche).
- **„Hide no-price"-Toggle**: default **aus** → Bucket bleibt sichtbar (eingeklappt);
  **an** → no-price-Bucket komplett ausgeblendet.
- Bestehender `activeFilter`-Prop (von der Allocation-Chart) bleibt unterstützt und
  setzt initial die Chips.

## 9. Persistenz (localStorage)

- `portfolio-sort` (bestehend) — behalten.
- `portfolio-group-collapsed` — Map `{ [groupKey]: boolean }`, gemerkt.
- `portfolio-hide-noprice` — bool.

## 10. States

- **Leer** / **gefiltert-leer**: bestehende Empty-States behalten (an Toolbar-Logik
  angepasst).
- **Eine Gruppe**: wenn nach Filter nur 1 Waffe übrig → Gruppen-Header trotzdem
  zeigen (Konsistenz), aber default expanded.

## 11. Responsive & A11y

- Grid: `1` Spalte (mobile) → `2` (`sm`/`lg`) → `3` (`xl`). (Default-Entscheidung, s.u.)
- Gruppen-Header: echtes `<button>`, `aria-expanded`, Tastatur (Enter/Space) — wie
  heute beim Karten-Header.
- Karten klickbar mit `role/tabindex` + Fokus-Ring (bestehendes Muster übernehmen).
- Farben über `@/lib/design-tokens` statt Hardcode; `formatEUR` aus `@/lib/num`.

## 12. Default-Entscheidungen (vom User offen gelassen — bitte vetoen)

1. **Gruppen default**: **eingeklappt, wenn >6 Gruppen**, sonst aufgeklappt;
   no-price-Bucket immer eingeklappt. (Grund: maximaler „Überblick auf einen Blick".)
2. **Karten-Spalten**: **1 / 2 / 3** (mobile / sm-lg / xl).
3. **Hero-Zahl**: **Positions-Wert (qty × market)**, nicht der Stückpreis.
4. **Filter-Umfang**: Waffen-Chips **+ Rarity + Wear** behalten (User wählte „beides").

## 13. Teststrategie

- **Unit** (`portfolio-grouping.test.ts`): Gruppierung, Key-Parsing (★/Bayonet/AK-47),
  no-price-Bucket, Gruppen-P/L mit/ohne Preis, Sortierung, Gewichts-Balken, Filter.
- **RTL** (`PortfolioTable.test.tsx`): rendert Gruppen, Header zeigt Subtotal/Count,
  Collapse-Toggle versteckt Body, Karte-Klick öffnet Lots, no-price-Bucket
  default eingeklappt + aus P/L raus, Filter-Chip grenzt ein. (Vitest+RTL-Harness
  existiert bereits — siehe `61606e4`/`3ef49be`.)

## 14. Out of scope / Folge-Tasks

- Virtualisierung für 1000+ Items.
- Multi-select Filter, Wear-Range-Slider.
- Bulk-Aktionen (mehrere Karten markieren → verkaufen/löschen).

## 15. Umsetzung

writing-plans → Implementation-Plan → **Workflow** mit parallelen Agents
(pure Helfer per TDD, Sub-Komponenten, Tests, abschließendes Design-/Code-Review).
