# System Architecture - CS2 Skin Tracker

**Version**: 1.0  
**Last Updated**: May 5, 2026  
**Status**: Production Ready (Sprint 1)

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  (Dashboard, Pricing Page, Alerts, Portfolio)               │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  API Routes                                             ││
│  │  • /api/v1/*  (User APIs - Clerk JWT auth)             ││
│  │  • /api/public/* (B2B APIs - Bearer key auth)          ││
│  │  • /api/v1/webhooks/stripe (Webhook - signature auth)  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Middleware Stack                                       ││
│  │  • Stripe Webhook (raw body, no JSON parsing)          ││
│  │  • helmet (security headers)                           ││
│  │  • express.json() (JSON parsing)                       ││
│  │  • CORS (origin validation)                            ││
│  │  • Auth guards (Clerk + API key validation)            ││
│  │  • Rate limiting (per-user, per-key)                   ││
│  │  • Tier gating (feature limits by subscription)        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Services                                               ││
│  │  • stripe-service.js (checkout, webhooks)              ││
│  │  • price-service.js (Steam API, SkinBaron fallback)    ││
│  │  • auth-service.js (Clerk validation)                  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                         │
│  PostgreSQL + Prisma ORM                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Models:                                              │   │
│  │ • User (auth, tier, Stripe IDs)                     │   │
│  │ • Skin (CS2 item data, current price)               │   │
│  │ • Case (container items)                             │   │
│  │ • APIKey (B2B authentication, rate limits)          │   │
│  │ • APILog (usage tracking, analytics)                │   │
│  │ • PriceHistory (90-365 day price tracking)          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│  ┌──────────────────┐  ┌──────────────────┐ ┌────────────┐ │
│  │  Clerk Auth      │  │  Stripe Payments │ │ Steam API  │ │
│  │  • JWT tokens    │  │  • Subscriptions │ │ • Prices   │ │
│  │  • User mgmt     │  │  • Webhooks      │ │ • History  │ │
│  └──────────────────┘  └──────────────────┘ └────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ GitHub Actions   │  │ SkinBaron API    │                │
│  │ • Daily prices   │  │ • Price fallback │                │
│  │ • Cron jobs      │  │ • New items      │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Layers

### Layer 1: User Authentication (Frontend → Backend)
```
User Login (Frontend)
    ↓
Clerk handles OAuth
    ↓
Clerk returns JWT token
    ↓
Frontend stores token (localStorage/cookie)
    ↓
Frontend sends Authorization: Bearer <jwt> with requests
    ↓
Backend validates with Clerk public key
    ↓
Request proceeds with user context
```

**Used For**:
- Dashboard access
- API key management (`/api/v1/api-keys`)
- User settings

### Layer 2: API Key Authentication (B2B)
```
Developer creates API key
    ↓
Backend generates 32-byte random key
    ↓
Backend hashes key (SHA-256)
    ↓
Backend stores hash + metadata in APIKey table
    ↓
Developers use: Authorization: Bearer <raw-key>
    ↓
Backend hashes incoming key, compares with stored hash
    ↓
Request proceeds with API key context
```

**Used For**:
- Public API access (`/api/public/skins`, `/api/public/cases`)
- Rate limiting per key
- Usage logging

### Layer 3: Webhook Authentication (Stripe)
```
Stripe event occurs (payment, subscription change)
    ↓
Stripe sends POST to /api/v1/webhooks/stripe
    ↓
Stripe includes: stripe-signature header = t=<timestamp>,v1=<signature>
    ↓
Backend reconstructs signature using raw body + STRIPE_WEBHOOK_SECRET
    ↓
Backend verifies: stored signature == stripe signature
    ↓
If match, process event; if not, reject with 400
```

**Used For**:
- Subscription updates
- Payment notifications
- User tier changes

---

## 📊 Data Models

### User
```javascript
{
  id: String,              // UUID from Clerk
  email: String,
  tier: "free|pro|enterprise",
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### APIKey
```javascript
{
  id: String,
  userId: String,          // Foreign key → User
  key: String,             // SHA-256 hashed
  name: String,            // "Production API", "Test"
  tier: "free|pro|enterprise",
  callsPerDay: Number,     // 0 (free), 10000 (pro), unlimited (enterprise)
  callsUsed: Number,       // Reset daily at UTC midnight
  lastResetAt: DateTime,
  isActive: Boolean,
  expiresAt: DateTime,     // Optional
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### APILog
```javascript
{
  id: String,
  userId: String,          // Foreign key → User
  apiKeyId: String,        // Foreign key → APIKey
  endpoint: String,        // "/api/public/skins"
  method: String,          // "GET", "POST"
  statusCode: Number,      // 200, 404, 401
  responseTime: Number,    // milliseconds
  ipAddress: String,
  userAgent: String,
  createdAt: DateTime
}
```

### Skin
```javascript
{
  id: String,
  name: String,
  rarity: String,
  currentPrice: Float,
  currency: String,
  imageUrl: String,
  priceHistory: PriceHistory[], // Relation
  updatedAt: DateTime
}
```

### PriceHistory
```javascript
{
  id: String,
  skinId: String,          // Foreign key → Skin
  date: DateTime,
  price: Float,
  change: Float,           // price change from previous day
  changePercent: Float,    // percent change
  source: String,          // "steam" | "skinbaron"
  createdAt: DateTime
}
```

---

## 🔄 Request Flow Examples

### Example 1: User Creates API Key

```
1. Frontend POST /api/v1/api-keys
   Header: Authorization: Bearer <clerk-jwt>
   Body: { name: "Production" }

2. Middleware: Validate Clerk JWT
   ✓ Token valid
   ✓ User authenticated

3. Middleware: Check tier
   ✓ User tier = "pro"
   ✓ Allowed (requires Pro+)

4. Service: Generate key
   - Generate 32 random bytes
   - Hash with SHA-256
   - Store hash in APIKey table
   - Return raw key (only time)

5. Response 201:
   {
     key: "sk_live_abc123...xyz789",
     id: "key_abc123",
     callsPerDay: 10000
   }
```

### Example 2: Developer Calls Public API

```
1. Frontend GET /api/public/skins
   Header: Authorization: Bearer <api-key>

2. Middleware: Extract & validate API key
   - Parse Bearer token
   - Query APIKey table (hashed match)
   ✓ Key found and active

3. Middleware: Check rate limits
   - Query APILog today
   - Count: 5 requests
   - Limit: 10,000 (Pro tier)
   ✓ Under limit

4. Handler: Fetch data
   - Query Skin table (all skins)
   - Apply pagination
   - Return paginated data

5. Middleware: Log request
   - Insert APILog entry
   - endpoint: "/api/public/skins"
   - statusCode: 200
   - responseTime: 128ms

6. Response 200:
   {
     data: [...],
     pagination: {...},
     metadata: {...}
   }
```

### Example 3: Stripe Webhook

```
1. Stripe Event: checkout.session.completed
   - Customer paid €4.99 for Pro subscription

2. Stripe sends POST /api/v1/webhooks/stripe
   Header: stripe-signature: t=1234567890,v1=abc123...xyz789
   Body: { type: "checkout.session.completed", ... }

3. Middleware: Webhook signature verification
   - Extract signature from header
   - Get STRIPE_WEBHOOK_SECRET from env
   - Reconstruct signature from raw body
   - Compare: header sig === reconstructed sig
   ✓ Valid signature

4. Service: Handle webhook event
   - Get customer from event
   - Find User by stripeCustomerId
   - Set user.tier = "pro"
   - Set user.stripeSubscriptionId = event.subscription.id
   - Save to database

5. Response 200:
   {
     received: true,
     eventId: "evt_123456"
   }
```

---

## ⚙️ Tier System

### Feature Limits by Subscription

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Skins Tracked** | 10 | Unlimited | Unlimited |
| **Price Alerts** | 5 | 100 | Unlimited |
| **Charts & Analytics** | Basic | Advanced | Advanced |
| **CSV Export** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ✅ | ✅ |
| **API Calls/Day** | 0 | 10,000 | Unlimited |
| **API Keys** | 0 | 5 | Unlimited |
| **Price** | €0 | €4.99/mo | €99/mo |

### Enforcement

All tier restrictions are enforced via `tier-gating.js` middleware:

```javascript
// Example: API key creation
requireTier('pro')(req, res, next) // Only Pro+ allowed

// If user.tier === 'free':
// Response 402 Payment Required:
// {
//   error: "Upgrade to Pro...",
//   requiredTier: "pro",
//   upgrade: { price: 4.99 }
// }
```

---

## 🚀 Deployment Architecture

### Local Development
```
localhost:3000  ← Frontend (React dev server)
localhost:5000  ← Backend (Node + Express)
localhost:5432  ← PostgreSQL
Stripe CLI      ← Local webhook forwarding
```

### Production (Vercel)
```
vercel.app (Frontend)  ← React build, static hosting
vercel.app (Backend)   ← Node.js serverless functions
AWS RDS (Database)     ← Managed PostgreSQL
Stripe (Payments)      ← Webhook to production endpoint
GitHub Actions         ← Daily price updates via cron
```

---

## 🔐 Security

### Data Protection
- ✅ API keys hashed with SHA-256
- ✅ Database passwords in environment variables
- ✅ Stripe secrets never logged
- ✅ User tokens validated with Clerk
- ✅ Webhook signatures verified

### API Security
- ✅ CORS configured (origin validation)
- ✅ Rate limiting per user/key
- ✅ Helmet.js (security headers)
- ✅ Input validation (Prisma)
- ✅ SQL injection prevention (ORM)

### Infrastructure
- ✅ HTTPS only (Vercel enforces)
- ✅ Environment variables (secrets management)
- ✅ No hardcoded credentials
- ✅ Audit logging (APILog table)

---

## 📈 Scalability

### Current Limits
- **Users**: Unlimited (Clerk handles)
- **API Keys**: 5 per Pro user, unlimited Enterprise
- **Requests**: 10k/day per Pro key, unlimited Enterprise
- **Database**: PostgreSQL handles millions of rows

### Scaling Strategy (Future)
- Add database caching (Redis)
- Implement GraphQL for complex queries
- Move images to CDN (S3 + CloudFront)
- Database replication for high availability
- Message queue for async tasks

---

## 🧪 Testing Strategy

### Unit Tests
- Service functions (stripe-service, price-service)
- Middleware (auth, tier-gating)
- Utilities (hashing, validation)

### Integration Tests
- API endpoint flows
- Database operations
- Stripe webhook handling
- Clerk authentication

### E2E Tests
- Complete user workflows
- Payment → tier change → API access
- API key creation → usage → logging

### Load Tests
- 10k API calls per key limit
- Concurrent request handling
- Database query performance

---

## 📚 Documentation

- [[../01-Sprint1/API-Documentation|API Reference]]
- [[../01-Sprint1/Setup-Guide|Setup Guide]]
- [[../01-Sprint1/Testing-Results|Testing Results]]

---

**Architecture Version**: 1.0  
**Last Updated**: May 5, 2026  
**Status**: Production Ready
