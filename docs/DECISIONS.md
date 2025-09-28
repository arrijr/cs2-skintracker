# Architecture Decision Records (ADR)

## ADR-001: Unified Design System Implementation

**Date:** 2025-01-28  
**Status:** Accepted  
**Context:** Portfolio page had inconsistent card designs, too many colors, and unclear visual hierarchy.

**Decision:** Implement a unified design system with:
* CSS variables for consistent spacing (`--card-padding`, `--card-radius`, `--section-gap`, `--card-gap`)
* Standardized card components (`.card-standard`, `.card-kpi`, `.card-metric`)
* Typography scale (`.text-h1` through `.text-caption`)
* 3-color palette (positive/green, neutral/blue, negative/red)

**Consequences:**
* ✅ Consistent visual design across all components
* ✅ Improved UX with clear visual hierarchy
* ✅ Easier maintenance with reusable CSS classes
* ✅ Better accessibility with standardized color meanings
* ❌ Requires refactoring existing components to use new system

**Files Changed:**
* `frontend/src/app/globals.css` - Design system definitions
* `frontend/src/app/portfolio/page.tsx` - Updated to use design system
* `frontend/src/app/portfolio/PerformanceDashboard.tsx` - Standardized styling

## ADR-002: Portfolio Allocation Removal

**Date:** 2025-01-28  
**Status:** Accepted  
**Context:** Portfolio Allocation section was redundant as it already exists in the main dashboard.

**Decision:** Remove Portfolio Allocation section from portfolio page to reduce visual clutter and redundancy.

**Consequences:**
* ✅ Cleaner, more focused portfolio page
* ✅ Reduced redundancy between dashboard and portfolio
* ✅ More space for important portfolio features
* ❌ Users need to navigate to dashboard for allocation view

**Files Changed:**
* `frontend/src/app/portfolio/page.tsx` - Removed Portfolio Allocation section
