# Case Section Component - Feature Documentation

## Overview
The CaseSection component displays case information and related skins for a given skin. It automatically detects which case/collection a skin belongs to and shows other skins from the same case.

## Current Status
- **Status**: ✅ Working
- **Last Updated**: 2025-10-03
- **File**: `frontend/src/components/CaseSection.tsx`

## Component Interface

### Props
```typescript
interface CaseSectionProps {
  skinId: number;
}
```

### State
```typescript
const [caseInfo, setCaseInfo] = useState<Case | null>(null);
const [caseSkins, setCaseSkins] = useState<CaseSkin[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

## Data Types

### Case Interface
```typescript
interface Case {
  id: number;
  name: string;
  imageUrl: string;
  skinCount: number;
}
```

### CaseSkin Interface
```typescript
interface CaseSkin {
  id: number;
  name: string;
  wear: string;
  rarity: string;
  quality: string;
  isStattrak: boolean;
  isStar: boolean;
  priceAvg: number;
  priceMedian: number;
  priceLatest: number;
  imageUrl: string;
  weaponType: string;
  sold24h: number;
  offerVolume: number;
}
```

## Component Logic

### Data Loading Flow
1. **Case Info**: Fetches case information for the current skin
2. **Case Skins**: Fetches all skins from the same case
3. **Error Handling**: Gracefully handles API failures
4. **Loading States**: Shows skeleton loaders during data fetch

### API Calls
```typescript
// 1. Get case info for current skin
const caseResponse = await fetchJson(apiUrl(`/api/v1/skins/${skinId}/case-info`));

// 2. Get all skins from this case
const skinsResponse = await fetchJson(apiUrl(`/api/v1/cases/by-name/${encodeURIComponent(caseResponse.case.name)}/skins`));
```

## UI Components

### Case Header
- **Case Name**: Displayed prominently
- **Skin Count**: Shows total number of skins in case
- **Action Buttons**: "View Case" and "Steam" buttons
- **Case Image**: Placeholder or actual case image

### Skins Grid
- **Responsive Grid**: Adapts to different screen sizes
- **Skin Cards**: Each showing:
  - Skin image with "Case" label
  - Skin name
  - Price (formatted currency)
  - Wear condition
  - Rarity badge
- **Navigation**: Links to individual skin pages

### Loading States
- **Skeleton Loader**: Shows while data is loading
- **Error Handling**: Gracefully handles failures
- **Empty States**: Shows when no case is found

## Styling

### CSS Classes
- **Container**: `mb-8` for margin bottom
- **Grid**: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4`
- **Cards**: `group cursor-pointer` for hover effects
- **Images**: `aspect-square object-cover` for consistent sizing

### Responsive Design
- **Mobile**: 2 columns
- **Tablet**: 3 columns
- **Desktop**: 4 columns
- **Large Desktop**: 6 columns

## Integration

### Usage in Skin Detail Page
```typescript
import { CaseSection } from "@/components/CaseSection";

// In the skin detail page
<CaseSection skinId={skinId} />
```

### Dependencies
- **Next.js**: Link component for navigation
- **Shadcn/ui**: Card, Button, Badge, Skeleton components
- **Lucide React**: ExternalLink, Package icons
- **Custom Hooks**: apiUrl, fetchJson from lib/api

## Backend Integration

### Required APIs
1. **GET /api/v1/skins/[skinId]/case-info**
   - Returns case information for a skin
   - Handles case name generation based on weaponType
   - Excludes certain skin types (stickers, music kits, etc.)

2. **GET /api/v1/cases/by-name/[name]/skins**
   - Returns all skins from a specific case
   - Handles case name normalization
   - Supports pagination and filtering

