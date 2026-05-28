# Changelog

All notable changes to the CS2 Skin Tracker project will be documented in this file.

## [Unreleased]

## [2026-05-22] - Notifications System Audit + Fix

Full audit and overhaul of the notification pipeline (engine → delivery → UI → schema). See [`docs/superpowers/research/2026-05-22-notifications-audit-fix.md`](superpowers/research/2026-05-22-notifications-audit-fix.md) for the complete report.

### Fixed (P0 — blocked functionality)
- **CRITICAL**: Inngest function `priceAlertsCheck` imported a non-existent file (`../cron/priceAlertsCheck.js` instead of `priceAlertJob.js`); silent `.catch(() => null)` swallowed the error and returned `{ skipped: true }` on every run. On Vercel (no node-cron), this meant alerts **never fired in production**. (`inngest/functions.js`)
- **CRITICAL**: `getTierFromUser` ignored `User.tier`, only reading `isPremium` boolean. Paying Lite-tier subscribers were silently capped at the Free quota (2 alerts) instead of 15. (`alertController.js`)
- **CRITICAL**: `mark-all-read` endpoint was a literal no-op stub (`return res.status(200).json({ok:true})` with no DB write). `AlertEvent` had no `readAt` column. Bell-icon UI showed every notification as unread forever. (`notificationsRoutes.js`)
- **CRITICAL**: Notification body lookup used `payload.price ?? payload.triggerPrice ?? payload.value` — none of which any evaluator emits. Every in-app notification fell through to the generic "matched your alert criteria" copy. Fix: lookup `payload.currentPrice ?? payload.casePrice`. (`notificationsRoutes.js`)

### Fixed (P1 — correctness + UX)
- Edge-trigger dedup added — alert parked above threshold no longer re-fires every cooldown window (24h plateau = 24 emails). New `Alert.lastConditionState Boolean?` column tracks last evaluation state; engine only fires on false→true transition. (`alertEngine.js`)
- Email transport now lazy-init with explicit env-guard; missing `EMAIL_USER`/`EMAIL_PASS` throws a specific error instead of cryptic SMTP-535.
- Email body rendering — `JSON.stringify(payload)` dump replaced with structured key:value rows (`renderPayload()`) with €/% formatting and a plain-text alternative.
- `pushAlerts` toggle in `NotificationsTab` was writing to a DB column with no reader. Replaced with "Coming soon" badge until Web Push API ships in Sprint 3.
- `AlertCard` now shows the bell icon for `in_app` channel (previously only `email` was visible).
- `alerts/page.tsx` mutations (`onToggle`, `onDelete`) now show Sonner success/error toasts; previously threw unhandled promise rejections.
- `NotificationsDropdown` mark-all-read is now optimistic + reconciles on error; new per-item mark-on-click via `POST /notifications/:id/read`.

### Added
- Migration `20260522000000_alert_event_read_at` — adds `AlertEvent.readAt DateTime?` + index `(alertId, readAt)`.
- Migration `20260522010000_alert_last_condition_state` — adds `Alert.lastConditionState Boolean?` for edge-trigger dedup.
- `POST /api/v1/notifications/:id/read` — new endpoint for per-item read marking; accepts both raw (`42`) and prefixed (`alert-event-42`) IDs.
- `shouldFire(lastConditionState, isTriggered)` exported helper in `alertEngine.js` for testable edge-trigger logic.
- 19 new unit tests in `notifications.test.js` covering `getTierFromUser`, `renderPayload`, `sendAlertEmail` env-guard, `notificationBody` rendering, and `shouldFire`.
- `scripts/smoke-notifications.mjs` — 12 smoke tests against live DB validating engine + delivery + read-state + edge-trigger.

### Changed
- `notificationsRoutes.js` rewritten — real mark-all-read with `updateMany`, fail-open with `logger.error` instead of swallowing via `console.error`, href prefers Sprint-2 weapon-slug URLs over legacy `/skins/:id` 308-redirects.
- `emailService.js` — `sendPriceAlertEmail` (dead code) removed; `sendAlertEmail` now uses lazy transporter + structured rendering + plain-text alt + proper logger.

### Infrastructure
- Migration ledger drift repaired — 9 migrations were marked unapplied in `_prisma_migrations` despite their schema changes existing in the live DB (manual Supabase SQL Console application). Resolved via `prisma migrate resolve --applied <name>` per migration, then `prisma migrate deploy` for the 2 new ones.

