API Documentation
=================

Base URL
--------

* **Backend Host (Render):** wird über `NEXT_PUBLIC_API_URL` konfiguriert.
* **Frontend (Vercel)** hostet **keine** API-Routen — alle Requests müssen an den Render-Host gehen.
* Basispräfix: `/api/v1`

Examples
--------

* Local: `NEXT_PUBLIC_API_URL=http://localhost:4000`
* Render: `NEXT_PUBLIC_API_URL=https://<your-render-backend>.onrender.com`

Authentication
--------------

Most endpoints require a JWT token in the `Authorization` header:

    Authorization: Bearer <token>

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

* Alle Fetches **nur** über `${NEXT_PUBLIC_API_URL}` (kein Frontend-Host).
* Zentralen Helper verwenden: `apiFetch(path)` (fügt Token hinzu, baut URL, handelt 401).
* Keine Hardcoded-URLs; keine trailing slashes in `NEXT_PUBLIC_API_URL`.

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
Admin
GET /admin/overview — requires JWT + admin

Response: { "users": number, "skins": number, "watchlist": number, "portfolio": number }

Curl Examples
Login

makefile
Code kopieren
curl -X POST "$NEXT_PUBLIC_API_URL/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.de","password":"pass"}'
Market Stats

nginx
Code kopieren
curl "$NEXT_PUBLIC_API_URL/api/v1/skins/14621/market-stats"
Notes
Alle Beispiele verwenden ${NEXT_PUBLIC_API_URL} als Host.

Frontend darf keine eigenen (Vercel-)Routen für die API verwenden.

Bei neuen/angepassten Endpoints: Diese Datei aktualisieren und ein Curl-Beispiel hinzufügen.

bash
Code kopieren

Wenn du willst, setze ich dir gleich noch eine kleine **Troubleshooting-Section** rein („Wrong Host → 404“) – sag Bescheid.
::contentReference[oaicite:0]{index=0}