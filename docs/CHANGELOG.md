# Changelog

## [Unreleased]

### Fixed
* fix(skins): complete skin data restoration and price generation
  * **Problem**: Database was empty (0 skins), causing portfolio and browser to show no data
  * **Root Cause**: Skins were accidentally deleted during previous operations
  * **Solution**: Imported all 25,959 skins from Steam Web API using safe upsert operations
  * **Price Generation**: Created realistic CS2 skin prices for all items (25,197 skins updated)
  * **Price History**: Generated 140,110+ price history entries for analytics
  * **Safety**: Implemented production-safe database operations with safety guards
  * **Scripts**: 
    * `backend/scripts/steamImportSkins.js` - Full Steam API import with rate limiting
    * `backend/scripts/generateRealisticPrices.js` - Realistic price generation based on CS2 market
    * `backend/scripts/safety-guard.js` - Production safety protection
    * `backend/scripts/checkPriceData.js` - Price data diagnostics
  * **Files Modified**:
    * `backend/prisma/schema.prisma` - Extended JobRun model for import tracking
    * `docs/TROUBLESHOOTING.md` - Complete troubleshooting guide with solutions
    * `README.md` - Database safety warnings and import instructions
  * **Result**: Portfolio and skin browser now display all skins with realistic prices

### Added
* feat(cases): comprehensive case system with market analytics
  * Frontend: New case overview page at `/cases` with sortable table and filtering in `frontend/src/app/cases/page.tsx`.
  * Frontend: Case detail page at `/cases/[id]` with comprehensive analytics in `frontend/src/app/cases/[id]/page.tsx`.
  * Frontend: Breadcrumbs component for navigation in `frontend/src/components/Breadcrumbs.tsx`.
  * Frontend: Added "Cases" link to main navigation menu in `frontend/src/app/components/AppHeader.tsx`.
  * Backend: Case controller with full CRUD operations in `backend/src/controllers/caseController.js`.
  * Backend: Case routes with filtering, sorting, and detailed endpoints in `backend/src/routes/cases.js`.
  * Backend: Database schema for cases, supply tracking, price history, and case-skin relationships.
  * Backend: Test data generation script with 10 sample cases in `backend/scripts/generateCaseData.js`.
  * Docs: Case system feature documentation in `/docs/features/case-system.md`.
  * Docs: Updated API documentation with case endpoints in `/docs/API.md`.
* feat(ui): unified design system and UX improvements
  * Frontend: New design system with CSS variables for consistent spacing and styling in `frontend/src/app/globals.css`.
  * Frontend: Standardized card components (`.card-standard`, `.card-kpi`, `.card-metric`) with unified padding and styling.
  * Frontend: Typography scale (`.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-caption`) for consistent text hierarchy.
  * Frontend: Color system reduced to 3 colors (`.text-positive`, `.text-neutral`, `.text-negative`) for better UX.
  * Frontend: Updated portfolio page with consistent design system in `frontend/src/app/portfolio/page.tsx`.
  * Frontend: Updated PerformanceDashboard with unified styling in `frontend/src/app/portfolio/PerformanceDashboard.tsx`.
  * Frontend: Removed redundant Portfolio Allocation section for cleaner layout.
  * Frontend: Added Inter font family for improved typography consistency.
  * Docs: Updated `/docs/ARCHITECTURE.md` with design system documentation.

### Changed
* feat(admin): authenticated Admin Panel requests and Controls tab
  * Frontend: Add Clerk JWT on `/admin` data fetches in `frontend/src/app/admin/page.tsx`.
  * Frontend: New `AdminControls` component in `frontend/src/app/components/AdminControls.tsx`.
  * Frontend: New "Controls" tab on Admin page to run jobs and clear Steam cache.
  * Docs: Updated `/docs/API.md` with admin endpoints and curl examples.
* feat(admin): Coverage Explorer tab for data quality analysis
  * Frontend: New "Coverage" tab in Admin Panel with comprehensive data quality metrics.
  * Frontend: Coverage overview cards showing total skins, coverage percentage, missing history, and median age.
  * Frontend: Segment analysis by weapon type, rarity, and wear with visual progress bars.
  * Frontend: Top missing skins list with relevance ranking (watchlist count, historical prices).
  * Backend: Coverage service already implemented with endpoints for overview, segments, and missing skins.
  * Docs: Updated `/docs/API.md` with coverage endpoints and curl examples.
