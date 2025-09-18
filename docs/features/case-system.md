Case System Feature
===================

Overview
--------

The Case System is a comprehensive feature that displays case information and related skins on skin detail pages. It automatically detects which case a skin belongs to and provides navigation to case detail pages.

Problem Solved
--------------

**Before:** Users could only see individual skins without context about which case they came from or what other skins were available in the same case.

**After:** Users can see:
- Which case a skin belongs to
- All other skins contained in that case
- Navigate to dedicated case detail pages
- Access Steam market for cases

Technical Implementation
------------------------

### Backend Architecture

#### Case Controller (`/backend/src/controllers/caseController.js`)

**getCaseById(caseId)**
```javascript
// [API] Get Case by ID — used on Skin Detail "Contained in Case" section
export const getCaseById = async (req, res) => {
  // Find case by name (since we use case names as IDs)
  const caseItem = await prisma.skin.findFirst({
    where: {
      weaponType: "case",
      name: caseId
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      weaponType: true
    }
  });
  
  // Return case metadata with skin count
  res.json(caseInfo);
};
```

**getCaseSkins(caseId)**
```javascript
// [API] List Skins of Case — skin grid on Case pages & Case section
export const getCaseSkins = async (req, res) => {
  // Find skins that belong to this case using pattern matching
  const skins = await prisma.skin.findMany({
    where: {
      weaponType: { not: "case" },
      name: { contains: casePattern, mode: 'insensitive' }
    },
    // ... select fields and ordering
  });
  
  res.json({ skins: skins, total: skins.length });
};
```

**getSkinCase(skinId)**
```javascript
// [API] Resolve Case for Skin — used on Skin Detail to show the parent Case
export const getSkinCase = async (req, res) => {
  // Advanced case mapping logic
  const caseMappings = {
    'fever dream': 'Fever Case',
    'neon revolution': 'Revolution Case',
    'recoil': 'Recoil Case',
    // ... more mappings
  };
  
  const finishToCaseMappings = {
    'case hardened': 'Operation Bravo Case',
    'fade': 'Operation Bravo Case',
    'crimson web': 'Operation Bravo Case',
    // ... more finish mappings
  };
  
  // Try direct patterns first, then finish mappings
  // Return case info or null
};
```

#### Case Routes (`/backend/src/routes/caseRoutes.js`)

```javascript
// Case Routes - Handle case endpoints
import express from "express";
import { getCaseById, getCaseSkins } from "../controllers/caseController.js";
import { optionalClerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Get case by ID (supports both caseId and id parameters)
router.get("/:caseId", optionalClerkAuth, getCaseById);

// Get all skins in a case
router.get("/:caseId/skins", optionalClerkAuth, getCaseSkins);

export default router;
```

### Frontend Architecture

#### Case Section Component (`/frontend/src/components/CaseSection.tsx`)

**Purpose:** Display case information and skins grid on skin detail pages

**Props:**
```typescript
interface CaseSectionProps {
  skinId: number;
}
```

**Features:**
- Fetches case info for the current skin
- Displays case header with thumbnail and metadata
- Shows grid of skins from the same case
- "View Case" button linking to case detail page
- "Open on Steam" button for external access
- Loading and empty states
- Only renders when case is found

