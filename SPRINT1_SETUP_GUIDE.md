# Sprint 1: Database & Payment Setup Guide

**Timeline**: 25 hours over 3-4 days  
**Status**: Code generation complete, now ready for integration

## What's Been Created

### 1. ✅ Prisma Schema Updates (`backend/prisma/schema.prisma`)
- Added `tier`, `stripeCustomerId`, `stripeSubscriptionId` to User model
- New `APIKey` model for B2B API access
- New `APILog` model for tracking API usage per key

### 2. ✅ Database Migration (`backend/prisma/migrations/20260505_add_payment_and_api_models/migration.sql`)
- Adds payment fields to User table
- Creates APIKey and APILog tables with proper indexes
- Foreign key constraints with cascade delete

### 3. ✅ Stripe Service (`backend/src/services/stripe-service.js`)
- `createCheckoutSession()` - Stripe checkout for subscriptions
- `handleWebhookEvent()` - Process Stripe webhook events
- `cancelSubscription()` - Cancel user subscriptions
- `getActiveSubscription()` - Check user's current plan

### 4. ✅ Tier-Gating Middleware (`backend/src/middleware/tier-gating.js`)
- `requireTier('pro')` - Middleware to protect routes
- `getTierLimits()` - Get feature limits per tier
- `checkLimit()` - Check if user hit a limit
- `validateAPIKeyUsage()` - Validate API key quotas

### 5. ✅ Stripe Webhook Handler (`backend/src/routes/webhook-stripe.js`)
- POST `/api/v1/webhooks/stripe` - Webhook endpoint
- Processes: checkout, subscription, payment events
- Updates User tier automatically

### 6. ✅ API Key Management (`backend/src/routes/api-keys.js`)
- GET `/api/v1/api-keys` - List user's keys
- POST `/api/v1/api-keys` - Create new key
- DELETE `/api/v1/api-keys/:keyId` - Revoke key
- GET `/api/v1/api-keys/:keyId/logs` - View usage stats
- POST `/api/v1/api-keys/:keyId/reset` - Reset daily counter

### 7. ✅ Public B2B API Routes (`backend/src/routes/public-api.js`)
- GET `/api/public/skins` - List all skins
- GET `/api/public/skins/:id` - Single skin details
- GET `/api/public/skins/:id/history` - Price history
- GET `/api/public/cases` - List all cases
- GET `/api/public/cases/:id` - Case details with skins
- API key authentication (Bearer token)
- Automatic usage logging

---

## Installation Checklist

### Step 1: Environment Variables (5 min)

Add to `backend/.env`:

```bash
# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_live_xxxxx          # From Stripe Dashboard
STRIPE_SECRET_KEY=sk_live_xxxxx          # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_xxxxx        # From Webhook Settings
STRIPE_PRICE_PRO_ID=price_xxxxx          # Create in Stripe Dashboard
STRIPE_PRICE_ENTERPRISE_ID=price_xxxxx   # Create in Stripe Dashboard

# Server
STRIPE_WEBHOOK_URL=https://your-app.com/api/v1/webhooks/stripe
```

### Step 2: Stripe Dashboard Setup (10 min)

1. **Create Price Objects** (Products → Prices)
   - Product: "CS2 Skin Tracker Pro"
     - Price: €4.99/month
     - Billing interval: Monthly
     - Copy price ID → `STRIPE_PRICE_PRO_ID`
   
   - Product: "CS2 Skin Tracker Enterprise"
     - Price: €99/month (or custom)
     - Copy price ID → `STRIPE_PRICE_ENTERPRISE_ID`

2. **Configure Webhook Endpoint** (Developers → Webhooks)
   - Endpoint URL: `https://your-backend.com/api/v1/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

3. **Get API Keys** (Developers → API Keys)
   - Copy Publishable key → `STRIPE_PUBLIC_KEY`
   - Copy Secret key → `STRIPE_SECRET_KEY`

### Step 3: Apply Database Migration (5 min)

```bash
cd backend

