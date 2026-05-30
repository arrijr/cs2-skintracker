# Vault-Konventionen 🧭

Wie Doku in diesem Repo/Vault angelegt wird, damit Obsidian eine **lebende
Wissensbasis** bleibt und nicht wieder verrottet. Start: [[00-Index]].

> Hintergrund/Aufräum-Aktion: [[2026-05-30-obsidian-vault-cleanup]].

## 1. Wo gehört was hin?

| Typ | Ort | Beispiel |
|-----|-----|----------|
| Vault-Home / Navigation | `docs/00-Index.md` | [[00-Index]] |
| Kern-Doku (SSOT) | `docs/0X-*.md` (01–08) | [[03-Backend-API]] |
| Feature-Doku | `docs/features/` | [[skin-import-system]] |
| Betrieb / Deploy / Setup | `docs/ops/` | [[PRODUCTION-SETUP]] |
| Sprint-Doku | `docs/0X-SprintN/` | [[Overview]] |
| Architektur-Entscheidungen | `docs/superpowers/adrs/` | ADR-00X |
| Spezifikationen (Brainstorm) | `docs/superpowers/specs/` | `YYYY-MM-DD-<topic>-design.md` |
| Implementierungs-Pläne | `docs/superpowers/plans/` | `YYYY-MM-DD-<topic>.md` |
| Research / Strategie | `docs/superpowers/research/` | Markt, SEO, CEO |
| Arbeits-Sessions | `docs/sessions/` | `YYYY-MM-DD-<slug>.md` |
| Abgelöst / historisch | `docs/archive/` | nie löschen, hierher verschieben |

**Repo-Root** behält nur `README.md`, `CHANGELOG.md`, `CLAUDE.md`. **Keine** Projekt-Doku
mehr im Root ablegen — sie gehört in den Vault (`docs/`).

## 2. Naming
- Kleinschreibung mit Bindestrich für Feature-Docs (`skin-detail-page.md`).
- Datierte Docs: `YYYY-MM-DD-<slug>.md` (specs, plans, sessions, research).
- Keine `$f`/Platzhalter-Dateien committen — die kamen von einem nicht-expandierten
  PowerShell-`$f` in einem Skript. Pfade mit `$` in PS **single-quoten**.

## 3. Wikilinks
- `newLinkFormat: shortest` → `[[Note-Name]]` resolved per **Basename**, ordnerunabhängig.
  Moves brechen Wikilinks daher **nicht**.
- **Mehrdeutige Namen path-qualifizieren**: es gibt mehrere `README.md` und zwei
  `CHANGELOG.md`. Nutze `[[docs/ops/README|Ops-MOC]]` bzw. `[[docs/CHANGELOG]]` vs
  `[[CHANGELOG]]` (Root).
- Jede neue Note **vom passenden MOC verlinken** (Ops-MOC, Features-MOC, …) und ggf. vom
  [[00-Index]]. Keine verwaisten Notes.

## 4. Index-Pflicht
Neuer Bereich/Ordner → Eintrag in [[00-Index]] **und** eine Folder-MOC (`README.md` im
Ordner). So bleibt der Graph zusammenhängend.

## 5. Dataview installieren (einmalig, manuell)
Dashboards (`[[Dashboard]]`) brauchen das Dataview-Plugin. Es ist in
`community-plugins.json` registriert, aber die Plugin-Dateien fehlen noch:

1. Repo als Vault öffnen → **Settings → Community plugins** → *Restricted Mode* aus.
2. **Browse** → "Dataview" → **Install** → **Enable**.
3. `[[Dashboard]]` öffnen — die Queries rendern jetzt als Tabellen statt Code-Blöcke.

Ohne Dataview funktioniert alles andere; nur das Auto-Dashboard zeigt Roh-Codeblöcke.

## 6. Was im Vault versteckt ist
`.obsidian/app.json → userIgnoreFilters` blendet `node_modules/`, `.next/`, `.serena/`,
`playwright-report/`, `*/coverage/` etc. aus → Build-/Test-Artefakte fluten Graph & Suche
nicht. Neue Build-/Output-Ordner dort ergänzen.