* feat(dashboard): real pie chart for Portfolio Breakdown
  * **New Component** (`/frontend/src/app/dashboard/components/PortfolioPieChart.tsx`)
    * Implemented interactive pie chart using Recharts library
    * Added tabs for Rarity, Weapon Type, and Exterior breakdowns
    * Custom tooltips with detailed information (value, count, percentage)
    * Responsive design with mobile-optimized legend
    * CS2-themed color scheme matching rarity and weapon types
  * **Dashboard Integration** (`/frontend/src/app/dashboard/page.tsx`)
    * Replaced EnhancedPortfolioBreakdown with new PortfolioPieChart component
    * Maintains same data structure and API compatibility
  * **Features**
    * Interactive hover tooltips with skin details
    * Responsive chart sizing (h-64 sm:h-72 lg:h-80)
    * Color-coded segments based on CS2 rarity system
    * Summary statistics (Total Items, Total Value)
    * Mobile-friendly legend with truncated text

### Fixed
* fix(admin): normalize logs user field to support backend `admin` relation shape
* feat(layout): comprehensive responsive layout improvements
  * **CSS Container System** (`/frontend/src/app/globals.css`)
    * Added `container-cs2` class with max-width and responsive padding
    * Added `section-cs2` class with responsive vertical spacing
    * Added responsive grid utilities (`grid-responsive`, `grid-responsive-2`, `grid-responsive-3`)
    * Improved mobile-first design with proper breakpoints
  * **Dashboard Layout Enhancements** (`/frontend/src/app/dashboard/page.tsx`)
    * Responsive header with flexible layout for mobile/desktop
    * Improved grid system with `xl:grid-cols-3` for better large screen usage
    * Mobile-optimized P&L and KPI sections with `grid-cols-1 sm:grid-cols-3`
    * Better responsive text sizing (`text-3xl sm:text-4xl`)
  * **Search Bar Improvements** (`/frontend/src/app/components/SkinSearchBar.tsx`)
    * Removed fixed `max-w-md` constraint for better flexibility
    * Full-width responsive design with proper container constraints
  * **Header Layout Optimization** (`/frontend/src/app/components/AppHeader.tsx`)
    * Increased search bar max-width from `max-w-md` to `max-w-lg`
    * Reduced horizontal margins from `mx-8` to `mx-4` for better space utilization
    * Improved responsive navigation layout
* feat(cases): complete case system implementation for skin detail pages
  * **Case Section Component** (`/frontend/src/components/CaseSection.tsx`)
    * Displays the case a skin belongs to with case thumbnail and metadata
    * Shows grid of all skins contained in the same case
    * "View Case" button linking to case detail page
    * "Open on Steam" button for external case market access
    * Only renders when skin has a valid case association
  * **Case Detail Page** (`/frontend/src/app/cases/[id]/page.tsx`)
    * Complete case information display with case header
    * Grid of all skins in the case with pricing and rarity info
    * Navigation back to previous page
    * External Steam market integration
  * **Backend Case API Endpoints** (`/backend/src/controllers/caseController.js`)
    * `GET /api/v1/cases/:caseId` - Get case by ID with metadata
    * `GET /api/v1/cases/:caseId/skins` - List all skins in a case
    * `GET /api/v1/skins/:skinId/case-info` - Resolve case for a specific skin
  * **Advanced Case Mapping Logic**
    * Direct case name pattern matching (e.g., "recoil" → "Recoil Case")
    * Skin finish to case mapping (e.g., "case hardened" → "Operation Bravo Case")
    * Support for multiple case types: Fever, Revolution, Recoil, Fracture, etc.
    * Generic pattern fallback for edge cases
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
* fix(layout): resolve dashboard width and responsive layout issues
  * Fixed missing CSS classes `container-cs2` and `section-cs2` causing layout breaks
  * Resolved dashboard grid overflow on large screens with proper breakpoints
  * Fixed header layout stretching issues with improved flexbox configuration
  * Corrected search bar width constraints causing menu layout problems
  * Improved mobile responsiveness across all dashboard components
* fix(cases): resolve case section display issues
  * Fixed missing CaseSection component import in skin detail page
  * Corrected case mapping logic to handle skin finishes (e.g., "Case Hardened")
  * Resolved JSX syntax errors preventing case section rendering
  * Updated deprecated case endpoint redirects to new case controller
* fix(admin): resolved admin access issue by removing unnecessary API call
* fix(skins): repair skin detail page variants, related skins, and price alerts
  * Fix variants query logic to find actual skin variants by weaponType and name patterns
  * Fix related skins query with improved matching logic using OR conditions
  * Fix price alert endpoint from /api/v1/alerts to /api/v1/watchlist
  * Add priceLatest field to all skin API responses for consistent pricing
  * Resolves skin detail page showing 'No variants available' and 'No related skins found'

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