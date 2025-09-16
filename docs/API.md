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
{
  "variants": [
    {
      "id": 19122,
      "name": "★ StatTrak™ Gut Knife | Urban Masked",
      "wear": "Factory New",
      "quality": "Covert",
      "isStattrak": true,
      "isStar": true,
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
      "priceLatest": 190.40,
      "imageUrl": "https://example.com/skin2.jpg",
      "isActive": true
    }
  ],
  "currentSkin": {
    "name": "★ StatTrak™ Gut Knife | Urban Masked",
    "weaponType": "gut knife",
    "itemGroup": "knife"
  }
}
```

**Notes**
* `priceLatest` kann fehlen → Client zeigt "—".
* `isActive` markiert die aktuelle Skin-Variante.

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

Response: { "users": number, "skins": number, "watchlist": number, "portfolio": number }

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
Notes
Alle Beispiele verwenden ${NEXT_PUBLIC_API_ORIGIN} als Host.

Frontend darf keine eigenen (Vercel-)Routen für die API verwenden.

Bei neuen/angepassten Endpoints: Diese Datei aktualisieren und ein Curl-Beispiel hinzufügen.

bash
Code kopieren

Wenn du willst, setze ich dir gleich noch eine kleine **Troubleshooting-Section** rein („Wrong Host → 404“) – sag Bescheid.
::contentReference[oaicite:0]{index=0}