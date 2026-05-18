# CS2 Skin Tracker - Phase 3: Detailed Implementation Plan

**Timeline**: 4-5 Wochen (140 Stunden)  
**Ansatz**: Kostenlose APIs, 1x täglich Update  
**Monetarisierung**: Freemium + B2B APIs  

---

## 📋 Overview

### Was wir bauen:
1. ✅ Payment Processing (Stripe)
2. ✅ Freemium Tiers (Free/Pro)
3. ✅ Kostenlose Datenquellen (Steam API + SkinBaron)
4. ✅ 1x/Tag Automatische Updates (GitHub Actions)
5. ✅ API Management (für B2B)
6. ✅ Pricing Page + Onboarding

### Tech Stack:
- **Frontend**: Next.js 15 (bereits vorhanden)
- **Backend**: Express.js (bereits vorhanden)
- **Database**: PostgreSQL (bereits vorhanden)
- **Payment**: Stripe
- **Automation**: GitHub Actions (kostenlos)
- **Caching**: In-Memory oder Redis (optional)

---

## 🔧 SPRINT 1 (Woche 1-2): Foundation & Payment Setup

### Sprint 1a: Database Migration (5 Stunden)

#### 1. Neue Prisma Models hinzufügen

**Datei**: `backend/prisma/schema.prisma`

```prisma
// Existing User model - ADD these fields:
model User {
  id                  String @id @default(cuid())
  email               String @unique
  name                String?
  
  // NEW: Subscription fields
  tier                Tier @default(FREE)
  stripeCustomerId    String? @unique
  stripeSubscriptionId String?
  subscriptionStatus  String? // "active", "past_due", "canceled"
  renewalDate         DateTime?
  canceledAt          DateTime?
  
  // NEW: API Key for B2B
  apiKeys             APIKey[]
  
  // Existing fields
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  portfolioItems      PortfolioItem[]
  priceAlerts         PriceAlert[]
}

enum Tier {
  FREE
  PRO
  ENTERPRISE
}

// NEW: API Key Management
model APIKey {
  id              String @id @default(cuid())
  userId          String
  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name            String // e.g., "My Discord Bot"
  key             String @unique @default(cuid()) // Generate on create
  tier            String // "starter", "developer", "enterprise"
  
  // Usage tracking
  callsUsedToday  Int @default(0)
  callsLimit      Int // 0 (unlimited) for pro, 100 for starter, etc
  
  isActive        Boolean @default(true)
  lastUsedAt      DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  logs            APILog[]
  
  @@unique([userId, name])
}

// NEW: API Usage Logs
model APILog {
  id              String @id @default(cuid())
  apiKeyId        String
  apiKey          APIKey @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  
  endpoint        String // "/api/v1/skins"
  method          String // "GET", "POST"
  statusCode      Int
  
  createdAt       DateTime @default(now())
  
  @@index([apiKeyId, createdAt])
}

// NEW: Price History (for analytics)
model PriceHistory {
  id              String @id @default(cuid())
  skinId          Int
  
  price           Float
  source          String // "steam", "skinbaron"
  
  createdAt       DateTime @default(now())
  
  @@index([skinId, createdAt])
}

// Existing models - no changes needed
model PortfolioItem {
  id              String @id @default(cuid())
  userId          String
  skinId          Int
  quantity        Int @default(1)
  purchasePrice   Float?
  purchaseDate    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PriceAlert {
  id              String @id @default(cuid())
  userId          String
  skinId          Int
  triggerPrice    Float
  isActive        Boolean @default(true)
  createdAt       DateTime @default(now())
}
```

**Commands**:
```bash
cd backend
npx prisma migrate dev --name add_payment_and_api_keys
# This generates migration file and updates Prisma client
```

#### 2. Umgebungsvariablen hinzufügen

**Datei**: `backend/.env` (ADD these lines)

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_... # Get from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Get after creating webhook

# Price Update
STEAM_API_DELAY_MS=1200 # Delay between Steam API calls (1.2 sec)
SKINBARON_API_URL=https://api.skinbaron.com/api/v2/Market/GetItems

