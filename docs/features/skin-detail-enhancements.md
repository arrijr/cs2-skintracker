Skin Detail Enhancements
========================

Overview
--------

Enhanced skin detail page with improved UX components and data visualization.

Components
----------

### Price Delta Badge
* Shows 24h price change with visual indicators (▲/▼)
* Displays absolute change and percentage
* Color-coded: green for gains, red for losses
* Only shows when yesterday's data is available

### Chart Range Tabs
* Interactive time range selector (7d/30d/90d)
* Client-side filtering of price history data
* Smooth transitions between ranges
* Default: 30 days

### Tag Badges
* Visual indicators for special skin properties
* ★ Star items (yellow)
* StatTrak items (orange)
* Souvenir items (green)
* Compact design with colored borders

### Skeleton Loaders
* Animated loading placeholders
* Replaces generic "Loading..." text
* Provides visual structure during data fetch
* Smooth pulse animation

### Tooltips
* Hover-based information tooltips
* No external dependencies
* Contextual help for market statistics
* Examples: "Estimated trades on Steam during last 24h"

### Enhanced Market Stats
* Volume data with tooltips
* Price statistics (lowest, median, etc.)
* Buy orders and active listings
* Robust null handling with "—" fallbacks

Implementation Notes
-------------------

* All price formatting uses `formatUSD()` helper
* Number parsing via `numberOrNull()` for safety
* Chart data filtered client-side for performance
* Skeleton loaders show during enhanced data fetch
* Tooltips provide context without cluttering UI

Usage Examples
-------------

```tsx
// Price delta badge
<PriceDeltaBadge 
  current={skin.marketPrice} 
  yesterday={history?.[history.length-2]?.price ?? null} 
/>

// Chart range tabs
<ChartRangeTabs value={chartRange} onChange={setChartRange} />

// Tag badges
<TagBadges 
  isStattrak={skin.isStattrak} 
  isSouvenir={skin.isSouvenir} 
  isStar={skin.isStar} 
/>

// Tooltips
<Tip label="Estimated trades on Steam during last 24h">
  <div>24h Volume</div>
</Tip>
```
