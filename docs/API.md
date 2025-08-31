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
GET /skins/:skinId
Get skin details by ID.

Response

json
Code kopieren
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