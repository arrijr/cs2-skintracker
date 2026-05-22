# Case System - Feature Documentation

## Overview
The case system dynamically generates "collections" based on weapon types in the CS2 skin database. It groups skins by their `weaponType` field and presents them as browsable collections.

## Current Status
- **Status**: ✅ Working
- **Last Updated**: 2025-10-03
- **Backend**: https://cs2-skintracker-dev.onrender.com
- **Frontend**: https://cs2-skintracker-git-feature-cursor-workflow-arrijrs-projects.vercel.app

## How It Works

### Dynamic Case Generation
The system doesn't use traditional "cases" but instead creates collections based on weapon types:

1. **Skin Analysis**: Each skin has a `weaponType` field (e.g., "pistol", "rifle", "smg")
2. **Collection Creation**: System creates collections like "Pistol Collection", "Rifle Collection"
3. **Skin Grouping**: All skins with the same `weaponType` are grouped together
4. **Exclusions**: Certain types are excluded (stickers, music kits, agents, etc.)

### Case Name Generation Logic
```typescript
// Backend logic in /api/v1/skins/[skinId]/case-info
let caseName = skin.weaponType || "Unknown Collection";

// Special formatting for specific types
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

## Available Collections

### Primary Collections
| Collection Name | Weapon Type | Skin Count | Description |
|----------------|-------------|------------|-------------|
| Pistol Collection | pistol | ~3,233 | All pistol skins |
| Rifle Collection | rifle | ~2,504 | All rifle skins |
| SMG Collection | smg | ~50 | All SMG skins |
| Sniper Rifle Collection | sniper rifle | ~50 | All sniper rifle skins |
| Knife & Glove Collection | knife, gloves | ~50 | All knife and glove skins |
| Shotgun Collection | shotgun | ~50 | All shotgun skins |
| Machinegun Collection | machinegun | ~50 | All machinegun skins |

### Excluded Types
These weapon types are excluded from collections:
- `agent` - Player agents
- `charm` - Weapon charms
- `collectible` - Collectible items
- `container` - Cases and containers
- `equipment` - Equipment items
- `gift` - Gift items
- `graffiti` - Graffiti sprays
- `key` - Case keys
- `music kit` - Music kits
- `pass` - Operation passes
- `patch` - Patches
- `sticker` - Stickers
- `tag` - Name tags
- `tool` - Tools

## API Endpoints

### GET /api/v1/skins/[skinId]/case-info
Returns case information for a specific skin.

**Request:**
```
GET /api/v1/skins/5124/case-info
```

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

**Logic:**
1. Fetch skin by ID
2. Check if skin should show collection (exclude certain types)
3. Generate collection name based on weaponType
4. Count skins in same collection
5. Return case information

### GET /api/v1/cases/by-name/[name]/skins
Returns all skins from a specific collection.

**Request:**
```
GET /api/v1/cases/by-name/Pistol%20Collection/skins
```

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

**Logic:**
1. Extract weapon type from collection name (remove "Collection" suffix)
2. Convert to lowercase for database query
3. Query skins by weaponType
4. Return paginated results

### GET /api/v1/skins/presets
Returns all available weapon types for filtering.

**Request:**
```
GET /api/v1/skins/presets
```

**Response:**
```json
{
  "weaponTypes": [
    "pistol",
    "rifle",
    "smg",
    "sniper rifle",
    "knife",
    "gloves",
    "shotgun",
    "machinegun"
  ]
}
```

## Database Schema

### Skin Model
```prisma
model Skin {
  id          Int     @id @default(autoincrement())
  name        String
  weaponType  String? // Used for case grouping
  itemGroup   String?
  rarity      String?
  quality     String?
  wear        String?
  // ... other fields
}
```

### Key Fields for Case System
- **weaponType**: Primary field for case grouping
- **itemGroup**: Secondary field for additional categorization
- **rarity**: Used for filtering within cases
- **quality**: Used for filtering within cases
- **wear**: Used for filtering within cases

## Frontend Integration

### CaseSection Component
The `CaseSection` component automatically detects and displays case information:

```typescript
// Usage in skin detail page
<CaseSection skinId={skinId} />
```

**Features:**
- Automatic case detection
- Related skins display
- Responsive grid layout
- Loading states
- Error handling

### Navigation
Users can navigate to different collections by visiting skins of different weapon types:
- **Pistol Collection**: Visit any pistol skin
- **Rifle Collection**: Visit any rifle skin
- **SMG Collection**: Visit any SMG skin
- etc.

## Recent Issues & Solutions

### Issue 1: Case Name Mismatch
- **Problem**: Frontend sent "Pistol Collection" but backend expected "pistol"
- **Root Cause**: Case name normalization issue
- **Solution**: Updated backend to remove "Collection" suffix and convert to lowercase
- **Code**: 
  ```typescript
  const weaponType = name.replace(/\s+Collection$/, '').toLowerCase();
  ```

### Issue 2: CORS Errors
- **Problem**: Frontend couldn't communicate with backend
- **Root Cause**: Backend CORS configuration
- **Solution**: Implemented dual-layer CORS protection
- **Status**: ✅ Resolved

### Issue 3: Backend Sleeping
- **Problem**: 503 Service Unavailable errors
- **Root Cause**: Backend on free plan goes to sleep
- **Solution**: Implemented wake-up mechanism
- **Status**: ✅ Resolved

## Performance Considerations

### Database Queries
- **Indexing**: weaponType field is indexed for fast queries
- **Pagination**: Large collections are paginated
- **Caching**: API responses are cached where appropriate

### Frontend Optimization
- **Lazy Loading**: Images load on demand
- **Virtual Scrolling**: For very large collections
- **Memoization**: Prevents unnecessary re-renders

## Future Enhancements

### Planned Features
1. **Case Overview Page**: Browse all available collections
2. **Enhanced Filtering**: Filter by rarity, price, quality, etc.
3. **Sorting Options**: Sort by price, rarity, name, etc.
4. **Search**: Search within collections
5. **Comparison**: Compare skins within collections

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Caching**: Redis caching for better performance
3. **Image Optimization**: WebP format, lazy loading
4. **Mobile Optimization**: Enhanced mobile experience

## Testing

### Backend Testing
- **Unit Tests**: Test case name generation logic
- **Integration Tests**: Test API endpoints
- **Database Tests**: Test query performance

### Frontend Testing
- **Component Tests**: Test CaseSection component
- **E2E Tests**: Test full user flow
- **API Contract Tests**: Test API responses

## Monitoring

### Metrics
- **API Response Times**: Monitor endpoint performance
- **Error Rates**: Track API failures
- **Usage Statistics**: Track collection views
- **Database Performance**: Monitor query times

### Logging
- **API Logs**: Log all case-related requests
- **Error Logs**: Track and analyze errors
- **Performance Logs**: Monitor response times

## Configuration

### Environment Variables
- **DATABASE_URL**: Database connection string
- **CORS_ORIGIN**: Allowed frontend origins
- **API_RATE_LIMIT**: Rate limiting configuration

### Database Configuration
- **Connection Pool**: Optimized for concurrent requests
- **Query Timeout**: 30 seconds
- **Retry Logic**: 3 attempts with exponential backoff

## Security Considerations

### API Security
- **Rate Limiting**: Prevent abuse
- **CORS**: Proper origin validation
- **Input Validation**: Sanitize all inputs
- **SQL Injection**: Parameterized queries

### Data Privacy
- **No Personal Data**: Only skin data is stored
- **Public Data**: All data is publicly available
- **No Authentication**: No user data required

## Troubleshooting

### Common Issues
1. **Case Not Found**: Check weaponType field
2. **Empty Collections**: Verify skin data
3. **API Timeouts**: Check database performance
4. **CORS Errors**: Verify CORS configuration

### Debug Steps
1. Check API logs for errors
2. Verify database queries
3. Test API endpoints directly
4. Check frontend console for errors
5. Verify CORS headers

## Related Documentation
- [[skin-detail-page|Skin Detail Page]]
- [[case-section-component|Case Section Component]]
- [[API|API Documentation]]
- [[ARCHITECTURE|Architecture Overview]]