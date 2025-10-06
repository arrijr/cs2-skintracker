# API Documentation

## Case Endpoints

### Get All Cases
**GET** `/api/v1/cases`

Retrieves a list of all cases with optional filtering and sorting.

#### Query Parameters
- `search` (string, optional): Search by case name
- `discontinued` (boolean, optional): Filter by discontinued status
- `sortBy` (string, optional): Sort field (default: 'timeToExtinction')
- `sortOrder` (string, optional): Sort direction - 'asc' or 'desc' (default: 'asc')
- `limit` (number, optional): Items per page (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)

#### Response
```json
{
  "cases": [
    {
      "id": 1,
      "name": "Operation Bravo Case",
      "imageUrl": "/images/placeholder-case.png",
      "description": "A case containing Operation Bravo Case skins",
      "releaseDate": "2025-10-03T09:57:23.938Z",
      "isDiscontinued": false,
      "price": 5.37,
      "marketCap": 220170,
      "remaining": 281749,
      "dropped": 500000,
      "unboxed": 218251,
      "timeToExtinction": 45.2,
      "priceChange24h": 2.3,
      "priceChange7d": -1.2,
      "priceChange30d": 15.7,
      "lastUpdated": "2025-10-03T09:57:23.940Z",
      "supplyDisclaimer": "Supply data calculated from real SteamWebAPI.com sales data",
      "createdAt": "2025-10-03T09:57:23.940Z",
      "updatedAt": "2025-10-03T09:57:23.940Z"
    }
  ],
  "total": 52,
  "limit": 100,
  "offset": 0
}
```

### Get Case by ID
**GET** `/api/v1/cases/{id}`

Retrieves detailed information about a specific case.

#### Path Parameters
- `id` (number, required): Case ID

#### Response
```json
{
  "id": 1,
  "name": "Operation Bravo Case",
  "imageUrl": "/images/placeholder-case.png",
  "description": "A case containing Operation Bravo Case skins",
  "releaseDate": "2025-10-03T09:57:23.938Z",
  "isDiscontinued": false,
  "price": 5.37,
  "marketCap": 220170,
  "remaining": 281749,
  "dropped": 500000,
  "unboxed": 218251,
  "timeToExtinction": 45.2,
  "priceChange24h": 2.3,
  "priceChange7d": -1.2,
  "priceChange30d": 15.7,
  "lastUpdated": "2025-10-03T09:57:23.940Z",
  "caseSkins": [
    {
      "id": 1,
      "rarity": "restricted",
      "dropChance": 0.15,
      "isSpecial": false,
      "skin": {
        "id": 123,
        "name": "AK-47 | Redline",
        "imageUrl": "https://steamcommunity-a.akamaihd.net/economy/image/...",
        "rarity": "restricted",
        "priceLatest": 25.50,
        "priceMedian": 24.80
      }
    }
  ],
  "caseSupply": [
    {
      "id": 1,
      "date": "2025-10-01T00:00:00.000Z",
      "remaining": 285000,
      "dropped": 500000,
      "unboxed": 215000,
      "price": 5.20,
      "marketCap": 1482000
    }
  ],
  "casePriceHistory": [
    {
      "id": 1,
      "date": "2025-10-01T00:00:00.000Z",
      "price": 5.20,
      "marketCap": 1482000,
      "remaining": 285000
    }
  ]
}
```

### Get Case Supply History
**GET** `/api/v1/cases/{id}/supply`

Retrieves historical supply data for a specific case.

#### Path Parameters
- `id` (number, required): Case ID

#### Query Parameters
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)
- `limit` (number, optional): Maximum number of records (default: 100)

#### Response
```json
{
  "supply": [
    {
      "id": 1,
      "date": "2025-10-01T00:00:00.000Z",
      "remaining": 285000,
      "dropped": 500000,
      "unboxed": 215000,
      "price": 5.20,
      "marketCap": 1482000
    }
  ],
  "total": 30,
  "limit": 100
}
```

### Get Case Price History
**GET** `/api/v1/cases/{id}/price-history`

Retrieves historical price data for a specific case.

#### Path Parameters
- `id` (number, required): Case ID

