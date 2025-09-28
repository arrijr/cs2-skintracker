API Documentation
=================

Base URL
--------

* **Backend Host (Render):** wird über `NEXT_PUBLIC_API_ORIGIN` konfiguriert.
* **Frontend (Vercel)** hostet **keine** API-Routen — alle Requests müssen an den Render-Host gehen.
* Basispräfix: `/api/v1`

Examples
--------

* Local: `NEXT_PUBLIC_API_ORIGIN=http://localhost:5000`
* DEV: `NEXT_PUBLIC_API_ORIGIN=https://cs2-skintracker-dev.onrender.com`
* PROD: `NEXT_PUBLIC_API_ORIGIN=https://cs2-skintracker.onrender.com`

Authentication
--------------

Most endpoints require a JWT token in the `Authorization` header:

    Authorization: Bearer <token>

**Clerk JWT Verification:**
- Frontend uses `getToken({ template: "backend" })` to get backend-compatible tokens
- Backend verifies tokens using JWKS from `CLERK_JWKS_URL`
- Audience must match `CLERK_AUDIENCE` environment variable
- Issuer must match `CLERK_ISSUER` environment variable

**Environment Variables (Backend):**
- `CLERK_ISSUER` - Clerk issuer URL (e.g., https://your-subdomain.clerk.accounts.dev)
- `CLERK_JWKS_URL` - JWKS endpoint (e.g., https://your-subdomain.clerk.accounts.dev/.well-known/jwks.json)
- `CLERK_AUDIENCE` - JWT audience claim (e.g., cs2-skintracker-api-dev)
- `NODE_ENV` - Environment (development/production) affects logging verbosity

Error Format
------------

* Einheitlich: `{ "error": "message" }`
* Wichtige Statuscodes:
  * 400 – validation error / bad request
  * 401 – invalid/expired token (Client: Auto-Logout)
  * 403 – insufficient permissions (e.g., admin only)
  * 404 – not found
  * 429 – rate limited (falls aktiviert)
  * 5xx – server error

Client Rules
------------

* Alle Fetches **nur** über `apiUrl('/api/v1/...')` aus `@/lib/api`.
* Zentralen Helper verwenden: `fetchJson()` oder `swrFetcher` für SWR.
* Keine relativen URLs wie `/api/v1/...` im Frontend-Code.
* Keine Hardcoded-URLs; `NEXT_PUBLIC_API_ORIGIN` ohne trailing slash.

Caching
-------

* Standard: `no-store` für mutierende/benutzerbezogene Daten.
* Preis-/Marktdaten können kurzzeitig gecacht werden (bis zu 60s), sofern verfügbar.

Endpoints
---------

Skins
-----

#### GET `/skins`
Get all skins with filtering, sorting, and pagination.

**Query Parameters**
* `q` – Search query
* `min` – Minimum price filter
* `max` – Maximum price filter
* `rarity` – Rarity filter
* `wear` – Wear filter
* `quality` – Quality filter
* `stattrak` – StatTrak filter (`true|false`)
* `special` – Special/Star filter (`true|false`)
* `category` – Category filter (knives, gloves, pistols, etc.)
* `sort` – `name_asc|name_desc|price_asc|price_desc|newest|popularity_desc|wear_asc|wear_desc`
* `page` – Page number (default: 1)
* `pageSize` – Items per page (default: 24, max: 60)

**Response**
```json
{
  "items": [...],
  "total": 1234,
  "page": 1,
  "pageSize": 24
}
GET /skins/search
Search skins by name or market hash name.

Query Parameters

query – Search term (min 2 characters)

Response

json
Code kopieren
[
  { "id": 1, "name": "AK-47 | Redline", "marketHashName": "AK-47 | Redline (Field-Tested)" }
]
#### GET `/skins/:skinId`
Get skin details by ID.

**Response**
```json
{
  "id": 20,
  "name": "★ StatTrak™ Gut Knife | Urban Masked (Minimal Wear)",
  "marketHashName": "★ StatTrak™ Gut Knife | Urban Masked (Minimal Wear)",
  "marketPrice": 190.4,
  "imageUrl": "https://community.akamai.steamstatic.com/...",
  "weaponType": "gut knife",
  "itemGroup": "knife"
}
```

#### GET `/skins/:skinId/history`
Get price history for a skin.

**Response**
```json
[
  { "date": "2025-01-01", "price": 185.50 },
  { "date": "2025-01-02", "price": 190.40 }
]
```

#### GET `/skins/:skinId/market-stats`
Get market statistics for a skin.

**Response**
```json
{
  "volume24h": 150,
  "volume7d": 1200,
  "volume30d": 5000,
  "currentPrice": 25.50,
  "medianPrice": 24.00,
  "lowestPrice": 20.00,
  "maxPrice": 30.00,
  "avgPrice": 24.50,
  "buyOrders": 45,
  "listings": 120,
  "lastUpdated": "2025-09-01T13:14:51.825Z"
}
```

**Notes**
* Preise können als `string` (z.B. "10,13€") oder `number` kommen → **Client MUSS normalisieren** (siehe `numberOrNull()`).
* Felder dürfen `null` sein, wenn Quelle fehlt.

#### GET `/skins/:skinId/variants`
Get skin variants (same skin, different wear/quality).

**Response**
```json
[
  {
    "id": 19122,
    "name": "★ StatTrak™ Gut Knife | Urban Masked",
    "wear": "Factory New",
    "quality": "Covert",
    "isStattrak": true,
    "isStar": true,
    "priceAvg": 250.00,
    "priceMedian": 245.00,
    "priceLatest": 250.00,
    "imageUrl": "https://example.com/skin1.jpg"
  },
  {
    "id": 19123,
    "name": "★ StatTrak™ Gut Knife | Urban Masked",
    "wear": "Minimal Wear",
    "quality": "Covert",
    "isStattrak": true,
    "isStar": true,
    "priceAvg": 190.40,
    "priceMedian": 185.00,
    "priceLatest": 190.40,
    "imageUrl": "https://example.com/skin2.jpg",
    "isActive": true
  }
]
```

**Notes**
* Returns array of skin variants, not object with variants property
* `priceLatest`, `priceAvg`, `priceMedian` can be null → Client shows "—"
* `isActive` marks the current skin variant (added to first item in array)
* Variants are found by matching `weaponType` and either `itemName` or similar name patterns

#### GET `/skins/:skinId/case`
Get case information for a skin.

**200 Response**
```json
{
  "caseName": "Revolution Case",
  "skins": [
    {
      "id": 19125,
      "name": "AK-47 | Redline",
      "wear": "Field-Tested",
      "rarity": "Classified",
      "quality": "Classified",
      "isStattrak": false,
      "priceLatest": 15.50,
      "imageUrl": "https://example.com/ak47.jpg"
    }
  ],
  "totalSkins": 3
}
```

**204 No Content** → keine Case-Daten; Client blendet Panel aus.

#### GET `/skins/:skinId/related`
Get related skins (similar weapon type, collection, or characteristics).

**Response**
```json
[
  {
    "id": 19125,
    "name": "AK-47 | Redline",
    "imageUrl": "https://example.com/ak47.jpg",
    "priceAvg": 15.50,
    "priceMedian": 15.00,
    "priceLatest": 15.50,
    "wear": "Field-Tested",
    "rarity": "Restricted",
    "isStattrak": false,
    "isStar": false
  }
]
```

**Notes**
* Returns array of related skins (max 12)
* Related skins are found by matching `weaponType`, `itemName`, or similar name patterns
* `priceLatest`, `priceAvg`, `priceMedian` can be null → Client shows "—"
{
  "id": 1,
  "name": "AK-47 | Redline",
  "marketHashName": "AK-47 | Redline (Field-Tested)",
  "imageUrl": "https://...",
  "marketPrice": 15.50,
  "weaponType": "rifle",
  "wear": "Field-Tested",
  "rarity": "Restricted",
  "quality": "Consumer Grade"
}
GET /skins/:skinId/history
Get price history for a skin.

Response

json
Code kopieren
[
  { "date": "2024-01-01T00:00:00.000Z", "price": 15.50 }
]
GET /skins/:skinId/market-stats
Get market statistics for a skin.

Notes

volume24h entspricht dem Steam-Priceoverview-volume (≈ verkaufte Stücke/24h).

listings nur falls Datenquelle verfügbar ist, sonst null.

Response

json
Code kopieren
{
  "volume24h": 150,
  "volume7d": 1200,
  "volume30d": 5000,
  "currentPrice": 15.50,
  "medianPrice": 15.00,
  "minPrice": 12.00,
  "maxPrice": 20.00,
  "avgPrice": 15.25,
  "buyOrders": 45,
  "listings": 23,
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
GET /skins/:skinId/variants
Get variants of the same skin (different wear/quality).

Response

json
Code kopieren
{
  "variants": [
    {
      "id": 2,
      "name": "AK-47 | Redline",
      "wear": "Factory New",
      "quality": "Consumer Grade",
      "isStattrak": false,
      "isStar": false,
      "priceLatest": 25.00,
      "imageUrl": "https://..."
    }
  ],
  "currentSkin": { "name": "AK-47 | Redline", "weaponType": "rifle", "itemGroup": "rifle" }
}
GET /skins/:skinId/case
Get case information for a skin.

Responses

200 – Case vorhanden

204 – Keine Case-Daten gepflegt (Client: Panel ausblenden)

json
Code kopieren
{
  "caseName": "Operation Bravo Case",
  "skins": [
    {
      "id": 3,
      "name": "AK-47 | Redline",
      "wear": "Field-Tested",
      "rarity": "Restricted",
      "quality": "Consumer Grade",
      "isStattrak": false,
      "priceLatest": 15.50,
      "imageUrl": "https://..."
    }
  ],
  "totalSkins": 12
}
GET /skins/filters
Get available filter options.

Response

json
Code kopieren
{
  "weaponTypes": ["rifle", "pistol", "smg"],
  "wears": ["Factory New", "Minimal Wear", "Field-Tested"],
  "rarities": ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade"],
  "qualities": ["Consumer Grade", "Industrial Grade"]
}
GET /skins/categories
Get skin categories with counts.

Response

json
Code kopieren
{
  "ok": true,
  "categories": { "knives": { "count": 150, "weaponTypes": ["knife"] } },
  "totalSkins": 5000
}
GET /skins/presets
Get preset values for UI.

Response

json
Code kopieren
{
  "wears": ["Factory New", "Minimal Wear", "Field-Tested"],
  "rarities": ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade"]
}

Cases
-----

#### GET `/cases/:caseId`
Get case information by ID.

**Parameters:**
* `caseId` (string) - Case name or ID (e.g., "recoil-case", "operation-bravo-case")

**Response**
```json
{
  "id": 7624,
  "name": "Recoil Case",
  "imageUrl": "https://steamcommunity-a.akamaihd.net/economy/image/...",
  "weaponType": "case",
  "skinCount": 24
}
```

**404 Not Found** → Case does not exist.

#### GET `/cases/:caseId/skins`
Get all skins contained in a specific case.

**Parameters:**
* `caseId` (string) - Case name or ID

**Response**
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

#### GET `/skins/:skinId/case-info`
Resolve the case that contains a specific skin.

**Parameters:**
* `skinId` (number) - Skin ID

**Response**
```json
{
  "case": {
    "id": 7624,
    "name": "Recoil Case",
    "imageUrl": "https://steamcommunity-a.akamaihd.net/economy/image/..."
  }
}
```

**Response (No Case)**
```json
{
  "case": null
}
```

**Case Mapping Logic:**
* **Direct Patterns:** "recoil" → "Recoil Case", "fever dream" → "Fever Case"
* **Skin Finishes:** "case hardened" → "Operation Bravo Case", "fade" → "Operation Bravo Case"
* **Generic Patterns:** Fallback matching for edge cases

Watchlist
---------

#### GET `/watchlist` — requires JWT
Get user's watchlist with price alerts.

**Response**
```json
[
  {
    "id": 1,
    "skinId": 123,
    "priceAlert": 15.50,
    "skin": {
      "id": 123,
      "name": "AK-47 | Redline",
      "imageUrl": "https://example.com/ak47.jpg",
      "priceLatest": 16.00
    }
  }
]
```

#### POST `/watchlist` — requires JWT
Add skin to watchlist with optional price alert.

**Request**
```json
{
  "skinId": 123,
  "priceAlert": 15.50
}
```

**Response**
```json
{
  "message": "Added to watchlist",
  "id": 1
}
```

#### PATCH `/watchlist/:skinId` — requires JWT
Update price alert for a skin in watchlist.

**Request**
```json
{
  "priceAlert": 20.00
}
```

**Response**
```json
{
  "message": "Price alert updated",
  "skinId": 123,
  "priceAlert": 20.00
}
```

#### DELETE `/watchlist/:skinId` — requires JWT
Remove skin from watchlist.

**Response**
```json
{
  "message": "Removed from watchlist"
}
```

**Notes**
* Only 1 price alert allowed per user across all skins
* `priceAlert` can be null to remove alert without removing from watchlist
* Price alerts are used for notifications when target price is reached

Users
-----

POST /users/sync — requires JWT
Sync user data from Clerk JWT to database.

Request: { "userId": "user_123", "email": null, "firstName": null, "lastName": null }

Response: { "ok": true, "id": 1, "message": "User synced successfully" }

Error Codes:
- 401 NO_BEARER_TOKEN - Missing Authorization header
- 401 INVALID_JWT - Invalid or expired JWT token
- 422 MISSING_SUB - JWT token missing 'sub' claim
- 500 SYNC_ERROR - Database sync failed

Health
------

GET /health
Basic health check.

Response: { "ok": true, "ts": "2024-01-01T00:00:00.000Z", "service": "CS2 Skin Tracker API" }

GET /health/build-info
Build and system information.

Response: { "ok": true, "version": "1.0.0", "buildTime": "...", "gitCommit": "...", "nodeVersion": "v18.17.0", "environment": "development", "uptime": "3600", "memory": {...}, "platform": {...} }

GET /health/clerk — requires JWT
Test Clerk JWT verification.

Response: { "ok": true, "sub": "user_123", "message": "Clerk JWT verification successful" }

GET /health/cron-status
Check cron job status.

Response: { "ok": true, "priceHistoryLastRun": "2024-01-01T00:00:00.000Z", "portfolioHistoryLastRun": "2024-01-01T00:00:00.000Z", "now": "2024-01-01T00:00:00.000Z" }

Admin
-----

GET /admin/overview — requires JWT + admin

* Response: `{ "lastPriceUpdate": string|null, "pricesWritten24h": number, "priceCoverage": number, "portfolioSnapshotLastRun": string|null, "alerts24h": { ... } }`

GET /admin/jobs — requires JWT + admin

* Response: `{ "jobs": [{ "name": string, "lastRun": string, "status": "completed|failed|running", "duration": string, "resultCounts": { [key: string]: number } }], "pagination": { ... } }`

GET /admin/logs — requires JWT + admin

* Query: `page`, `limit`, `action`, `resource`
* Response: `{ "logs": [{ "id": number, "action": string, "resource": string, "details": string|null, "createdAt": string, "admin": { "email": string } }], "pagination": { ... } }`

POST /admin/jobs/skin-prices — requires JWT + admin

* Body: `{ "take": number, "category"?: string, "rarity"?: string, "ids"?: number[], "dryRun"?: boolean }`
* Notes: In production, writes are disabled unless `ALLOW_ADMIN_WRITES_IN_PROD` is set.

POST /admin/jobs/portfolio-snapshots — requires JWT + admin

* Body: `{ "userId"?: number, "batchSize"?: number, "dryRun"?: boolean }`

POST /admin/jobs/alert-check — requires JWT + admin

* Body: `{ "limit"?: number, "optInOnly"?: boolean, "dryRun"?: boolean }`

GET /admin/health — requires JWT + admin

* Response: `{ "status": "healthy", "timestamp": "...", "admin": true }`

GET /admin/ping — requires JWT + admin

* Response: `{ "message": "admin ok", "user": "...", "timestamp": "..." }`

POST /admin/cache/steam/clear — requires JWT + admin

* Response: `{ "success": true, "message": "Cleared X cache entries", "clearedCount": number, "timestamp": "..." }`

GET /admin/coverage/overview — requires JWT + admin

* Response: `{ "totalSkins": number, "skinsWithRecentPrices": number, "coveragePercentage": number, "skinsWithoutHistory": number, "medianLastPriceAge": string|null, "sevenDaysAgo": string, "thirtyDaysAgo": string }`

GET /admin/coverage/segments — requires JWT + admin

* Query: `segmentType` (weaponType|rarity|wear), `page`, `limit`
* Response: `{ "segmentType": string, "coverage": [{ "segment": string, "totalSkins": number, "coveragePercentage": number, "stalePercentage": number, "withoutHistory": number, "withRecentPrices": number }], "pagination": { ... } }`

GET /admin/coverage/missing-skins — requires JWT + admin

* Query: `limit`
* Response: `[{ "id": number, "name": string, "category": string, "rarity": string, "wear": string, "lastPriceUpdate": string|null, "hadPrice": boolean, "watchlistCount": number, "daysSinceUpdate": number|null }]`

Curl Examples
-------------

Admin Overview

```bash
curl -s "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/overview" \
  -H "Authorization: Bearer $CLERK_BACKEND_JWT"
```

Admin Jobs

```bash
curl -s "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/jobs" \
  -H "Authorization: Bearer $CLERK_BACKEND_JWT"
```

Admin Logs (page 1, 20 per page)

```bash
curl -s "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/logs?page=1&limit=20" \
  -H "Authorization: Bearer $CLERK_BACKEND_JWT"
```

Dry Run: Skin Price Update (take 50)

```bash
curl -s -X POST "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/jobs/skin-prices" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLERK_BACKEND_JWT" \
  -d '{"take":50,"dryRun":true}'
```

Execute: Portfolio Snapshots (batch size 100)

```bash
curl -s -X POST "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/jobs/portfolio-snapshots" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLERK_BACKEND_JWT" \
  -d '{"batchSize":100,"dryRun":false}'
```

Clear Steam Cache

```bash
curl -s -X POST "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/cache/steam/clear" \
  -H "Authorization: Bearer $CLERK_BACKEND_JWT"
```

Curl Examples
User Sync

makefile
Code kopieren
curl -X POST "$NEXT_PUBLIC_API_ORIGIN/api/v1/users/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-jwt-token>" \
  -d '{"userId":"user_123","email":null,"firstName":null,"lastName":null}'
Health Check

nginx
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/health"
Clerk JWT Test

makefile
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/health/clerk" \
  -H "Authorization: Bearer <clerk-jwt-token>"
Login

makefile
Code kopieren
curl -X POST "$NEXT_PUBLIC_API_ORIGIN/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.de","password":"pass"}'
Market Stats

nginx
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/skins/14621/market-stats"
Presets

nginx
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/skins/presets"

Admin Coverage Overview

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/coverage/overview" \
  -H "Authorization: Bearer <clerk-jwt-token>"

Admin Coverage by Segment

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/coverage/segments?segmentType=weaponType&page=1&limit=20" \
  -H "Authorization: Bearer <clerk-jwt-token>"

Admin Missing Skins

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/admin/coverage/missing-skins?limit=50" \
  -H "Authorization: Bearer <clerk-jwt-token>"

Cases

Get All Cases

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/cases?search=bravo&sortBy=price&sortOrder=desc"

Get Case Details

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/cases/1"

Get Case Supply History

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/cases/1/supply?days=30"

Get Case Price History

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/cases/1/price-history?days=90"

Get Case Skins

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/cases/1/skins"

Get Case Statistics

bash
Code kopieren
curl "$NEXT_PUBLIC_API_ORIGIN/api/v1/cases/stats"

Notes
Alle Beispiele verwenden ${NEXT_PUBLIC_API_ORIGIN} als Host.

Frontend darf keine eigenen (Vercel-)Routen für die API verwenden.

Bei neuen/angepassten Endpoints: Diese Datei aktualisieren und ein Curl-Beispiel hinzufügen.

bash
Code kopieren

Wenn du willst, setze ich dir gleich noch eine kleine **Troubleshooting-Section** rein („Wrong Host → 404“) – sag Bescheid.
::contentReference[oaicite:0]{index=0}