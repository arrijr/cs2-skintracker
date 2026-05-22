# Architecture Decision Records

Log of significant architecture decisions. Each ADR documents what we decided, why we considered alternatives, what we accepted as trade-offs, and when to revisit.

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| [[ADR-001-deduplicate-skin-records\|001]] | Deduplicate legacy Skin records | Accepted | 2026-05-11 |
| [[ADR-002-image-hosting-strategy\|002]] | Image hosting and proxy strategy | Accepted (Phase 1) · Phase 2 Deferred | 2026-05-11 |
| [[ADR-003-filter-state-url-encoding\|003]] | Filter state URL encoding | Accepted | 2026-05-11 |
| [[ADR-004-background-job-infrastructure\|004]] | Background job infrastructure | Accepted (retrospective) | 2026-05-10 |
| [[ADR-005-price-scraping-strategy\|005]] | Steam Market price scraping strategy | Accepted | 2026-05-12 |

## When to write an ADR

Write a new ADR when a decision:
- Locks in a piece of public contract (URL shape, API response, schema field name)
- Costs money or vendor lock-in to revisit
- Has multiple plausible options with non-obvious trade-offs
- Will be questioned by a future engineer ("why does this work this way?")

Skip ADRs for: framework choices already locked in, library upgrades, refactors that don't change behavior, one-off scripts.

## Format

Use [[ADR-001-deduplicate-skin-records|`ADR-XXX-kebab-case-title.md`]] as the template. Sections: Context, Decision, Options Considered, Trade-off Analysis, Consequences, Action Items.

Bump `Status` when superseded or deprecated; never delete an ADR.