#### Query Parameters
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)
- `limit` (number, optional): Maximum number of records (default: 100)

#### Response
```json
{
  "priceHistory": [
    {
      "id": 1,
      "date": "2025-10-01T00:00:00.000Z",
      "price": 5.20,
      "marketCap": 1482000,
      "remaining": 285000
    }
  ],
  "total": 30,
  "limit": 100
}
```

### Get Case Skins
**GET** `/api/v1/cases/{id}/skins`

Retrieves all skins contained in a specific case.

#### Path Parameters
- `id` (number, required): Case ID

#### Query Parameters
- `rarity` (string, optional): Filter by rarity
- `sortBy` (string, optional): Sort field (default: 'rarity')
- `sortOrder` (string, optional): Sort direction - 'asc' or 'desc' (default: 'asc')

#### Response
```json
{
  "skins": [
    {
      "id": 1,
      "rarity": "restricted",
      "dropChance": 0.15,
      "isSpecial": false,
      "skin": {
        "id": 123,
        "name": "AK-47 | Redline",
        "imageUrl": "https://steamcommunity-a.akamaihd.net/economy/image/...",
        "rarity": "restricted",
        "priceLatest": 25.50,
        "priceMedian": 24.80
      }
    }
  ],
  "total": 15
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid case ID"
}
```

### 404 Not Found
```json
{
  "error": "Case not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

- **Rate Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## Authentication

Most endpoints require authentication via Clerk:
- **Header**: `Authorization: Bearer <token>`
- **Cookie**: `__session` cookie

## CORS

All endpoints support CORS with the following configuration:
- **Origins**: All origins allowed
- **Methods**: GET, POST, PUT, DELETE, OPTIONS, PATCH
- **Headers**: Content-Type, Authorization, X-Requested-With, Accept, Origin
- **Credentials**: Supported

## Data Types

### Case Status
- `active`: Case is currently available
- `discontinued`: Case is no longer dropped

### Rarity Levels
- `consumer`: Gray
- `industrial`: Light Blue
- `mil-spec`: Blue
- `restricted`: Purple
- `classified`: Pink
- `covert`: Red
- `exceedingly rare`: Gold

### Price Changes
- Positive values indicate price increase
- Negative values indicate price decrease
- Values are percentages (e.g., 5.2 = 5.2%)

## Examples

### Get All Active Cases
```bash
curl -X GET "https://cs2-skintracker-dev.onrender.com/api/v1/cases?discontinued=false&sortBy=price&sortOrder=desc"
```

### Search for Operation Cases
```bash
curl -X GET "https://cs2-skintracker-dev.onrender.com/api/v1/cases?search=operation"
```

### Get Case with Supply History
```bash
curl -X GET "https://cs2-skintracker-dev.onrender.com/api/v1/cases/1/supply?startDate=2025-01-01&endDate=2025-12-31"
```

## Data Sources

### SteamWebAPI.com Integration
- **Service**: [SteamWebAPI.com](https://www.steamwebapi.com/api/doc/steam-market-api)
- **Environment Variable**: `STEAM_API_KEY` (in Render)
- **Status**: ✅ **Working** - 26,017 CS2 items available
- **Update Frequency**: Every hour + Daily cronjob at 06:00 UTC
- **Data Coverage**: CS2, CSGO, Rust, Dota items

### What We Get
- **Real-time market prices** (pricelatest, pricelatestsell, etc.)
- **Historical price data** (pricelatestsell24h, pricelatestsell7d, pricelatestsell30d, pricelatestsell90d)
- **Market statistics** (sold24h, sold7d, sold30d, sold90d, offervolume, etc.)
- **Item metadata** (rarity, quality, wear, itemgroup, etc.)
- **Third-party marketplace integration** (DMarket, Skinport, etc.)

### Cronjob Monitoring
- **Daily SteamWebAPI Update**: Runs at 06:00 UTC daily
- **Job Tracking**: All cronjob runs are logged in `JobRun` table
- **Admin Panel**: Monitor success/failure status in admin dashboard
- **Real-time Data**: Cases updated with latest offer volume and sales data