### Known Issues (carried over, not addressed in this session)
- Schema ≠ Live DB drift discovered: DB has `APIKey`/`APILog` tables not in schema, `MarketSnapshot` has `createdAt`/`updatedAt` in DB but not in schema, `Skin.slug` UNIQUE in schema but not in DB. Tracked in [[06-Tech-Debt]] #11.
- 3 toast libraries mounted in parallel (shadcn, sonner, react-hot-toast). shadcn unused. Tracked in #12.
- Email transport still on Nodemailer/Gmail SMTP. Resend migration pending per CEO checklist §6. Tracked in #13.

### Pending (CEO action)
- `git push origin main` to deploy to Vercel.
- Set `EMAIL_USER` + `EMAIL_PASS` (Gmail App Password) in Vercel env — or migrate to Resend.
- Confirm Inngest `price-alerts-check` function targets current Vercel URL.

## [2025-10-14] - Data Loss Prevention & Integrity System

### Fixed
- **CRITICAL**: Removed all sample/fake data generation from backend and frontend
- Backend API (`skinRoutes.js`) now returns ONLY real database data
- Frontend no longer generates artificial quantity data
- GitHub Workflows now use correct script paths

### Added
- `savePriceHistory.js` - Daily price history snapshot script
- `saveQuantityHistory.js` - Daily quantity history snapshot script  
- `verifyDataIntegrity.js` - Data gap detection and validation script
- `dataIntegrityService.js` - Data validation and monitoring service
- `backfillHistoricalData.js` - Generate 90 days of historical data (one-time)
- `fetchRealHistoricalData.js` - Fetch real historical data from SteamWebAPI.com
- Automated daily GitHub Actions workflows (02:00, 03:00, 03:30 UTC)
- Historical data recovery workflows (manual triggers)
- Comprehensive data integrity monitoring and alerting
- "No data available" messages when real data doesn't exist yet

### Changed
- `updateSkinPrices.js` - Enhanced validation and error logging
- Skin detail page now loads real quantity data from API endpoint
- Available Listings chart shows loading state and proper error messages
- All workflows now include summary outputs and failure notifications

### Removed
- Sample price history generation (lines 289-316 in skinRoutes.js)
- Sample market stats calculations (lines 320-336 in skinRoutes.js)
- Sample quantity data generation (lines 509-546 in skinRoutes.js)
- Frontend artificial quantity data generation (lines 239-279 in page.tsx)

### Documentation
- Added "Data Loss Prevention" section to TROUBLESHOOTING.md
- Documented all new scripts and services
- Added recovery procedures for data loss scenarios
- Documented GitHub Actions workflow schedule

### Added
- Complete case system implementation with 42 real CS2 cases
- Case detail pages with comprehensive market data
- Interactive charts for supply and price history
- Case filtering and sorting functionality
- Real-time case search capabilities
- Case data import scripts from Steam API
- Comprehensive API documentation for case endpoints
- **API_KEYS.md** - Complete documentation of external services and API keys
- **SteamWebAPI.com integration** - 26,017 CS2 items with real market data
- **Real data implementation** - Daily automatic updates from SteamWebAPI.com
- **Realistic case market data** - Prices, supply, and market statistics
- **Real case images** - 42 cases with Steam CDN image URLs
- **Contained skins** - 🎉 **100% COMPLETE:** 473 skins across all 42 cases from csgodatabase.com
- **Case import system** - Universal template-based workflow for importing case contents
- **Serena MCP Server** - Semantic code navigation and project memory integration
- **Supply & price history** - 90 days of data for all 42 cases
- **Real SteamWebAPI.com market data** - offerVolume, sold24h/7d/30d/90d, pricelatest
- **Daily Cronjob** - Automated daily data updates with admin panel monitoring
- **JobRun tracking** - Complete monitoring of cronjob success/failure status
- **Enhanced supply charts** - Real offer volume and daily sales as bar/line charts

## [2025-10-10] - Cases & Skins Improvements Phase 1

### Added
- **Breadcrumbs System for Skins** - Dynamic breadcrumb navigation with case context
  - Backend endpoint: `/api/v1/skins/:skinId/case-breadcrumb`
  - Frontend integration: `Home > Cases > [Case Name] > Skins > [Skin Name]`
  - Automatic case detection from CaseSkin relationships
- **Extended Case Statistics Endpoint** - Aggregated market overview data
  - Total Available Listings across all cases (from offerVolume)
  - Total Sold 7d/30d/90d (aggregated from soldData JSON)
  - Total Market Cap calculation
  - Enhanced `/api/v1/cases/stats` endpoint with real-time data
- **Price History Cronjobs** - Daily automated price tracking
  - Case Price History: `dailyCasePriceHistory.js` (06:30 UTC)
  - Skin Price History: `dailySkinPriceHistory.js` (07:00 UTC)
  - Batched processing for 26,000+ skins