# Cache (optional)
REDIS_URL=redis://localhost:6379 # Optional, can use in-memory fallback
```

**Datei**: `frontend/.env.local` (ADD this line)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

### Sprint 1b: Stripe Setup (3 Stunden)

#### 1. Stripe Account erstellen & Keys generieren

**Steps**:
1. Go to https://dashboard.stripe.com/register
2. Create test account
3. Copy `Secret Key` → `STRIPE_SECRET_KEY` in `.env`
4. Copy `Publishable Key` → `STRIPE_PUBLISHABLE_KEY` in `.env`
5. Create webhook endpoint (später)

#### 2. Stripe Products & Prices erstellen

```bash
# Use Stripe Dashboard oder API calls:
```

**Via Stripe Dashboard**:
1. Go to Products → Create Product
2. Name: "CS2 Tracker Pro"
3. Price: €4.99/month (recurring)
4. Save Product ID → Use in code

**Via Node.js**:
```javascript
// scripts/setup-stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

async function setupStripe() {
  // Create product
  const product = await stripe.products.create({
    name: 'CS2 Tracker Pro',
    description: 'Unlimited portfolios, alerts, and analytics'
  })
  
  // Create price
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: 499, // €4.99 in cents
    recurring: {
      interval: 'month',
      interval_count: 1
    }
  })
  
  console.log('Product ID:', product.id)
  console.log('Price ID:', price.id)
  
  // Save these to .env or database
}

setupStripe()
```

**Run**:
```bash
node scripts/setup-stripe.js
```

---

### Sprint 1c: Backend Stripe Routes (10 Stunden)

#### 1. Stripe Service erstellen

**Datei**: `backend/src/services/stripe-service.js`

```javascript
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()

