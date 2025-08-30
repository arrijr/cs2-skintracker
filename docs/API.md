# API Documentation

## Base URL
`/api/v1`

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Skins

#### GET `/skins`
Get all skins with filtering, sorting, and pagination.

**Query Parameters:**
- `q` - Search query
- `min` - Minimum price filter
- `max` - Maximum price filter
- `rarity` - Rarity filter
- `wear` - Wear filter
- `quality` - Quality filter
- `stattrak` - StatTrak filter (true/false)
- `special` - Special/Star filter (true/false)
- `category` - Category filter (knives, gloves, pistols, etc.)
- `sort` - Sort order (name_asc, name_desc, price_asc, price_desc, newest, popularity_desc, wear_asc, wear_desc)
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 24, max: 60)

**Response:**
```json
{
  "items": [...],
  "total": 1234,
  "page": 1,
  "pageSize": 24
}
```

#### GET `/skins/search`
Search skins by name or market hash name.

**Query Parameters:**
- `query` - Search term (min 2 characters)

**Response:**
```json
[
  {
    "id": 1,
    "name": "AK-47 | Redline",
    "marketHashName": "AK-47 | Redline (Field-Tested)"
  }
]
```

#### GET `/skins/:skinId`
Get skin details by ID.

**Response:**
```json
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
```

#### GET `/skins/:skinId/history`
Get price history for a skin.

**Response:**
```json
[
  {
    "date": "2024-01-01T00:00:00.000Z",
    "price": 15.50
  }
]
```

#### GET `/skins/:skinId/market-stats`
Get market statistics for a skin.

**Response:**
```json
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
```

#### GET `/skins/:skinId/variants`
Get variants of the same skin (different wear/quality).

**Response:**
```json
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
  "currentSkin": {
    "name": "AK-47 | Redline",
    "weaponType": "rifle",
    "itemGroup": "rifle"
  }
}
```

#### GET `/skins/:skinId/case`
Get case information for a skin.

**Response:**
```json
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
```

#### GET `/skins/filters`
Get available filter options.

**Response:**
```json
{
  "weaponTypes": ["rifle", "pistol", "smg"],
  "wears": ["Factory New", "Minimal Wear", "Field-Tested"],
  "rarities": ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade"],
  "qualities": ["Consumer Grade", "Industrial Grade"]
}
```

#### GET `/skins/categories`
Get skin categories with counts.

**Response:**
```json
{
  "ok": true,
  "categories": {
    "knives": {
      "count": 150,
      "weaponTypes": ["knife"]
    }
  },
  "totalSkins": 5000
}
```

#### GET `/skins/presets`
Get preset values for UI.

**Response:**
```json
{
  "wears": ["Factory New", "Minimal Wear", "Field-Tested"],
  "rarities": ["Consumer Grade", "Industrial Grade", "Mil-Spec Grade"]
}
```

Admin
-----

* GET `/api/v1/admin/overview` — requires JWT + admin
  * Response: `{ users: number, skins: number, watchlist: number, portfolio: number }`