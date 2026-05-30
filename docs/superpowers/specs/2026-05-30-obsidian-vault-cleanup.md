# Obsidian Vault Cleanup & Establishment — Spec

**Date**: 2026-05-30
**Author**: Claude (delegated execution — user approved full scope, then "deal with it")
**Branch**: `chore/obsidian-vault-cleanup`
**Status**: Executed

## Problem

The repo doubles as an Obsidian vault (repo root = vault, `.obsidian/` committed). The
vault config and a `docs/00-Index.md` hub existed, but the vault had rotted:

- **7 byte-stub junk files** from a PowerShell `$f`-variable bug (`docs$f.md`,
  `docs/launch$f.md`, `docs/launch{posts,discords,checklist,demo-script,results}.md` —
  16–18 bytes each, content literally `placeholder`; the real content lives in
  `docs/launch/`).
- **~27 stray project `.md` files** dumped in the repo root (PHASE/SPRINT/PORTFOLIO/ops
  docs) instead of inside the vault structure.
- `community-plugins.json` registers **Dataview, but it is not installed**
  (`.obsidian/plugins/` empty) → any Dataview query silently fails.
- **Two changelogs** (root auto-generated vs `docs/` curated) with no disambiguation.

Net effect: Obsidian existed but was not usable as a living knowledge base.

## Goal

Clean up **and** establish: make the vault navigable, keep it that way, and document the
convention so future docs land in the right place.

## Decisions

- **Delete only the 7 byte-stubs** (zero content). Everything with real content is
  `git mv`-ed (history preserved), never deleted.
- **Relocation scheme** (root → vault):
  - `docs/archive/` ← historical/superseded (PHASE1–3, SPRINT1_*, README_SPRINT1,
    FILES_PREPARED, REDEPLOY_INSTRUCTIONS, TRIGGER_WORKFLOW, IMPLEMENTATION_ROADMAP)
  - `docs/features/` ← PORTFOLIO_* (5)
  - `docs/ops/` (new) ← STRIPE_DASHBOARD_SETUP, PRODUCTION-SETUP, FIX_STEAM_API,
    LIVE_TEST_GUIDE, VERIFICATION_CHECKLIST, AUTOMATION_WORKFLOW, DATA_SOURCES_ANALYSIS
  - `docs/02-Sprint2/` ← SPRINT_2_* (4)
  - Root keeps only `README.md`, `CHANGELOG.md`, `CLAUDE.md` (convention).
- **Wikilinks survive moves** (`newLinkFormat: shortest` resolves by basename).
  Markdown-relative links to moved files were scanned — **0 found** → no link repair needed.
- **The two changelogs are not duplicates**: root `CHANGELOG.md` is auto-generated
  (standard-version, semver headers + commit hashes — stays at root by convention);
  `docs/CHANGELOG.md` is the hand-curated narrative. Both kept, disambiguated in the index.
- **Dataview**: dashboards are authored as plain Markdown that degrades gracefully; a
  `docs/Dashboard.md` adds Dataview queries that light up once the plugin is installed.

## Deliverables

1. 7 junk files deleted (`git rm`).
2. 27 root docs relocated (`git mv`).
3. `docs/00-Index.md` rewritten as the vault hub (all areas linked, stale `creator` tier
   corrected to `lite`).
4. Folder MOCs: `docs/ops/README.md`, `docs/features/README.md`, `docs/archive/README.md`
   (rewritten from a stale stray doc-rules copy into a real archive index).
5. `docs/CONVENTIONS.md` — where docs live + how to keep the vault clean.
6. `docs/Dashboard.md` — Dataview dashboard (graceful degradation).
7. `CLAUDE.md` Obsidian section updated.

## Out of scope / follow-ups

- **Installing Dataview** (manual user action — documented in CONVENTIONS + CLAUDE.md).
- Reconciling overlapping content between the root auto-CHANGELOG and `docs/CHANGELOG.md`.
- Pruning stale loose docs in `docs/` (e.g. `API.md` vs `03-Backend-API.md`,
  `ARCHITECTURE.md` vs `01-Architecture.md` overlap).
