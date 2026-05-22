# Skin Detail Page - Feature Documentation

## Overview
The skin detail page (`/skins/[skinId]`) provides comprehensive information about individual CS2 skins, including pricing data, market statistics, and related case information.

## Current Status
- **Status**: ✅ Working
- **Last Updated**: 2025-10-03
- **Frontend URL**: https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app/skins/[skinId]
- **Backend API**: https://cs2-skintracker-dev.onrender.com/api/v1/skins/[skinId]

## Key Features

### 1. Skin Information Display
- **Skin Image**: High-quality skin preview with zoom functionality
- **Basic Info**: Name, market hash name, weapon type, rarity, quality
- **Pricing Data**: Current price, average price, median price, 24h change
- **Market Stats**: 24h volume, offer volume, price trends

### 2. Case Section Integration
- **Dynamic Case Detection**: Automatically detects which case/collection the skin belongs to
- **Case Information**: Shows case name, total skin count, case image
- **Related Skins**: Displays other skins from the same case/collection
- **Navigation**: Links to view full case or Steam marketplace

### 3. Price Charts
- **Historical Data**: Price trends over time
- **Interactive Charts**: Zoom, hover, and detailed tooltips
- **Multiple Timeframes**: Different chart periods available

### 4. User Actions
- **Watchlist**: Add/remove skins from watchlist
- **Portfolio**: Add skins to portfolio with quantity
- **Share**: Share skin links
- **External Links**: Direct links to Steam marketplace

## Technical Implementation

### Frontend Components
- **Main Page**: `frontend/src/app/skins/[skinId]/page.tsx`
- **Case Section**: `frontend/src/components/CaseSection.tsx`
- **Skin Image**: `frontend/src/components/SkinImage.tsx`
- **Price Charts**: `frontend/src/components/charts/simple-price-chart.tsx`

### Backend APIs
- **Skin Details**: `GET /api/v1/skins/[skinId]`
- **Case Info**: `GET /api/v1/skins/[skinId]/case-info`
- **Case Skins**: `GET /api/v1/cases/by-name/[name]/skins`
- **Presets**: `GET /api/v1/skins/presets`

### Data Flow
1. User navigates to `/skins/[skinId]`
2. Frontend fetches skin details from `/api/v1/skins/[skinId]`
3. Frontend fetches case info from `/api/v1/skins/[skinId]/case-info`
4. Frontend fetches related skins from `/api/v1/cases/by-name/[name]/skins`
5. All data is displayed in the UI

## Case System Implementation

### How Cases Work
- **Dynamic Generation**: Cases are generated based on `weaponType` field
- **Collection Naming**: Format: `{weaponType} Collection` (e.g., "Pistol Collection")
- **Skin Grouping**: Skins are grouped by their `weaponType` field
- **Exclusions**: Certain types are excluded (stickers, music kits, agents, etc.)

### Available Cases
- **Pistol Collection**: ~3,233 skins
- **Rifle Collection**: ~2,504 skins  
- **SMG Collection**: ~50 skins
- **Sniper Rifle Collection**: ~50 skins
- **Knife Collection**: ~50 skins
- **Gloves Collection**: ~50 skins
- **Shotgun Collection**: ~50 skins
- **Machinegun Collection**: ~50 skins

### Case Detection Logic
```typescript
// Backend logic in /api/v1/skins/[skinId]/case-info
const shouldShowCollection = skin.weaponType && 
  !excludeTypes.some(type => skin.weaponType.toLowerCase().includes(type));

if (shouldShowCollection) {
  const caseName = `${skin.weaponType.charAt(0).toUpperCase() + skin.weaponType.slice(1)} Collection`;
  // Return case info with skin count
}
```

## Recent Issues & Solutions

### Issue 1: CORS Errors
- **Problem**: Frontend couldn't communicate with backend (503 Service Unavailable)
- **Root Cause**: Backend on free plan was sleeping (cold start)
- **Solution**: Implemented "wake up" mechanism by making multiple requests
- **Status**: ✅ Resolved

### Issue 2: Case Skins Not Displaying
- **Problem**: CaseSection showed "Pistol Collection" but no skins
- **Root Cause**: Backend was sleeping, causing API failures
- **Solution**: Backend wake-up resolved the issue
- **Status**: ✅ Resolved

### Issue 3: Case Name Mismatch
- **Problem**: Frontend sent "Pistol Collection" but backend expected "pistol"
- **Root Cause**: Case name normalization issue
- **Solution**: Updated backend to remove "Collection" suffix and convert to lowercase
- **Status**: ✅ Resolved

## API Endpoints

