# Sprint 1: API Reference

**Base URL**: `http://localhost:5000` (dev) / `https://api.cs2tracker.com` (production)

---

## 📋 API Overview

### Public API (B2B)
- **Authentication**: Bearer token (API Key)
- **Base Path**: `/api/public`
- **Purpose**: Data access for external integrations
- **Rate Limit**: Per-key daily quota (10k for Pro, unlimited for Enterprise)

### User API (Dashboard)
- **Authentication**: Clerk JWT
- **Base Path**: `/api/v1`
- **Purpose**: User dashboard and API key management
- **Rate Limit**: Standard rate limiting (100 req/15min)

### Stripe Integration
- **Authentication**: Stripe signature verification
- **Endpoint**: `POST /api/v1/webhooks/stripe`
- **Purpose**: Process payment events

---

## 🔐 Authentication

### Bearer Token (Public API)
```bash
curl -H "Authorization: Bearer <api-key>" \
  https://api.cs2tracker.com/api/public/skins
```

**Where to get API key**:
- Create via POST `/api/v1/api-keys` (requires Clerk auth + Pro tier)
- Shown once on creation, then hashed
- Can be viewed (masked) via GET `/api/v1/api-keys`

### Clerk JWT (User API)
```bash
curl -H "Authorization: Bearer <clerk-jwt>" \
  https://api.cs2tracker.com/api/v1/api-keys
```

**How to get Clerk JWT**:
- Automatic on user login via Clerk
- Included in frontend requests
- Validated by `requireAuth` middleware

### Stripe Signature (Webhooks)
```bash
curl -X POST https://api.cs2tracker.com/api/v1/webhooks/stripe \
  -H "stripe-signature: t=<timestamp>,v1=<signature>" \
  -d @payload.json
```

**Validation**:
- Stripe signs all webhook payloads
- Signature verified using `STRIPE_WEBHOOK_SECRET`
- Invalid signatures return 400

---

## 📚 Endpoints

### Public API: Skins

#### GET /api/public/skins
List all skins with filtering, sorting, and pagination.

**Authentication**: Bearer token (required)  
**Rate Limit**: 1 request per API key daily quota

**Query Parameters**:
```
limit=50           // Items per page (max 1000, default 50)
offset=0           // Pagination offset (default 0)
rarity=exotic      // Filter: rare, exotic, covert, classified, restricted, mil-spec, industrial-grade, consumer-grade
sortBy=name        // Sort: name, price, id (default: name)
order=asc          // asc or desc (default: asc)
```