# Generate migration
npx prisma migrate dev --name add_payment_and_api_models

# Or if already in migrations folder:
npx prisma db push
```

Expected output:
```
✔ Generated Prisma Client (4.xx.x)
✔ Created 3 tables: APIKey, APILog, updated User
```

### Step 4: Integrate Routes into Express Server (5 min)

In `backend/src/server.js`:

```javascript
const stripeWebhookRouter = require('./routes/webhook-stripe');
const apiKeysRouter = require('./routes/api-keys');
const publicAPIRouter = require('./routes/public-api');

// Add BEFORE json() middleware (webhook needs raw body)
app.use('/api/v1/webhooks', stripeWebhookRouter);

// Add after middleware
app.use('/api/v1/api-keys', apiKeysRouter);
app.use('/api/public', publicAPIRouter);
```

### Step 5: Test Routes (10 min)

**Test 1: Create Checkout Session**
```bash
curl -X POST http://localhost:5000/api/v1/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{ "tier": "pro" }'
```

**Test 2: Create API Key** (requires Pro tier)
```bash
curl -X POST http://localhost:5000/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-token>" \
  -d '{ "name": "Test Key" }'
```

Response: `{ "key": "abcd1234..." }`

**Test 3: Use API Key**
```bash
curl -X GET http://localhost:5000/api/public/skins \
  -H "Authorization: Bearer abcd1234..."
```

---

## Tier Feature Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Max Tracked Skins** | 10 | Unlimited | Unlimited |
| **Max Price Alerts** | 5 | 100 | Unlimited |
| **Portfolio Size** | €10k max | Unlimited | Unlimited |
| **Price History** | 30 days | 365 days | Unlimited |
| **API Keys** | ❌ 0 | 5 | Unlimited |
| **API Calls/Day** | ❌ None | 10,000 | Unlimited |
| **Advanced Charts** | ❌ | ✅ | ✅ |
| **Export CSV** | ❌ | ✅ | ✅ |
| **Email Alerts** | ❌ | ✅ | ✅ |
| **Price** | Free | €4.99/mo | €99/mo |

---

## File Structure

```
backend/
├── prisma/
│   ├── schema.prisma (UPDATED - tier fields, APIKey, APILog)
│   └── migrations/
│       └── 20260505_add_payment_and_api_models/ (NEW)
│           └── migration.sql
├── src/
│   ├── services/
│   │   └── stripe-service.js (NEW)
│   ├── middleware/
│   │   └── tier-gating.js (NEW)
│   ├── routes/
│   │   ├── webhook-stripe.js (NEW)
│   │   ├── api-keys.js (NEW)
│   │   └── public-api.js (NEW)
│   └── server.js (NEEDS EDIT - add routes)
└── .env (NEEDS UPDATE - Stripe keys)
```

---

## Error Handling

### Common Issues

**1. Stripe Webhook Not Triggering**
```
❌ Error: "No signature provided"
✅ Fix: Ensure webhook route is BEFORE json() middleware
```

**2. API Key Not Working**
```
❌ Error: "Invalid API key"
✅ Fix: Check key is URL-encoded in Bearer token
```

**3. Tier Limit Exceeded**
```
❌ Error: "Maximum API keys reached"
✅ Fix: User must upgrade to Pro tier
```

---

## Testing Stripe Locally

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

---

## Success Criteria ✅

- [ ] Prisma migration runs without errors
- [ ] `/api/v1/api-keys` endpoints work
- [ ] `/api/public/*` endpoints require API key
- [ ] Stripe webhook processes checkout.session.completed
- [ ] User tier updates after successful payment
- [ ] API usage is logged to database
- [ ] Daily call limit enforced for API keys

---

## Next Steps (Sprint 2)

After this sprint completes, we move to:
- Price update service (Steam + SkinBaron APIs)
- GitHub Actions workflow for daily updates
- B2B API documentation
- Frontend pricing page component

**Estimated Sprint 1 Completion**: 2-3 days