export const stripeService = {
  // Create checkout session (user wants to upgrade)
  async createCheckoutSession(userId, email) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    
    if (user.tier === 'PRO') {
      throw new Error('User already has Pro subscription')
    }
    
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO, // From setup-stripe.js
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing`,
      metadata: {
        userId: userId // Store userId for webhook processing
      }
    })
    
    return session
  },

  // Handle Stripe webhook events
  async handleWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        return await this.handleCheckoutComplete(event.data.object)
      case 'customer.subscription.updated':
        return await this.handleSubscriptionUpdate(event.data.object)
      case 'customer.subscription.deleted':
        return await this.handleSubscriptionCancel(event.data.object)
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  },

  async handleCheckoutComplete(session) {
    const { userId } = session.metadata
    const subscription = await stripe.subscriptions.retrieve(session.subscription)
    
    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        tier: 'PRO',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'active',
        renewalDate: new Date(subscription.current_period_end * 1000)
      }
    })
    
    console.log(`User ${userId} upgraded to PRO`)
  },

  async handleSubscriptionUpdate(subscription) {
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    })
    
    if (!user) return
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: subscription.status,
        renewalDate: new Date(subscription.current_period_end * 1000)
      }
    })
  },

  async handleSubscriptionCancel(subscription) {
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    })
    
    if (!user) return
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: 'FREE',
        subscriptionStatus: 'canceled',
        canceledAt: new Date()
      }
    })
  },

  // Get subscription status
  async getSubscriptionStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user || !user.stripeSubscriptionId) {
      return { tier: 'FREE', status: null }
    }
    
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    )
    
    return {
      tier: user.tier,
      status: subscription.status,
      renewalDate: new Date(subscription.current_period_end * 1000)
    }
  }
}
```

#### 2. Stripe Routes hinzufügen

**Datei**: `backend/src/routes/stripe.js`

```javascript
import express from 'express'
import { stripeService } from '../services/stripe-service.js'
import { requireAuth } from '../middleware/auth.js'
import Stripe from 'stripe'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// POST /api/v1/stripe/checkout
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { userId, email } = req.body
    
    // Verify user matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' })
    }
    
    const session = await stripeService.createCheckoutSession(userId, email)
    res.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// POST /api/v1/stripe/webhook
// This is called by Stripe when payment events happen
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature']
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    
    await stripeService.handleWebhook(event)
    res.json({ received: true })
  } catch (error) {
    res.status(400).json({ error: `Webhook Error: ${error.message}` })
  }
})

// GET /api/v1/stripe/subscription
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const status = await stripeService.getSubscriptionStatus(req.user.id)
    res.json(status)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// POST /api/v1/stripe/cancel
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    })
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No subscription found' })
    }
    
    await stripe.subscriptions.del(user.stripeSubscriptionId)
    res.json({ message: 'Subscription canceled' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
```

**Integration in main server**:
**Datei**: `backend/src/server.js` (ADD this)

```javascript
import stripeRouter from './routes/stripe.js'

// ... existing code ...

// Add Stripe routes
app.use('/api/v1/stripe', stripeRouter)
```

---

### Sprint 1d: Feature-Flags System (7 Stunden)

#### 1. Tier-Check Middleware

**Datei**: `backend/src/middleware/tier-check.js`

```javascript
export function requireTier(tier) {
  return async (req, res, next) => {
    const user = req.user // From authentication middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const tierHierarchy = { FREE: 0, PRO: 1, ENTERPRISE: 2 }
    
    if (tierHierarchy[user.tier] < tierHierarchy[tier]) {
      return res.status(403).json({
        error: `This feature requires ${tier} tier`,
        currentTier: user.tier
      })
    }
    
    next()
  }
}

// Usage in routes:
// router.get('/advanced-analytics', requireTier('PRO'), controller)
```

#### 2. Limits Helper

**Datei**: `backend/src/lib/tier-limits.js`

```javascript
export const tierLimits = {
  FREE: {
    portfolioSize: 10,
    alertsCount: 5,
    apiCallsDaily: 0, // No API access
    analyticsDepth: 'basic',
    canExport: false
  },
  PRO: {
    portfolioSize: Infinity,
    alertsCount: Infinity,
    apiCallsDaily: 1000,
    analyticsDepth: 'advanced',
    canExport: true
  },
  ENTERPRISE: {
    portfolioSize: Infinity,
    alertsCount: Infinity,
    apiCallsDaily: Infinity,
    analyticsDepth: 'advanced',
    canExport: true
  }
}

export function checkLimit(user, feature) {
  return tierLimits[user.tier][feature]
}

// Usage:
// const limit = checkLimit(user, 'portfolioSize')
// if (portfolio.length >= limit && user.tier === 'FREE') {
//   return res.status(403).json({ error: 'Upgrade to Pro' })
// }
```

---

### Sprint 1 Summary
```
□ Database migration (Prisma schema)           ✓ 5h
□ Stripe setup (keys, products, prices)       ✓ 3h
□ Backend Stripe routes (checkout, webhook)   ✓ 10h
□ Feature-flags system (middleware, limits)   ✓ 7h
──────────────────────────────────────────────
Total Sprint 1: 25 Stunden
```

---

## 🔧 SPRINT 2 (Woche 2-3): Price Updates & APIs

### Sprint 2a: Kostenlose Preis-Updates (8 Stunden)

#### 1. Steam API Service

**Datei**: `backend/src/services/price-service.js`

```javascript
import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const STEAM_API_URL = 'https://steamcommunity.com/market/priceoverview/'
const SKINBARON_API = 'https://api.skinbaron.com/api/v2/Market/GetItems'

// Rate limiter für Steam (max 1 req/sec)
class RateLimiter {
  constructor(delayMs = 1200) {
    this.delayMs = delayMs
    this.lastCall = 0
  }
  
  async wait() {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCall
    if (timeSinceLastCall < this.delayMs) {
      await new Promise(resolve => 
        setTimeout(resolve, this.delayMs - timeSinceLastCall)
      )
    }
    this.lastCall = Date.now()
  }
}

const steamLimiter = new RateLimiter(parseInt(process.env.STEAM_API_DELAY_MS || 1200))

export const priceService = {
  async getPrice(skinId, marketHashName) {
    try {
      // Try Steam API first
      const steamPrice = await this.getSteamPrice(marketHashName)
      if (steamPrice !== null) {
        await this.recordPriceHistory(skinId, steamPrice, 'steam')
        return steamPrice
      }
    } catch (err) {
      console.warn(`Steam API error for ${marketHashName}:`, err.message)
    }
    
    try {
      // Fallback to SkinBaron
      const baronPrice = await this.getSkinBaronPrice(marketHashName)
      if (baronPrice !== null) {
        await this.recordPriceHistory(skinId, baronPrice, 'skinbaron')
        return baronPrice
      }
    } catch (err) {
      console.warn(`SkinBaron API error for ${marketHashName}:`, err.message)
    }
    
    return null // No price found
  },

  async getSteamPrice(marketHashName) {
    await steamLimiter.wait() // Rate limit
    
    const url = `${STEAM_API_URL}?appid=730&market_hash_name=${encodeURIComponent(marketHashName)}&json=1`
    
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'CS2-Tracker/1.0'
      }
    })
    
    if (!response.data.success) {
      throw new Error('Steam API returned success=false')
    }
    
    // Parse price: "€1,234.56" → 1234.56
    const priceStr = response.data.lowest_price
      .replace(/[€$£]/g, '')
      .replace(',', '.')
    
    return parseFloat(priceStr)
  },

  async getSkinBaronPrice(marketHashName) {
    const response = await axios.get(SKINBARON_API, {
      params: { search: marketHashName },
      timeout: 5000
    })
    
    if (!response.data.items || response.data.items.length === 0) {
      return null
    }
    
    return response.data.items[0].averagePrice / 100 // Convert cents to euros
  },

  async recordPriceHistory(skinId, price, source) {
    await prisma.priceHistory.create({
      data: {
        skinId,
        price,
        source
      }
    })
  },

  // Batch update all skins (used by cron job)
  async updateAllPrices() {
    const skins = await prisma.skin.findMany()
    console.log(`Updating ${skins.length} skins...`)
    
    let updated = 0
    let errors = 0
    
    for (const skin of skins) {
      try {
        const price = await this.getPrice(skin.id, skin.marketHashName)
        if (price !== null) {
          await prisma.skin.update({
            where: { id: skin.id },
            data: { price, lastUpdated: new Date() }
          })
          updated++
        }
      } catch (err) {
        console.error(`Error updating ${skin.marketHashName}:`, err.message)
        errors++
      }
    }
    
    console.log(`Updated: ${updated}, Errors: ${errors}`)
    return { updated, errors }
  }
}
```

#### 2. Cron Job Script

**Datei**: `backend/scripts/update-prices-daily.js`

```javascript
import { priceService } from '../src/services/price-service.js'

async function main() {
  console.log(`[${new Date().toISOString()}] Starting price update...`)
  
  const result = await priceService.updateAllPrices()
  
  console.log(`[${new Date().toISOString()}] Price update complete`)
  console.log(result)
  
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
```

#### 3. GitHub Actions Workflow

**Datei**: `.github/workflows/update-prices-daily.yml`

```yaml
name: Daily Price Update

on:
  schedule:
    # Every day at 02:00 UTC (03:00 CET / 04:00 CEST)
    - cron: '0 2 * * *'
  workflow_dispatch:  # Manual trigger

jobs:
  update-prices:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      
      - name: Install dependencies
        working-directory: backend
        run: npm ci
      
      - name: Run price update
        working-directory: backend
        run: node scripts/update-prices-daily.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Send notification (optional)
        if: always()
        run: |
          echo "Price update job completed with status: ${{ job.status }}"
```

**GitHub Setup**:
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add `DATABASE_URL` secret (your PostgreSQL connection string)
3. Workflow will run automatically at 02:00 UTC daily

---

### Sprint 2b: API Key Management (12 Stunden)

#### 1. API Key Service

**Datei**: `backend/src/services/api-key-service.js`

```javascript
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export const apiKeyService = {
  async generateKey(userId, name, tier = 'starter') {
    const key = `sk_${crypto.randomBytes(32).toString('hex')}`
    
    const limits = {
      starter: 100,       // 100 calls/day
      developer: 10000,   // 10k calls/day
      enterprise: Infinity
    }
    
    const apiKey = await prisma.aPIKey.create({
      data: {
        userId,
        name,
        key,
        tier,
        callsLimit: limits[tier]
      }
    })
    
    return apiKey
  },

  async validateKey(key) {
    const apiKey = await prisma.aPIKey.findUnique({
      where: { key },
      include: { user: true }
    })
    
    if (!apiKey || !apiKey.isActive) {
      return null
    }
    
    return apiKey
  },

  async incrementUsage(apiKeyId) {
    await prisma.aPIKey.update({
      where: { id: apiKeyId },
      data: { callsUsedToday: { increment: 1 } }
    })
  },

  async logCall(apiKeyId, endpoint, statusCode) {
    await prisma.aPILog.create({
      data: {
        apiKeyId,
        endpoint,
        method: 'GET',
        statusCode
      }
    })
  },

  async resetDailyLimits() {
    // Run once per day (reset call counters)
    await prisma.aPIKey.updateMany({
      data: { callsUsedToday: 0 }
    })
  }
}
```

#### 2. API Routes

**Datei**: `backend/src/routes/api-keys.js`

```javascript
import express from 'express'
import { apiKeyService } from '../services/api-key-service.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/v1/api-keys - List user's keys
router.get('/', requireAuth, async (req, res) => {
  const keys = await prisma.aPIKey.findMany({
    where: { userId: req.user.id },
    select: {
      id: true,
      name: true,
      tier: true,
      callsUsedToday: true,
      callsLimit: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
      key: false // Don't return full key
    }
  })
  
  res.json(keys)
})

// POST /api/v1/api-keys - Create new key
router.post('/', requireAuth, async (req, res) => {
  const { name, tier } = req.body
  
  if (!name) {
    return res.status(400).json({ error: 'Name required' })
  }
  
  // Free users can't have API keys
  if (req.user.tier === 'FREE') {
    return res.status(403).json({ error: 'Upgrade to Pro for API access' })
  }
  
  const apiKey = await apiKeyService.generateKey(req.user.id, name, tier)
  
  res.json({
    id: apiKey.id,
    name: apiKey.name,
    key: apiKey.key,
    tier: apiKey.tier,
    message: 'Save this key somewhere safe - you won\'t see it again!'
  })
})

// DELETE /api/v1/api-keys/:id - Revoke key
router.delete('/:id', requireAuth, async (req, res) => {
  const key = await prisma.aPIKey.findUnique({
    where: { id: req.params.id }
  })
  
  if (!key || key.userId !== req.user.id) {
    return res.status(404).json({ error: 'Key not found' })
  }
  
  await prisma.aPIKey.update({
    where: { id: req.params.id },
    data: { isActive: false }
  })
  
  res.json({ message: 'Key revoked' })
})

export default router
```

**Integration in server.js**:
```javascript
import apiKeysRouter from './routes/api-keys.js'
app.use('/api/v1/api-keys', apiKeysRouter)
```

---

### Sprint 2c: Public API Endpoints (8 Stunden)

#### 1. Public Data Routes (requires API key)

**Datei**: `backend/src/middleware/api-key-auth.js`

```javascript
import { apiKeyService } from '../services/api-key-service.js'

export async function authenticateApiKey(req, res, next) {
  const key = req.headers['x-api-key']
  
  if (!key) {
    return res.status(401).json({ error: 'API key required' })
  }
  
  const apiKey = await apiKeyService.validateKey(key)
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  
  // Check rate limits
  if (apiKey.callsLimit && apiKey.callsUsedToday >= apiKey.callsLimit) {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }
  
  req.apiKey = apiKey
  next()
}

export async function logApiUsage(req, res, next) {
  // After route completes, log the call
  const originalJson = res.json
  
  res.json = function(data) {
    apiKeyService.logCall(req.apiKey.id, req.path, res.statusCode)
    apiKeyService.incrementUsage(req.apiKey.id)
    return originalJson.call(this, data)
  }
  
  next()
}
```

**Datei**: `backend/src/routes/public-api.js`

```javascript
import express from 'express'
import { authenticateApiKey, logApiUsage } from '../middleware/api-key-auth.js'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Apply API key auth to all routes
router.use(authenticateApiKey)
router.use(logApiUsage)

// GET /api/public/skins - All skins
router.get('/skins', async (req, res) => {
  const skins = await prisma.skin.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      rarity: true,
      imageUrl: true,
      lastUpdated: true
    }
  })
  
  res.json({ skins })
})

// GET /api/public/skins/:id - Single skin
router.get('/skins/:id', async (req, res) => {
  const skin = await prisma.skin.findUnique({
    where: { id: parseInt(req.params.id) }
  })
  
  if (!skin) {
    return res.status(404).json({ error: 'Skin not found' })
  }
  
  res.json(skin)
})

// GET /api/public/cases - All cases
router.get('/cases', async (req, res) => {
  const cases = await prisma.case.findMany({
    include: { skins: { select: { id: true, name: true } } }
  })
  
  res.json({ cases })
})

// GET /api/public/price-history/:skinId - Historical prices
router.get('/price-history/:skinId', async (req, res) => {
  const history = await prisma.priceHistory.findMany({
    where: { skinId: parseInt(req.params.skinId) },
    orderBy: { createdAt: 'desc' },
    take: 30 // Last 30 days
  })
  
  res.json({ history })
})

export default router
```

**Integration**:
```javascript
import publicApiRouter from './routes/public-api.js'
app.use('/api/public', publicApiRouter)
```

---

### Sprint 2 Summary
```
□ Kostenlose Preis-Updates (Steam + SkinBaron)  ✓ 8h
□ GitHub Actions Workflow (1x/täglich)         ✓ 2h
□ API Key Management (generate, revoke)        ✓ 12h
□ Public API Endpoints (für B2B)               ✓ 8h
──────────────────────────────────────────────
Total Sprint 2: 30 Stunden
```

---

## 🎨 SPRINT 3 (Woche 3): Frontend & UI

### Sprint 3a: Pricing Page (6 Stunden)

**Datei**: `frontend/src/app/pricing/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const tiers = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    description: 'Perfect for casual gamers',
    features: [
      'Portfolio: 10 skins',
      'Price Alerts: 5',
      'Basic Analytics',
      'Email Notifications'
    ],
    cta: 'Get Started',
    ctaVariant: 'outline'
  },
  {
    name: 'Pro',
    price: '€4.99',
    period: '/month',
    description: 'For serious traders & gamers',
    features: [
      'Unlimited Portfolio',
      'Unlimited Alerts',
      'Advanced Analytics',
      'Historical Data (30 days)',
      'CSV Export',
      'API Access (1000 calls/day)',
      'Priority Email Support'
    ],
    cta: 'Upgrade Now',
    ctaVariant: 'default',
    recommended: true
  }
]

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-300">
            Choose the perfect plan for your CS2 trading needs
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-gray-600 p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg p-8 ${
                tier.recommended
                  ? 'ring-2 ring-blue-500 bg-slate-800'
                  : 'bg-slate-700'
              }`}
            >
              {tier.recommended && (
                <div className="mb-4">
                  <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Recommended
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {tier.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">
                  {tier.price}
                </span>
                <span className="text-gray-400"> {tier.period}</span>
              </div>
              
              <Button
                className="w-full mb-6"
                variant={tier.ctaVariant as any}
                size="lg"
              >
                {tier.cta}
              </Button>
              
              <div className="space-y-4">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-gray-300 mb-4">
            Have questions? <Link href="/contact" className="text-blue-400 hover:text-blue-300">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Sprint 3b: Checkout Button (4 Stunden)

**Datei**: `frontend/src/components/upgrade-button.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import axios from 'axios'

export function UpgradeButton() {
  const { isSignedIn, user } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    if (!isSignedIn) {
      window.location.href = '/sign-in'
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(
        '/api/v1/stripe/checkout',
        {
          userId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress
        }
      )
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      size="lg"
    >
      {loading ? 'Loading...' : 'Upgrade to Pro'}
    </Button>
  )
}
```

### Sprint 3c: Feature Gating (5 Stunden)

**Datei**: `frontend/src/components/tier-gate.tsx`

```typescript
'use client'

import { useUser } from '@clerk/nextjs'
import { UpgradeButton } from './upgrade-button'

export function FeatureGate({
  requiredTier,
  children,
  fallback
}: {
  requiredTier: 'PRO' | 'ENTERPRISE'
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { user } = useUser()
  
  // Get tier from user metadata (set by backend)
  const userTier = (user?.publicMetadata?.tier as string) || 'FREE'
  
  const tierHierarchy = { FREE: 0, PRO: 1, ENTERPRISE: 2 }
  const hasAccess = tierHierarchy[userTier as keyof typeof tierHierarchy] >= 
                    tierHierarchy[requiredTier]
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  if (fallback) {
    return <>{fallback}</>
  }
  
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="font-semibold mb-2">Premium Feature</p>
      <p className="text-sm text-gray-600 mb-4">
        Upgrade to Pro to access advanced analytics and unlimited portfolio tracking.
      </p>
      <UpgradeButton />
    </div>
  )
}
```

**Usage**:
```tsx
<FeatureGate requiredTier="PRO">
  <AdvancedAnalytics />
</FeatureGate>
```

---

### Sprint 3 Summary
```
□ Pricing page (design + Stripe integration)  ✓ 10h
□ Feature gating (tier checks)                ✓ 5h
□ Upgrade flows (UX polish)                   ✓ 5h
──────────────────────────────────────────────
Total Sprint 3: 20 Stunden
```

---

## 🚀 SPRINT 4 (Woche 4): Testing & Launch

### Sprint 4a: Testing (20 Stunden)

```javascript
// backend/tests/stripe.test.js
import { describe, it, expect, beforeAll } from '@jest/globals'
import { stripeService } from '../src/services/stripe-service'

describe('Stripe Service', () => {
  it('should create checkout session', async () => {
    const session = await stripeService.createCheckoutSession(
      'user123',
      'test@example.com'
    )
    expect(session.id).toBeDefined()
    expect(session.url).toContain('checkout.stripe.com')
  })
  
  it('should handle webhook events', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: 'user123' },
          customer: 'cus_123',
          subscription: 'sub_123'
        }
      }
    }
    
    await expect(stripeService.handleWebhook(event)).resolves.not.toThrow()
  })
})
```

### Sprint 4b: Deployment Checklist (10 Stunden)

```markdown
# Launch Checklist

## Backend
- [ ] DATABASE_URL is set in Render
- [ ] STRIPE_SECRET_KEY is set
- [ ] STRIPE_WEBHOOK_SECRET is set
- [ ] STEAM_API_DELAY_MS is set (1200)
- [ ] Prisma migrations are deployed
- [ ] GitHub Actions secrets are configured
- [ ] All tests pass

## Frontend
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
- [ ] Clerk is configured
- [ ] Vercel env vars are set
- [ ] Build succeeds: `npm run build`

## Stripe
- [ ] Webhook endpoint is created and active
- [ ] Test payment succeeds
- [ ] Webhook events are received

## Monitoring
- [ ] Sentry is configured
- [ ] Error alerts are working
- [ ] Vercel analytics are on
```

---

## 📝 Summary aller 4 Sprints

```
SPRINT 1: Foundation & Payment (25h)
  - Database + Stripe Setup
  - Backend Routes
  - Feature-Flags
  
SPRINT 2: APIs & Updates (30h)
  - Kostenlose Preis-Updates
  - GitHub Actions
  - API Key Management
  - Public APIs für B2B
  
SPRINT 3: Frontend (20h)
  - Pricing Page
  - Checkout Flow
  - Feature Gating
  
SPRINT 4: Testing & Launch (30h)
  - Tests
  - Performance
  - Monitoring
  - Deployment
  
────────────────────────────
TOTAL: 105 Stunden (3 Wochen)
```

---

## 🎯 GO-LIVE CHECKLIST

### 1 Tag vor Launch
- [ ] Backup Database
- [ ] Test Stripe webhook
- [ ] Monitor error logs
- [ ] Verify all env vars

### Launch Day
- [ ] Deploy to Vercel (frontend)
- [ ] Deploy to Render (backend)
- [ ] Test checkout flow (real money)
- [ ] Announce on social media

### Nach Launch
- [ ] Monitor user signups
- [ ] Check error rates
- [ ] Respond to user feedback
- [ ] Fix critical bugs

---

## 📊 Expected Metrics (First Week)

```
Free signups:     500+
Pro conversions:  10-20 (2-4%)
API keys created: 5-10
Website traffic:  2,000+ visitors
Revenue:          €50-100
```

---

## 🚀 Nächste Schritte

1. **Review diese Phase 3 Plan**
2. **Gib Feedback** (was zu ändern?)
3. **Starte Sprint 1** (Database + Stripe)
4. **Progress tracking** (wöchentlich checken)

**Estimated Completion**: 28. Mai 2026 (MVP Launch)

---

**Dokumentation erstellt**: 2026-05-05  
**Status**: Ready for Implementation  
**Confidence**: 95%