**Response**:
```json
{
  "data": [
    {
      "id": "skin_abc123",
      "name": "Dragon Lore",
      "rarity": "exotic",
      "price": 5000,
      "currency": "USD",
      "wear": 0.05,
      "collection": "Ancient Relics",
      "imageUrl": "https://...",
      "updatedAt": "2026-05-05T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 2847,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "metadata": {
    "source": "CS2 Skin Tracker API",
    "updatedAt": "2026-05-05T10:30:00Z"
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid query parameters
- `401`: Missing or invalid API key
- `429`: Rate limit exceeded

---

#### GET /api/public/skins/:id
Get a single skin's detailed information.

**Authentication**: Bearer token (required)  
**Path Parameters**:
```
:id = skin_abc123
```

**Response**:
```json
{
  "id": "skin_abc123",
  "name": "Dragon Lore",
  "rarity": "exotic",
  "price": 5000,
  "currency": "USD",
  "wear": 0.05,
  "collection": "Ancient Relics",
  "imageUrl": "https://...",
  "description": "Iconic skin from CS:GO",
  "marketLinks": {
    "steamCommunity": "https://...",
    "skinbaron": "https://..."
  },
  "priceHistory": [
    {
      "date": "2026-05-05",
      "price": 5000
    }
  ],
  "updatedAt": "2026-05-05T10:30:00Z"
}
```

**Status Codes**:
- `200`: Success
- `401`: Missing or invalid API key
- `404`: Skin not found

---

#### GET /api/public/skins/:id/history
Get 90-day price history for a skin.

**Authentication**: Bearer token (required)  
**Query Parameters**:
```
days=90            // History range (max 365, default 90)
```

**Response**:
```json
{
  "skinId": "skin_abc123",
  "skinName": "Dragon Lore",
  "history": [
    {
      "date": "2026-05-05",
      "price": 5000,
      "change": -50,
      "changePercent": -0.99
    },
    {
      "date": "2026-05-04",
      "price": 5050,
      "change": 0,
      "changePercent": 0.00
    }
  ],
  "current": 5000,
  "min": 4800,
  "max": 5200,
  "average": 5000,
  "updatedAt": "2026-05-05T10:30:00Z"
}
```

---

### Public API: Cases

#### GET /api/public/cases
List all cases with pagination.

**Authentication**: Bearer token (required)

**Query Parameters**:
```
limit=50           // Items per page (max 1000, default 50)
offset=0           // Pagination offset (default 0)
sortBy=name        // Sort: name, price, id (default: name)
order=asc          // asc or desc (default: asc)
```

**Response**:
```json
{
  "data": [
    {
      "id": "case_xyz789",
      "name": "Ancient Relic Case",
      "price": 0.99,
      "currency": "USD",
      "skinCount": 17,
      "imageUrl": "https://...",
      "updatedAt": "2026-05-05T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

---

#### GET /api/public/cases/:id
Get case details including all contained skins.

**Authentication**: Bearer token (required)

**Response**:
```json
{
  "id": "case_xyz789",
  "name": "Ancient Relic Case",
  "price": 0.99,
  "currency": "USD",
  "description": "Contains skins from the Ancient Relic collection",
  "imageUrl": "https://...",
  "skins": [
    {
      "id": "skin_abc123",
      "name": "Dragon Lore",
      "rarity": "exotic",
      "rarity_percent": 2.5
    }
  ],
  "updatedAt": "2026-05-05T10:30:00Z"
}
```

---

### User API: API Keys

#### GET /api/v1/api-keys
List all API keys for the authenticated user.

**Authentication**: Clerk JWT (required)  
**Tier Required**: Pro or Enterprise

**Response**:
```json
{
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production",
      "tier": "pro",
      "callsPerDay": 10000,
      "callsUsed": 250,
      "isActive": true,
      "createdAt": "2026-05-01T00:00:00Z",
      "lastFourChars": "...xyz7"  // Masked for security
    }
  ],
  "maxKeys": 5
}
```

**Status Codes**:
- `200`: Success
- `401`: Not authenticated
- `402`: Free tier (needs upgrade)

---

#### POST /api/v1/api-keys
Create a new API key.

**Authentication**: Clerk JWT (required)  
**Tier Required**: Pro or Enterprise  
**Request Body**:
```json
{
  "name": "My Integration"
}
```

**Response** (only returned once):
```json
{
  "success": true,
  "key": "sk_live_abc123...xyz789",  // ⚠️ COPY THIS NOW - won't be shown again
  "id": "key_abc123",
  "name": "My Integration",
  "tier": "pro",
  "callsPerDay": 10000,
  "createdAt": "2026-05-05T10:30:00Z"
}
```

**⚠️ Security**: Key is shown only once. Store it securely. Lost keys must be regenerated.

**Status Codes**:
- `201`: Key created
- `400`: Invalid request body
- `401`: Not authenticated
- `402`: Free tier (needs upgrade)
- `403`: Max keys reached for your tier

---

#### DELETE /api/v1/api-keys/:keyId
Revoke an API key.

**Authentication**: Clerk JWT (required)  
**Path Parameters**:
```
:keyId = key_abc123
```

**Response**:
```json
{
  "success": true,
  "message": "API key revoked"
}
```

**Status Codes**:
- `200`: Key revoked
- `401`: Not authenticated
- `404`: Key not found

---

#### GET /api/v1/api-keys/:keyId/logs
Get usage statistics for a specific API key.

**Authentication**: Clerk JWT (required)

**Query Parameters**:
```
limit=100          // Log entries to return (max 1000, default 100)
offset=0           // Pagination offset (default 0)
```

**Response**:
```json
{
  "keyId": "key_abc123",
  "usage": {
    "today": 250,
    "dailyLimit": 10000,
    "remainingToday": 9750
  },
  "logs": [
    {
      "id": "log_xyz",
      "endpoint": "/api/public/skins",
      "method": "GET",
      "statusCode": 200,
      "responseTime": 128,
      "ipAddress": "203.0.113.42",
      "userAgent": "python-requests/2.28.1",
      "createdAt": "2026-05-05T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1250,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### POST /api/v1/api-keys/:keyId/reset
Manually reset daily call counter (for testing).

**Authentication**: Clerk JWT (required)  
**Admin Only**: Yes (in production)

**Response**:
```json
{
  "success": true,
  "message": "Daily counter reset",
  "callsUsed": 0,
  "dailyLimit": 10000
}
```

---

### Webhooks: Stripe

#### POST /api/v1/webhooks/stripe
Receive and process Stripe webhook events.

**Authentication**: Stripe signature verification (required)  
**Headers**:
```
stripe-signature: t=<timestamp>,v1=<signature>
content-type: application/json
```

**Handled Events**:
```
checkout.session.completed    → Create subscription
subscription.created          → Store subscription ID
subscription.updated          → Update tier
subscription.deleted          → Downgrade to free
payment_intent.succeeded      → Log payment
payment_intent.failed         → Log failure
```

**Example Payload**:
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "customer": "cus_abc123",
      "subscription": "sub_abc123",
      "payment_status": "paid"
    }
  }
}
```

**Response**:
```json
{
  "received": true,
  "eventId": "evt_1234567890"
}
```

**Status Codes**:
- `200`: Event processed
- `400`: Invalid signature
- `400`: Missing signature
- `500`: Processing error (still returns 200 to Stripe)

---

## 🔄 Response Envelope

All endpoints return a consistent response structure:

```json
{
  "data": { /* endpoint-specific data */ },
  "pagination": { /* only if list endpoint */ },
  "metadata": { /* source and timestamp */ },
  "error": "string" /* only if error */
}
```

---

## ⚠️ Error Handling

### Standard Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid query parameters",
  "detail": "limit must be <= 1000",
  "code": "INVALID_PARAMS"
}
```

**401 Unauthorized**
```json
{
  "error": "Missing API key",
  "detail": "Authorization header not provided",
  "code": "MISSING_AUTH"
}
```

**402 Payment Required**
```json
{
  "error": "Upgrade to Pro to use this feature",
  "currentTier": "free",
  "requiredTier": "pro",
  "upgrade": {
    "price": 4.99,
    "currency": "EUR"
  }
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600,
  "code": "RATE_LIMITED"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## 💡 Examples

See [[API-Examples|cURL Examples]] for complete request/response examples.

---

## 📊 Rate Limits by Tier

| Tier | Daily API Calls | Max Keys | Concurrent Requests |
|------|-----------------|----------|---------------------|
| Free | 0 (blocked) | 0 | N/A |
| Pro | 10,000 | 5 | 10 |
| Enterprise | Unlimited | Unlimited | Unlimited |

---

## 🔑 API Key Management

### Creating a Key
1. User authenticates with Clerk JWT
2. POST `/api/v1/api-keys` with name
3. Server generates 32-byte random key
4. Server hashes key with SHA-256
5. Returns **raw unhashed key once** (user must save it)
6. Stored hashed in database

### Using a Key
1. Include in Authorization header: `Bearer <key>`
2. Server hashes incoming key
3. Server compares hash with database
4. If match, request proceeds with rate limiting

### Revoking a Key
1. DELETE `/api/v1/api-keys/:id`
2. Key marked inactive in database
3. Future requests with that key return 401

---

## 🧪 Testing

### Local Testing with cURL
```bash
# Create API key (requires Clerk JWT)
curl -X POST http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer <clerk-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# Use API key
curl http://localhost:5000/api/public/skins \
  -H "Authorization: Bearer <api-key>"

# Test webhook (requires Stripe CLI)
stripe listen --forward-to http://localhost:5000/api/v1/webhooks/stripe
```

---

**Last Updated**: May 5, 2026  
**API Version**: 1.0.0