### Case Name Generation
```typescript
// Backend logic for case name generation
let caseName = skin.weaponType || "Unknown Collection";

// Format collection name for better display
if (caseName.includes("knife") || caseName.includes("gloves")) {
  caseName = "Knife & Glove Collection";
} else if (caseName.includes("2018") || caseName.includes("2019") || ...) {
  caseName = caseName.replace(/(\d{4})/, '$1 Major Collection');
} else if (caseName.includes("souvenir")) {
  caseName = "Souvenir Collection";
} else {
  caseName = `${caseName.charAt(0).toUpperCase() + caseName.slice(1)} Collection`;
}
```

## Error Handling

### API Errors
- **Network Errors**: Shows error message
- **404 Errors**: Gracefully handles missing cases
- **Timeout Errors**: Retries with exponential backoff

### Edge Cases
- **No Case Found**: Component doesn't render
- **Empty Case**: Shows appropriate message
- **Invalid Skin ID**: Handles gracefully

## Performance Considerations

### Optimization
- **Lazy Loading**: Images load on demand
- **Memoization**: Prevents unnecessary re-renders
- **Error Boundaries**: Isolates component errors
- **Loading States**: Improves perceived performance

### Caching
- **API Responses**: Cached at browser level
- **Images**: CDN caching for skin images
- **Component State**: Preserved during navigation

## Testing

### Unit Tests
- **Component Rendering**: Tests basic rendering
- **State Management**: Tests state updates
- **Error Handling**: Tests error scenarios
- **API Integration**: Mocks API calls

### Integration Tests
- **End-to-End**: Tests full user flow
- **API Contract**: Tests API responses
- **Error Scenarios**: Tests failure cases

## Recent Issues & Solutions

### Issue 1: Case Skins Not Displaying
- **Problem**: Component showed case info but no skins
- **Root Cause**: Backend was sleeping (503 errors)
- **Solution**: Implemented backend wake-up mechanism
- **Status**: ✅ Resolved

### Issue 2: Case Name Mismatch
- **Problem**: Frontend sent "Pistol Collection" but backend expected "pistol"
- **Root Cause**: Case name normalization issue
- **Solution**: Updated backend to handle collection names
- **Status**: ✅ Resolved

### Issue 3: CORS Errors
- **Problem**: Frontend couldn't communicate with backend
- **Root Cause**: Backend CORS configuration
- **Solution**: Implemented dual-layer CORS protection
- **Status**: ✅ Resolved

## Future Enhancements

### Planned Features
1. **Enhanced Filtering**: Filter case skins by rarity, price, etc.
2. **Sorting Options**: Sort by price, rarity, name, etc.
3. **Pagination**: Handle large cases with pagination
4. **Search**: Search within case skins
5. **Comparison**: Compare multiple skins from case

### Technical Improvements
1. **Virtual Scrolling**: Handle very large cases
2. **Image Optimization**: WebP format, lazy loading
3. **Caching Strategy**: Implement proper caching
4. **Error Recovery**: Better error recovery mechanisms

## Dependencies

### Frontend Dependencies
```json
{
  "next": "14.x",
  "react": "18.x",
  "@clerk/nextjs": "latest",
  "tailwindcss": "latest",
  "lucide-react": "latest"
}
```

### Backend Dependencies
```json
{
  "express": "latest",
  "prisma": "latest",
  "cors": "latest"
}
```

## Configuration

### Environment Variables
- **NEXT_PUBLIC_API_URL**: Backend API URL
- **CLERK_PUBLISHABLE_KEY**: Authentication key

### API Configuration
- **Base URL**: https://cs2-skintracker-dev.onrender.com
- **Timeout**: 30 seconds
- **Retry Logic**: 3 attempts with exponential backoff

## Monitoring

### Analytics
- **Component Usage**: Track component renders
- **API Calls**: Monitor API performance
- **Error Rates**: Track error frequencies
- **User Interactions**: Track button clicks

### Logging
- **Console Logs**: Development debugging
- **Error Tracking**: Production error monitoring
- **Performance**: API response times

## Related Documentation
- [[skin-detail-page|Skin Detail Page]]
- [[case-system|Case System]]
- [[API|API Documentation]]
- [[ARCHITECTURE|Architecture Overview]]
