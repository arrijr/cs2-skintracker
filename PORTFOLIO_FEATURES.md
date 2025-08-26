# Portfolio Page Features

## Overview
Enhanced portfolio page with comprehensive KPIs, time-filtered charts, allocation analysis, and advanced insights.

## Features Implemented

### P1 — Header KPIs ✅
- **Total Value**: Sum of (latest price × quantity) for all positions
- **24h/7d Changes**: Percentage changes based on portfolio history
- **Unrealized P/L**: Current value vs. total invested
- **Portfolio Count**: Number of unique skins
- **Watchlist & Alerts**: Active watchlist items and price alerts
- **Last Updated**: Timestamp from latest portfolio snapshot

### P2 — Zeitfilter & Chart-Parität ✅
- **Time Ranges**: 1W, 1M, 3M, 6M, 1Y, All
- **Enhanced Chart**: Auto-scale Y-axis, improved tooltips with date/value/change
- **Range Synchronization**: Chart and KPIs update together
- **Performance**: Optimized for large datasets

### P3 — Holdings-Tabelle ✅
- **Enhanced Sorting**: Name (A-Z), Performance, Recent, Weight
- **Search & Filter**: Client-side search by skin name
- **Performance Display**: Avg Cost, Market Price, P/L %, Weight %
- **Responsive Design**: Mobile-friendly with proper spacing

### P4 — Allocation Snapshot ✅
- **Donut Charts**: Weapon Type, Rarity, Wear
- **Dynamic Switching**: Toggle between allocation types
- **Top 5 + Others**: Group smaller allocations for clarity
- **Color Coding**: Consistent color scheme per category

### P5 — Top Movers ✅
- **Top 3 Gainers/Losers**: Based on 24h performance
- **7d Sparklines**: Mini charts showing trend
- **Performance Metrics**: Absolute and percentage changes
- **Navigation**: Click to view skin details

### P6 — Transactions (FIFO) ✅
- **BUY/SELL Support**: Full transaction history
- **FIFO Average Cost**: Automatic portfolio updates
- **Validation**: Prevents overselling
- **API Endpoints**: Complete CRUD operations

### P7 — Daily Snapshot ✅
- **Upsert Logic**: One record per user per day
- **Portfolio History**: Stable time series data
- **Last Updated**: Accurate timestamp tracking

### P8 — Insight Cards ✅
- **Feature Flag**: `NEXT_PUBLIC_PORTFOLIO_INSIGHTS=true`
- **Risk Metrics**: 30-day volatility, 90-day max drawdown
- **Contribution Analysis**: Position performance attribution
- **Performance**: Optimized calculations with fallbacks

## Feature Flags

### Portfolio Insights
```bash
# Enable insight cards (default: OFF)
NEXT_PUBLIC_PORTFOLIO_INSIGHTS=true
```

### Portfolio Transactions
```bash
# Enable transaction system (default: ON)
PORTFOLIO_TRANSACTIONS=true
```

## API Endpoints

### Portfolio KPIs
```
GET /api/v1/portfolio/kpis
```
Returns comprehensive portfolio metrics including risk analysis.

### Portfolio Contribution
```
GET /api/v1/portfolio/contribution?range=week|month|quarter
```
Returns position contribution analysis for selected time range.

### Transactions
```
GET    /api/v1/transactions
POST   /api/v1/transactions
PATCH  /api/v1/transactions/:id
DELETE /api/v1/transactions/:id
```

## Performance Considerations

- **Minimal API Calls**: ≤3 requests for full page load
- **Client-side Caching**: Chart data cached in memory
- **Lazy Loading**: Insight cards load only when enabled
- **Pagination Ready**: Table structure supports large datasets

## Error Handling

- **Graceful Degradation**: Features hide when data unavailable
- **User Feedback**: Clear messages for missing data
- **Fallback Values**: Default to 0 or "—" for missing metrics
- **Loading States**: Skeleton loaders for better UX

## Testing Matrix

### Manual Testing Checklist
- [ ] Empty portfolio shows appropriate messages
- [ ] Single position calculates P/L correctly
- [ ] Multiple buys/sells maintain FIFO accuracy
- [ ] Time ranges update chart and KPIs consistently
- [ ] Allocation charts sum to 100%
- [ ] Top movers show plausible values
- [ ] Feature flags work correctly
- [ ] Large portfolios remain performant

### Edge Cases
- [ ] No price history → "Not enough data"
- [ ] Missing skin metadata → Graceful fallbacks
- [ ] Network errors → User-friendly error messages
- [ ] Invalid time ranges → Default to safe values

## Rollout Strategy

### Phase 1: Core Features (Production)
- Header KPIs
- Enhanced Chart
- Holdings Table
- Allocation Charts
- Top Movers

### Phase 2: Advanced Features (Preview)
- Insight Cards (behind flag)
- Transaction System (behind flag)

### Phase 3: Full Release
- All features enabled
- Performance monitoring
- User feedback integration

## Future Enhancements

- **Real-time Updates**: WebSocket price updates
- **Export Features**: CSV/PDF portfolio reports
- **Advanced Analytics**: Correlation analysis, sector performance
- **Mobile App**: Native mobile experience
- **Social Features**: Portfolio sharing, leaderboards