**Key Implementation:**
```typescript
export function CaseSection({ skinId }: { skinId: number }) {
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [caseSkins, setCaseSkins] = useState<CaseSkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCaseData() {
      // Fetch the case for the current skin
      const skinCaseRes = await fetchJson(apiUrl(`/api/v1/skins/${skinId}/case-info`));
      const resolvedCase = skinCaseRes.case;

      if (resolvedCase) {
        setCaseInfo(resolvedCase);
        // Fetch all skins for that case
        const skinsRes = await fetchJson(apiUrl(`/api/v1/cases/${resolvedCase.name}/skins`));
        setCaseSkins(skinsRes.skins || []);
      }
    }

    if (skinId) {
      loadCaseData();
    }
  }, [skinId]);

  // Render case section only if case info exists
  if (!caseInfo || caseSkins.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          {/* Case Header: case thumbnail, name, View Case button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                {caseInfo.name}
              </CardTitle>
              {caseInfo.skinCount > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {caseInfo.skinCount} skins
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/cases/${caseInfo.name?.toLowerCase().replace(/\s+/g, '-')}`}>
                  View Case
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`https://steamcommunity.com/market/search?q=${encodeURIComponent(caseInfo.name || '')}`}
                   target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open on Steam
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Case Skins Grid — all skins contained in this case */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {caseSkins.slice(0, 12).map((caseSkin) => (
              <Link key={caseSkin.id} href={`/skins/${caseSkin.id}`} className="group">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group-hover:scale-105 border-2 hover:border-primary/20">
                  <CardContent className="p-3">
                    {/* Skin card content */}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Case Detail Page (`/frontend/src/app/cases/[id]/page.tsx`)

**Purpose:** Complete case information display with all contained skins

**Features:**
- Case header with image and metadata
- Grid of all skins in the case
- Navigation back button
- External Steam market integration
- Loading, error, and not-found states

**Key Implementation:**
```typescript
export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [caseSkins, setCaseSkins] = useState<CaseSkin[]>([]);

  useEffect(() => {
    async function loadCaseData() {
      // Fetch case details
      const caseRes = await fetchJson(apiUrl(`/api/v1/cases/${caseId}`));
      setCaseInfo(caseRes);

      // Fetch skins for the case
      const skinsRes = await fetchJson(apiUrl(`/api/v1/cases/${caseId}/skins`));
      setCaseSkins(skinsRes.skins || []);
    }

    loadCaseData();
  }, [caseId]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Case header and skins grid */}
    </div>
  );
}
```

#### Integration in Skin Detail Page

**Location:** `/frontend/src/app/skins/[skinId]/page.tsx`

**Integration:**
```typescript
// Import CaseSection component
import { CaseSection } from "@/components/CaseSection";

// In the component render:
{/* Contained in Case — shows the case of this skin + grid of all skins from that case */}
{skin && <CaseSection skinId={skin.id} />}

{/* P1 - Related Skins */}
<div className="mb-8">
  <h2 className="text-2xl font-bold mb-4">Related Skins</h2>
  {/* Related skins content */}
</div>
```

Case Mapping Logic
------------------

### Direct Pattern Matching
Maps skin names directly to case names:
```javascript
const caseMappings = {
  'fever dream': 'Fever Case',
  'neon revolution': 'Revolution Case', 
  'recoil': 'Recoil Case',
  'fracture': 'Fracture Case',
  'kilowatt': 'Kilowatt Case',
  'snakebite': 'Snakebite Case',
  'gallery': 'Gallery Case',
  'clutch': 'Clutch Case',
  'cs20': 'CS20 Case',
  'shadow': 'Shadow Case'
};
```

### Skin Finish Mapping
Maps skin finishes to their originating cases:
```javascript
const finishToCaseMappings = {
  'case hardened': 'Operation Bravo Case',
  'fade': 'Operation Bravo Case',
  'crimson web': 'Operation Bravo Case',
  'slaughter': 'Operation Bravo Case',
  'night': 'Operation Bravo Case',
  'blue steel': 'Operation Bravo Case',
  'stained': 'Operation Bravo Case',
  'urban masked': 'Operation Bravo Case',
  'boreal forest': 'Operation Bravo Case',
  'forest ddpat': 'Operation Bravo Case'
};
```

### Generic Pattern Fallback
For edge cases, uses generic pattern matching:
```javascript
const genericPatterns = ['recoil', 'fracture', 'kilowatt', 'revolution', 'snakebite', 
                        'gallery', 'fever', 'clutch', 'cs20', 'shadow', 'prisma', 
                        'dreams', 'falchion', 'danger zone', 'horizon', 'wildfire', 
                        'revolver', 'spectrum'];
```

API Endpoints
-------------

### GET `/api/v1/cases/:caseId`
Get case information by ID.

**Parameters:**
- `caseId` (string) - Case name or ID

**Response:**
```json
{
  "id": 7624,
  "name": "Recoil Case",
  "imageUrl": "https://steamcommunity-a.akamaihd.net/economy/image/...",
  "weaponType": "case",
  "skinCount": 24
}
```

### GET `/api/v1/cases/:caseId/skins`
Get all skins contained in a specific case.

**Parameters:**
- `caseId` (string) - Case name or ID

**Response:**
```json
{
  "skins": [
    {
      "id": 123,
      "name": "AK-47 | Redline (Field-Tested)",
      "wear": "Field-Tested",
      "rarity": "Classified",
      "quality": "Classified",
      "isStattrak": false,
      "isStar": false,
      "priceAvg": 45.50,
      "priceMedian": 44.20,
      "priceLatest": 46.80,
      "imageUrl": "https://steamcommunity-a.akamaihd.net/economy/image/...",
      "weaponType": "rifle",
      "sold24h": 12,
      "offerVolume": 8
    }
  ],
  "total": 24
}
```

### GET `/api/v1/skins/:skinId/case-info`
Resolve the case that contains a specific skin.

**Parameters:**
- `skinId` (number) - Skin ID

**Response (Case Found):**
```json
{
  "case": {
    "id": 7624,
    "name": "Recoil Case",
    "imageUrl": "https://steamcommunity-a.akamaihd.net/economy/image/..."
  }
}
```

**Response (No Case):**
```json
{
  "case": null
}
```

User Experience
---------------

### Skin Detail Page Flow
1. User visits skin detail page
2. Case section loads automatically
3. If case found: displays case header and skins grid
4. If no case: section is hidden (no placeholder)
5. User can click "View Case" to see full case details
6. User can click "Open on Steam" for external access

### Case Detail Page Flow
1. User clicks "View Case" from skin detail page
2. Case detail page loads with case header
3. All skins in case are displayed in grid
4. User can navigate back or access Steam market
5. Each skin card links back to skin detail page

### Visual Design
- **Case Header:** Thumbnail, name, skin count badge
- **Action Buttons:** "View Case" and "Open on Steam"
- **Skins Grid:** Responsive grid with hover effects
- **Loading States:** Skeleton loaders during data fetch
- **Empty States:** Graceful handling when no case found

Error Handling
--------------

### Backend Error Handling
- Try-catch blocks in all case operations
- Graceful 404 responses for missing cases
- Console logging for debugging
- Proper HTTP status codes

### Frontend Error Handling
- Loading states during API calls
- Error boundaries for component failures
- Graceful degradation when case not found
- User-friendly error messages

### Edge Cases
- Skins without cases (section hidden)
- Missing case images (placeholder handling)
- API failures (retry mechanisms)
- Invalid case IDs (404 responses)

Performance Considerations
-------------------------

### Database Optimization
- Indexed queries on `weaponType` and `name` fields
- Limited result sets (pagination ready)
- Efficient pattern matching

### Frontend Optimization
- React state management for component-level caching
- Lazy loading for case detail pages
- Optimized image loading with Next.js Image component
- Responsive grid layouts

### API Optimization
- Single database queries per endpoint
- Minimal data transfer (only required fields)
- Efficient pattern matching algorithms

Future Enhancements
-------------------

### Database Improvements
- Add direct `caseId` foreign key to Skin model
- Create dedicated Case model
- Implement proper case-skin relationships
- Add case metadata (release date, value, etc.)

### Performance
- Redis caching for case data
- CDN for case images
- Database query optimization
- Client-side caching

### Features
- Case opening simulation
- Case value calculations
- Historical case data
- Case recommendation system
- Case comparison tools
- Case market trends

### UI/UX
- Case opening animations
- Interactive case exploration
- Case value tracking
- Case collection management
- Social features (case sharing)

Testing
-------

### Unit Tests
- Case mapping logic
- API endpoint responses
- Component rendering
- Error handling

### Integration Tests
- End-to-end case flow
- API integration
- Database queries
- User interactions

### Manual Testing
- Case section display
- Case detail page navigation
- Steam market integration
- Responsive design
- Error scenarios

Deployment
----------

### Frontend (Vercel)
- Automatic deployment on git push
- Environment variables for API endpoints
- Build optimization with Next.js

### Backend (Render)
- Automatic deployment on git push
- Environment variables for database and Clerk
- Health checks and monitoring

### Database (Supabase)
- PostgreSQL with Prisma ORM
- Connection pooling
- Automated backups

Monitoring
----------

### Error Tracking
- Console logging for debugging
- Error boundaries in React
- API error responses
- Database query monitoring

### Performance Monitoring
- API response times
- Database query performance
- Frontend loading times
- User interaction tracking

### Analytics
- Case section visibility
- Case detail page visits
- Steam market clicks
- User engagement metrics