- **Quantity History System** - Track offer volume over time
  - New `SkinQuantityHistory` database table
  - Daily cronjob: `dailySkinQuantityHistory.js` (07:30 UTC)
  - API endpoint: `/skins/:skinId/history/quantity`
  - Real data tracking with fallback to generated data
- **Extended Market Statistics** - Comprehensive market data display
  - Offer Volume (active listings)
  - Sold 7d/30d/90d statistics
  - Buy Orders volume and price
  - 4-column responsive grid layout
  - Color-coded values (blue for buy orders, green/red for min/max)
- **Case Section Component** - Source case display on skin pages
  - Shows case info with image and name
  - "View Case" button for navigation
  - Grid of all skins from the same case
  - Responsive design (grid + carousel)

### Fixed
- **CORS Issues** - Resolved Vercel frontend to Render backend communication
  - Added detailed CORS logging for debugging
  - Improved Vercel-specific origin handling
  - Enhanced manual CORS header setting as backup
- **Price Change Display** - Fixed percentage display showing only "+" without numbers
- **Sales History Chart** - Removed today's incomplete data to prevent steep drop
- **Skin Detail API** - Added explicit select fields for all market data
  - Now returns: offerVolume, sold7d/30d/90d, buyOrderVolume, buyOrderPrice
  - Improved price history loading with 90-day range
  - Better logging for debugging data issues
- **Chart Naming** - Renamed "Quantity History" to "Available Listings" for clarity

## [2025-10-07] - Complete Case Contents Implementation

### Added
- **🎯 Universal Case Import System** - Template-based workflow for all cases
  - Template script: `importCaseFromCSGODatabase.template.js`
  - 38+ case URL mappings in `csgodatabase-case-urls.json`
  - Complete workflow documentation in `CSGODATABASE_IMPORT_WORKFLOW.md`
- **🎨 All 42 Cases with Contained Skins** - 473 total skins imported
  - Source: https://www.csgodatabase.com/cases/
  - Standard CS2 drop rates: Covert (0.64%), Classified (3.2%), Restricted (15.98%), Mil-Spec (15.98%), Knives (0.26%)
- **🤖 Serena MCP Server Integration** - Semantic code navigation
  - 24 powerful tools for code analysis and refactoring
  - Project memory system for context persistence
  - Symbol-based code navigation via Language Server Protocol
- **📊 Case Import Scripts** - 20+ individual case imports + 6 batch scripts
  - All cases verified with `checkContainedSkins.js`
  - Helper scripts for missing case detection

### Fixed
- **Operation Breakout Case** - Corrected from 51 incorrect skins to 19 authentic skins
  - Removed wrong skins (AK-47 Redline, M4A4 Howl, etc.)
  - Added correct skins (M4A1-S Cyrex, P90 Asiimov, Butterfly Knives, etc.)
- **Case import workflow** - Systematic template-based approach ensures data accuracy

### Technical Details
- **Import Strategy**: Template-based, copy & customize per case
- **Data Source**: csgodatabase.com (reliable community database)
- **Idempotency**: Scripts can be safely re-run (delete old, insert new)
- **Coverage**: 42/42 cases (100%) with 473 contained skins
- **Average**: 11.3 skins per case
- **Tool Integration**: Serena MCP for code navigation and memory

### Changed
- Updated cases page to display all 52 cases instead of 4
- Replaced dummy case data with realistic market statistics
- Fixed case detail page API endpoints
- Improved case data structure and relationships
- **Documented API key usage** - Clarified SteamWebAPI.com vs Official Steam API

### Fixed
- CORS issues preventing frontend-backend communication
- Case page filter logic to show all cases by default
- API endpoint paths for case operations
- Case data population and statistics calculation
- **API confusion** - Clarified which APIs are used and why
- **Case prices showing incorrect values** - Now using real-time data from SteamWebAPI ($417 → $10.74 for Operation Breakout Case)
- **Case images showing wrong URLs** - Updated with correct Steam CDN URLs from SteamWebAPI
- **Automated case data updates** - Cron job now properly updates prices, images, and market data every hour
- **Supply history calculation logic** - Fixed unrealistic data generation with real SteamWebAPI sales data
- **Supply history chart format** - Now shows real offer volume and daily sales data instead of synthetic drops/unboxings
- **Case-skin relationships** - Corrected with real CS:GO data for major cases (CS:GO Weapon Case, Chroma Cases, Horizon Case)
- **Price history filter** - Fixed 30d/1y/all time range filters with realistic historical data
- **Case release dates** - Updated with correct dates from Steam API (e.g., Operation Broken Fang Case: Dec 3, 2020)
- **Discontinued cases logic** - Fixed supply data generation for discontinued cases (no more drops after discontinued date)
- **Offer volume tracking** - Added real SteamWebAPI offer volume data to supply history
- **Daily sales data** - Replaced synthetic drops with real daily sales volume from SteamWebAPI
- **Price history accuracy** - Fixed incorrect price ranges ($2.40-$3.60 → $12.65-$13.24 for Operation Breakout Case)
- **Real historical prices** - Implemented pricelatestsell24h/7d/30d/90d from SteamWebAPI.com
- **Price History Frontend Fix** - Removed Market Cap from charts, now shows only real price data
- **CasePriceHistory synchronization** - Copied real price data from CaseSupply to CasePriceHistory table
- **Enhanced Cronjob** - Daily SteamWebAPI updates now also update CasePriceHistory with current prices

