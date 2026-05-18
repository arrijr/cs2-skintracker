# Architecture Decision Records

Log of significant architecture decisions. Each ADR documents what we decided, why we considered alternatives, what we accepted as trade-offs, and when to revisit.

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| [001](./ADR-001-deduplicate-skin-records.md) | Deduplicate legacy Skin records | Accepted | 2026-05-11 |
| [002](./ADR-002-image-hosting-strategy.md) | Image hosting and proxy strategy | Accepted (Phase 1) · Phase 2 Deferred | 2026-05-11 |
| [003](./ADR-003-filter-state-url-encoding.md) | Filter state URL encoding | Accepted | 2026-05-11 |
| [004](./ADR-004-background-job-infrastructure.md) | Background job infrastructure | Accepted (retrospective) | 2026-05-10 |
| [005](./ADR-005-price-scraping-strategy.md) | Steam Market price scraping strategy | Accepted | 2026-05-12 |

## When to write an ADR

Write a new ADR when a decision:
- Locks in a piece of public contract (URL shape, API response, schema field name)
- Costs money or vendor lock-in to revisit
- Has multiple plausible options with non-obvious trade-offs
- Will be questioned by a future engineer ("why does this work this way?")

Skip ADRs for: framework choices already locked in, library upgrades, refactors that don't change behavior, one-off scripts.

## Format

Use [`ADR-XXX-kebab-case-title.md`](./ADR-001-deduplicate-skin-records.md) as the template. Sections: Context, Decision, Options Considered, Trade-off Analysis, Consequences, Action Items.

Bump `Status` when superseded or deprecated; never delete an ADR.
