# Changelog

## [Unreleased]

### Added
* feat(skins): enhanced skin detail page with market stats, variants, and case information
  * Market statistics card showing volume, prices, and market activity
  * Skin variants display with wear levels and special features
  * Case information showing all skins from the same case
  * New API endpoints: `/skins/:id/market-stats`, `/skins/:id/variants`, `/skins/:id/case`
  * Responsive UI components with Tailwind CSS styling

### Changed
* refactor(admin): simplified admin access check using token-based verification
* docs(api): documented new skin detail endpoints and responses

### Fixed
* fix(admin): resolved admin access issue by removing unnecessary API call

## [2024-01-XX] - Previous Release

Format
------

* Jede Änderung wird unter dem aktuellen Datum eingetragen.
* Stil: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:` …).
* Liste mit `*`-Bullets, kurz und prägnant.
* Bei API/DB-Änderungen: Referenz auf die passende Doc-Datei.

Template
--------

YYYY-MM-DD
----------

* feat(auth): add JWT role claim based on DB `User.role`
* docs(api): update `/users/profile` response with role
* fix(watchlist): prevent crash when `priceAlert` is null
* perf(db): add index on `PriceHistory.skinId,date`
* chore(ci): disable cronjobs in staging (`RUN_SCHEDULER=false`)

Example
-------

2025-08-30
----------

* feat(filters): implement enhanced skins filters behind feature flag
* docs(features): add `enhanced-skins-filters.md`
* docs(features): add `skin-filtering-system.md`
* docs(readme): restructure main README
* chore(docs): migrate old drafts to `/docs/archive/`

YYYY-MM-DD
----------

* feat(admin): add admin overview endpoint and frontend page
* docs(api): document `/api/v1/admin/overview`