## [2025-10-03] - Case System Implementation

### Added
- **Case Data Import**: Created scripts to import 42 real cases from Steam API container data
- **Case Statistics**: Implemented realistic market data for all cases including:
  - Current prices ($0.50 - $10.50)
  - Market capitalization
  - Supply statistics (remaining, dropped, unboxed)
  - Time to extinction calculations
  - Price change metrics (24h, 7d, 30d)
- **Case Detail Pages**: Comprehensive case information display with:
  - Market metrics and performance indicators
  - Interactive supply and price history charts
  - Contained skins listing
  - Market performance analytics
- **Case List Page**: Enhanced cases overview with:
  - All 52 cases displayed
  - Advanced filtering and sorting
  - Real-time search functionality
  - Responsive grid layout
- **API Endpoints**: Complete RESTful API for case operations:
  - `GET /api/v1/cases` - List all cases
  - `GET /api/v1/cases/{id}` - Get case details
  - `GET /api/v1/cases/{id}/supply` - Get supply history
  - `GET /api/v1/cases/{id}/price-history` - Get price history
  - `GET /api/v1/cases/{id}/skins` - Get contained skins
- **Chart Components**: Interactive data visualization:
  - CaseSupplyChart for supply over time
  - CasePriceChart for price history
  - Responsive design with tooltips and legends

### Changed
- **Database Schema**: Updated Case model with comprehensive market data fields
- **Frontend Components**: Enhanced case-related components with real data
- **API Structure**: Improved case API responses with related data
- **Data Flow**: Streamlined case data import and population process

### Technical Details
- **Import Process**: 
  - Analyzed 384 Steam API container names
  - Filtered to 42 real cases (excluded stickers, capsules, etc.)
  - Generated realistic market statistics
  - Categorized cases as active/discontinued
- **Data Quality**: All cases now have proper market data instead of zeros
- **Performance**: Optimized database queries and API responses
- **Documentation**: Comprehensive API and feature documentation

### Files Modified
- `backend/scripts/importRealCases.js` - Case import script
- `backend/scripts/simpleCaseUpdate.js` - Data population script
- `frontend/src/app/cases/page.tsx` - Cases list page
- `frontend/src/app/cases/[id]/page.tsx` - Case detail page
- `frontend/src/components/CaseSection.tsx` - Case section component
- `backend/src/controllers/caseController.js` - Case API controller
- `backend/src/routes/cases.js` - Case API routes

### Database Changes
- Added 42 new cases to the database
- Populated all cases with realistic market data
- Updated case relationships and indexes
- Improved data consistency and validation

## [2025-10-01] - CORS Fix and Initial Setup

### Fixed
- **CORS Issues**: Resolved frontend-backend communication problems
- **API Headers**: Implemented proper CORS headers for all requests
- **Preflight Requests**: Added OPTIONS request handling

### Added
- **Dual-layer CORS Protection**: Comprehensive CORS configuration
- **Force Restart Mechanism**: Backend restart triggers for configuration updates
- **Error Handling**: Improved error responses and logging

## [Previous Versions]

### Initial Implementation
- Basic skin tracking functionality
- User authentication with Clerk
- Portfolio management features
- Market data integration
- Responsive UI design

---

## Development Notes

### Case System Architecture
The case system is built with scalability in mind and follows these principles:
- **Data Integrity**: All case data is validated and consistent
- **Performance**: Optimized queries and caching strategies
- **User Experience**: Intuitive interface with comprehensive information
- **Maintainability**: Clean code structure with proper documentation

### Future Enhancements
- Real-time price updates from Steam API
- Case opening simulation
- Historical performance analysis
- User case portfolio tracking
- Advanced analytics and insights

### Testing Status
- [x] Manual testing of all case pages
- [x] API endpoint validation
- [x] Data integrity verification
- [ ] Automated test suite
- [ ] Performance testing
- [ ] E2E testing

### Deployment
- **Backend**: Deployed on Render with automatic deployments
- **Frontend**: Deployed on Vercel with CDN distribution
- **Database**: PostgreSQL with proper indexing and relationships
- **Monitoring**: Error tracking and performance monitoring active