### GET /api/v1/skins/[skinId]
Returns detailed skin information including pricing and market data.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5124,
    "name": "calligraffiti",
    "marketHashName": "Desert Eagle | Calligraffiti (Well-Worn)",
    "imageUrl": "https://...",
    "weaponType": "pistol",
    "rarity": "Classified",
    "quality": "Well-Worn",
    "priceAvg": 36.92,
    "priceMedian": 35.50,
    "priceLatest": 36.92,
    "sold24h": 15,
    "offerVolume": 8
  }
}
```

### GET /api/v1/skins/[skinId]/case-info
Returns case information for a specific skin.

**Response:**
```json
{
  "case": {
    "id": 5124,
    "name": "Pistol Collection",
    "imageUrl": "/images/placeholder-case.png",
    "skinCount": 3233
  }
}
```

### GET /api/v1/cases/by-name/[name]/skins
Returns all skins from a specific case/collection.

**Response:**
```json
{
  "skins": [
    {
      "id": 5124,
      "name": "calligraffiti",
      "weaponType": "pistol",
      "rarity": "Classified",
      "quality": "Well-Worn",
      "priceAvg": 36.92,
      "imageUrl": "https://..."
    }
    // ... more skins
  ]
}
```

## Frontend State Management

### State Variables
- `skin`: Current skin data
- `caseInfo`: Case information
- `caseSkins`: Related skins from the same case
- `loading`: Loading states
- `error`: Error states
- `userData`: User portfolio and watchlist data

### Key Hooks
- `useUser()`: Clerk authentication
- `useAuth()`: Authentication state
- `useAnalytics()`: Analytics tracking
- `useRouter()`: Navigation
- `useSearchParams()`: URL parameters

## Styling & UI

### Design System
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts

### Key UI Elements
- **Skin Image**: Large preview with zoom
- **Price Display**: Formatted currency with trend indicators
- **Case Grid**: Responsive grid of related skins
- **Action Buttons**: Watchlist, portfolio, share, external links
- **Breadcrumbs**: Navigation context
- **Loading States**: Skeleton loaders

## Performance Considerations

### Optimization
- **Image Loading**: Lazy loading for skin images
- **API Caching**: Response caching where appropriate
- **Code Splitting**: Dynamic imports for heavy components
- **Bundle Size**: Tree shaking and optimization

### Monitoring
- **Error Tracking**: Console error logging
- **Performance**: Analytics tracking
- **User Actions**: Button click tracking

## Future Enhancements

### Planned Features
1. **Enhanced Case Navigation**: Browse all cases from a central page
2. **Skin Comparison**: Compare multiple skins side by side
3. **Price Alerts**: Set price alerts for specific skins
4. **Advanced Filtering**: Filter case skins by rarity, price, etc.
5. **Social Features**: Share collections, rate skins

### Technical Improvements
1. **Caching Strategy**: Implement Redis caching for API responses
2. **Real-time Updates**: WebSocket integration for live price updates
3. **Mobile Optimization**: Enhanced mobile experience
4. **Accessibility**: WCAG compliance improvements

## Testing

### Manual Testing
- ✅ Skin detail page loads correctly
- ✅ Case section displays related skins
- ✅ Price charts render properly
- ✅ User actions work (watchlist, portfolio)
- ✅ External links function correctly

### Automated Testing
- **Unit Tests**: Component testing with Jest
- **E2E Tests**: Playwright tests for critical flows
- **API Tests**: Backend endpoint testing

## Dependencies

### Frontend
- `next`: 14.x
- `react`: 18.x
- `@clerk/nextjs`: Authentication
- `tailwindcss`: Styling
- `recharts`: Charts
- `lucide-react`: Icons

### Backend
- `express`: Web framework
- `prisma`: Database ORM
- `cors`: CORS handling
- `helmet`: Security headers

## Deployment

### Frontend
- **Platform**: Vercel
- **Branch**: feature/cursor-workflow
- **URL**: https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app

### Backend
- **Platform**: Render
- **Branch**: feature/cursor-workflow
- **URL**: https://cs2-skintracker-dev.onrender.com

## Troubleshooting

### Common Issues
1. **CORS Errors**: Backend sleeping on free plan
2. **Case Skins Not Loading**: API timeout or rate limiting
3. **Image Loading Issues**: CDN or network problems
4. **Authentication Errors**: Clerk configuration issues

### Debug Steps
1. Check browser console for errors
2. Verify API endpoints are responding
3. Check network tab for failed requests
4. Verify authentication state
5. Check backend logs on Render

## Related Documentation
- [[API|API Documentation]]
- [[ARCHITECTURE|Architecture Overview]]
- [[case-system|Case System]]
- [[enhanced-skins-filters|Enhanced Skins Filters]]
