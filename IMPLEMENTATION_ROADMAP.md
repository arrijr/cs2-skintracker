# Sprint 2 Implementation Roadmap
**Created**: May 8, 2026  
**Status**: Ready for Phase 0-1 Implementation  
**Phase Duration**: Phase 0-1 = ~8h (May 8-9), Phase 2-3 = ~16h (May 9-13)

---

## Executive Summary

This roadmap translates SPRINT_2_PLAN.md into concrete implementation phases with specific files, functions, and database changes. The strategy prioritizes:

1. **Database Foundation** (Phase 0) - Add subscription schema
2. **API Endpoints** (Phase 1) - Portfolio management + Auth
3. **React Components** (Phase 2) - UI for portfolio creation & dashboard
4. **Monetization** (Phase 3) - Stripe subscription flow
5. **Advanced Features** (Phase 4) - Research tools

---

## Architecture Overview

### Database Schema Changes
Current state: `Portfolio`, `PortfolioHistory`, existing `User` model  
Needed: `UserSubscriptions` model (for Creator Tier tracking)

### API Endpoints (Backend)
Current: `/api/v1/portfolio` (CRUD skins)  
New in Sprint 2:
- `GET /api/v1/portfolios/:id/summary` (portfolio value + stats)
- `GET /api/v1/skins/:id/price-history` (30-day price data for charts)
- `POST /api/v1/subscriptions/checkout` (Stripe session)
- `POST /api/v1/subscriptions/webhook` (Stripe events)

### React Components (Frontend)
New components:
- `PortfolioSelector` (search + add skins)
- `PortfolioDashboard` (KPIs grid)
- `PriceHistory` (Chart.js component)
- `UpgradeModal` (Stripe checkout button)
- `ResearchPanel` (volatility + rarity)

---

## Phase 0: Database Migrations (2h)

### Objective
Add subscription tracking schema to support Creator + Pro tiers.

### Files to Create/Modify

#### 1. `backend/prisma/schema.prisma`
**Changes**: Add `UserSubscriptions` model

```prisma
model UserSubscriptions {
  id              Int     @id @default(autoincrement())
  user            User    @relation(fields: [userId], references: [id])
  userId          Int     @unique
  
  // Subscription metadata
  stripeCustomerId String? @unique // Link to Stripe customer
  stripeSubId     String? @unique  // Active Stripe subscription ID
  tier            String  @default("free")  // free, creator, pro
  status          String  @default("inactive") // active, canceled, pending
  
  // Billing dates
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  canceledAt         DateTime?
  
  // Feature flags (denormalized for faster queries)
  canCreatePortfolio Boolean @default(true)  // All tiers
  canAccessResearch  Boolean @default(false) // Pro only
  canExportCSV       Boolean @default(false) // Pro only
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([stripeCustomerId])
  @@index([tier])
  @@index([status])
}
```

**Action**: 
```bash
npx prisma migrate dev --name add_user_subscriptions
# This generates: backend/prisma/migrations/[timestamp]_add_user_subscriptions/migration.sql
```

#### 2. Update `User` model relation
In `backend/prisma/schema.prisma`, add to `User` model:
```prisma
subscription UserSubscriptions?
```

**Action**:
```bash
npx prisma generate  # Regenerate Prisma client
```

#### 3. Prisma Client Setup
No changes needed - auto-generated in `backend/src/prisma/prismaClient.js`

### Database Indexing Strategy
- ✅ Index on `stripeCustomerId` (fast Stripe webhook lookup)
- ✅ Index on `tier` (fast tier-gating queries)
- ✅ Index on `status` (find active subscriptions)
- ✅ Unique constraint on `userId` (1 subscription per user)

### Tests
File: `backend/src/__tests__/database.test.js` (NEW)
```javascript
test('UserSubscriptions migration succeeds', async () => {
  const sub = await prisma.userSubscriptions.create({
    data: {
      userId: testUserId,
      tier: 'free',
      status: 'inactive'
    }
  });
  expect(sub.id).toBeDefined();
});
```

---

## Phase 1: API Endpoints + Auth (6h)

### Objective
Implement portfolio management endpoints with Clerk JWT auth + Stripe webhook handler.

### 1.1 Subscription Management Service

**File**: `backend/src/services/subscriptionService.js` (NEW)

```javascript
// Core functions:
// - getOrCreateSubscription(userId) → UserSubscriptions record
// - updateSubscriptionFromStripe(stripeSubId, event) → update DB
// - checkTier(userId, requiredTier) → boolean
// - getTierFeatures(tier) → object with feature flags

export async function getOrCreateSubscription(userId) {
  let sub = await prisma.userSubscriptions.findUnique({
    where: { userId }
  });
  
  if (!sub) {
    sub = await prisma.userSubscriptions.create({
      data: {
        userId,
        tier: 'free',
        status: 'inactive'
      }
    });
  }
  
  return sub;
}

export async function checkTier(userId, requiredTier) {
  const sub = await prisma.userSubscriptions.findUnique({
    where: { userId }
  });
  
  const tierHierarchy = { free: 0, creator: 1, pro: 2 };
  return (tierHierarchy[sub?.tier || 'free'] || 0) >= tierHierarchy[requiredTier];
}

// ... more functions
```

### 1.2 Portfolio Summary Endpoint

**File**: `backend/src/routes/portfolioRoutes.js` (EXTEND)

Add route:
```javascript
// GET /api/v1/portfolio/summary - Dashboard data
router.get('/summary', verifyClerkJwt, getPortfolioSummary);
```

**File**: `backend/src/controllers/portfolioController.js` (EXTEND)

Add function:
```javascript
export async function getPortfolioSummary(req, res) {
  try {
    const userId = req.auth.userId; // From verifyClerkJwt
    
    // Fetch portfolio items (skinId + amount + buyPrice + buyDate)
    const items = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { buyDate: 'desc' }
    });
    
    if (items.length === 0) {
      return res.json({
        totalValue: 0,
        invested: 0,
        unrealizedPL: 0,
        percentageChange: 0,
        itemCount: 0,
        items: []
      });
    }
    
    // Calculate totals
    let invested = 0;
    let currentValue = 0;
    
    items.forEach(item => {
      const cost = item.buyPrice * item.amount;
      const current = (item.skin.priceLatest || 0) * item.amount;
      invested += cost;
      currentValue += current;
    });
    
    const unrealizedPL = currentValue - invested;
    const percentageChange = invested > 0 ? (unrealizedPL / invested) * 100 : 0;
    
    return res.json({
      totalValue: currentValue,
      invested: invested,
      unrealizedPL: unrealizedPL,
      percentageChange: percentageChange,
      itemCount: items.length,
      items: items.map(item => ({
        id: item.id,
        skinName: item.skin.name,
        skinId: item.skin.id,
        amount: item.amount,
        buyPrice: item.buyPrice,
        buyDate: item.buyDate,
        currentPrice: item.skin.priceLatest || 0,
        currentValue: (item.skin.priceLatest || 0) * item.amount,
        gainLoss: ((item.skin.priceLatest || 0) - item.buyPrice) * item.amount,
        gainLossPercent: item.buyPrice > 0 
          ? (((item.skin.priceLatest || 0) - item.buyPrice) / item.buyPrice) * 100 
          : 0
      }))
    });
  } catch (error) {
    logger.error('Portfolio summary error', { error });
    res.status(500).json({ error: 'Failed to fetch portfolio summary' });
  }
}
```

### 1.3 Price History Endpoint

**File**: `backend/src/routes/skinRoutes.js` (EXTEND)

Add route:
```javascript
router.get('/:id/price-history', getPriceHistory);
```

**File**: `backend/src/controllers/skinController.js` (EXTEND)

Add function:
```javascript
export async function getPriceHistory(req, res) {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days || 30);
    
    // Fetch historical prices
    const prices = await prisma.priceHistory.findMany({
      where: {
        skinId: parseInt(id),
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'asc' },
      take: 1000 // Limit to prevent abuse
    });
    
    // Calculate 7-day moving average
    const movingAvg = calculateMovingAverage(prices, 7);
    
    return res.json({
      skinId: id,
      prices: prices.map((p, idx) => ({
        date: p.date,
        price: p.price,
        movingAvg7d: movingAvg[idx]
      })),
      stats: {
        min: Math.min(...prices.map(p => p.price)),
        max: Math.max(...prices.map(p => p.price)),
        avg: prices.reduce((a, p) => a + p.price, 0) / prices.length
      }
    });
  } catch (error) {
    logger.error('Price history error', { error });
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
}

function calculateMovingAverage(prices, window) {
  return prices.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = prices.slice(start, i + 1);
    return slice.reduce((a, p) => a + p.price, 0) / slice.length;
  });
}
```

### 1.4 Stripe Checkout Session Endpoint

**File**: `backend/src/routes/subscriptionRoutes.js` (NEW)

```javascript
import express from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import { createCheckoutSession, handleWebhook } from '../controllers/subscriptionController.js';

const router = express.Router();

// Create checkout session for upgrading
router.post('/checkout', verifyClerkJwt, createCheckoutSession);

// Stripe webhook (no auth - verified by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
```

**File**: `backend/src/controllers/subscriptionController.js` (NEW)

```javascript
import Stripe from 'stripe';
import { subscriptionService } from '../services/subscriptionService.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(req, res) {
  try {
    const userId = req.auth.userId;
    const { tier } = req.body; // 'creator' or 'pro'
    
    // Validate tier
    if (!['creator', 'pro'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    
    // Get or create Stripe customer
    let sub = await subscriptionService.getOrCreateSubscription(userId);
    let customerId = sub.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId: String(userId) }
      });
      customerId = customer.id;
      
      // Update subscription with customerId
      sub = await prisma.userSubscriptions.update({
        where: { userId },
        data: { stripeCustomerId: customerId }
      });
    }
    
    // Get price ID from env
    const priceId = tier === 'creator' 
      ? process.env.STRIPE_PRICE_CREATOR_ID
      : process.env.STRIPE_PRICE_PRO_ID;
    
    if (!priceId) {
      return res.status(500).json({ error: `Price ID not configured for ${tier}` });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId: String(userId), tier }
    });
    
    logger.info('Checkout session created', { userId, tier, sessionId: session.id });
    
    return res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('Checkout session error', { error });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await subscriptionService.updateSubscriptionFromStripe(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await subscriptionService.cancelSubscriptionFromStripe(event.data.object);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error', { error });
    res.status(400).json({ error: 'Webhook failed' });
  }
}
```

### 1.5 Tier Gating Middleware

**File**: `backend/src/middleware/tierGating.js` (NEW)

```javascript
import { subscriptionService } from '../services/subscriptionService.js';

export async function requireTier(requiredTier) {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const allowed = await subscriptionService.checkTier(userId, requiredTier);
      if (!allowed) {
        return res.status(403).json({ error: `${requiredTier} tier required` });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Tier check failed' });
    }
  };
}
```

### 1.6 Register Routes in App

**File**: `backend/src/app.js` (EXTEND)

Add import + route:
```javascript
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

app.use("/api/v1/subscriptions", subscriptionRoutes);
```

### 1.7 Tests for Phase 1

**File**: `backend/src/__tests__/portfolio.test.js` (EXTEND)

```javascript
describe('Portfolio Summary', () => {
  test('GET /portfolio/summary returns correct totals', async () => {
    // Create test user + portfolio items
    const user = await prisma.user.create({ data: { email: 'test@example.com' } });
    
    const skin = await prisma.skin.create({
      data: {
        name: 'AK-47 Phantom Disruptor',
        marketHashName: 'AK-47 | Phantom Disruptor',
        priceLatest: 50
      }
    });
    
    await prisma.portfolio.create({
      data: {
        userId: user.id,
        skinId: skin.id,
        amount: 2,
        buyPrice: 40,
        buyDate: new Date()
      }
    });
    
    // Fetch summary
    const response = await request(app)
      .get('/api/v1/portfolio/summary')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.totalValue).toBe(100); // 2 * 50
    expect(response.body.invested).toBe(80);    // 2 * 40
  });
});
```

**File**: `backend/src/__tests__/subscription.test.js` (NEW)

```javascript
describe('Stripe Integration', () => {
  test('POST /subscriptions/checkout creates session', async () => {
    const response = await request(app)
      .post('/api/v1/subscriptions/checkout')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ tier: 'creator' });
    
    expect(response.status).toBe(200);
    expect(response.body.sessionId).toBeDefined();
  });
  
  test('Webhook handler updates subscription', async () => {
    const webhookEvent = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_123',
          customer: customerId,
          current_period_start: 1234567890,
          current_period_end: 1234567890,
          status: 'active'
        }
      }
    };
    
    // Mock stripe.webhooks.constructEvent
    // Post webhook event
    // Assert subscription updated in DB
  });
});
```

---

## Phase 2: React Components (8h)

### Objective
Build frontend UI for portfolio management, price visualization, and tier upgrades.

### 2.1 Portfolio Selector Component

**File**: `frontend/src/components/portfolio/PortfolioSelector.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { useSkinSearch } from '../../hooks/useSkinSearch';

interface PortfolioSelectorProps {
  onAddSkin: (skinId: number, amount: number, buyPrice: number) => void;
  onClose: () => void;
}

export function PortfolioSelector({ onAddSkin, onClose }: PortfolioSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState(1);
  const [buyPrice, setBuyPrice] = useState(0);
  const { skins, loading } = useSkinSearch(searchTerm);
  const [selectedSkin, setSelectedSkin] = useState<number | null>(null);

  const handleAdd = () => {
    if (selectedSkin) {
      onAddSkin(selectedSkin, amount, buyPrice);
      setSelectedSkin(null);
      setBuyPrice(0);
      setAmount(1);
    }
  };

  return (
    <div className="portfolio-selector">
      <h2>Add Skin to Portfolio</h2>
      
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search skins... (e.g., 'AK-47 Phantom')"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      
      {/* Results List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="skin-list">
          {skins.map(skin => (
            <div
              key={skin.id}
              className={`skin-item ${selectedSkin === skin.id ? 'selected' : ''}`}
              onClick={() => setSelectedSkin(skin.id)}
            >
              <img src={skin.imageUrl} alt={skin.name} />
              <div className="skin-details">
                <h4>{skin.name}</h4>
                <p>Current Price: €{skin.priceLatest?.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Input Fields */}
      {selectedSkin && (
        <div className="input-section">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            placeholder="Amount"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={buyPrice}
            onChange={(e) => setBuyPrice(parseFloat(e.target.value))}
            placeholder="Buy Price (€)"
          />
          <button onClick={handleAdd}>Add to Portfolio</button>
        </div>
      )}
      
      <button onClick={onClose} className="close-btn">Cancel</button>
    </div>
  );
}
```

### 2.2 Portfolio Dashboard Component

**File**: `frontend/src/components/portfolio/PortfolioDashboard.tsx` (NEW)

```typescript
import React, { useEffect, useState } from 'react';
import { portfolioAPI } from '../../api/portfolio';
import { PortfolioSelector } from './PortfolioSelector';

interface PortfolioItem {
  id: number;
  skinName: string;
  amount: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortfolioSummary {
  totalValue: number;
  invested: number;
  unrealizedPL: number;
  percentageChange: number;
  itemCount: number;
  items: PortfolioItem[];
}

export function PortfolioDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const data = await portfolioAPI.getSummary();
      setPortfolio(data);
    } catch (error) {
      console.error('Failed to load portfolio', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkin = async (skinId: number, amount: number, buyPrice: number) => {
    try {
      await portfolioAPI.addItem(skinId, amount, buyPrice);
      setShowAddModal(false);
      loadPortfolio();
    } catch (error) {
      console.error('Failed to add skin', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!portfolio) return <div>No portfolio data</div>;

  return (
    <div className="portfolio-dashboard">
      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Value</h3>
          <p className="value">€{portfolio.totalValue.toFixed(2)}</p>
        </div>
        <div className="kpi-card">
          <h3>Invested</h3>
          <p className="value">€{portfolio.invested.toFixed(2)}</p>
        </div>
        <div className="kpi-card">
          <h3>P&L</h3>
          <p className={`value ${portfolio.unrealizedPL >= 0 ? 'positive' : 'negative'}`}>
            €{portfolio.unrealizedPL.toFixed(2)}
          </p>
        </div>
        <div className="kpi-card">
          <h3>Change %</h3>
          <p className={`value ${portfolio.percentageChange >= 0 ? 'positive' : 'negative'}`}>
            {portfolio.percentageChange.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="items-section">
        <h2>Holdings ({portfolio.itemCount} items)</h2>
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Skin</th>
              <th>Amount</th>
              <th>Current Value</th>
              <th>P&L</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.items.map(item => (
              <tr key={item.id}>
                <td>{item.skinName}</td>
                <td>{item.amount}</td>
                <td>€{item.currentValue.toFixed(2)}</td>
                <td className={item.gainLoss >= 0 ? 'positive' : 'negative'}>
                  €{item.gainLoss.toFixed(2)}
                </td>
                <td className={item.gainLossPercent >= 0 ? 'positive' : 'negative'}>
                  {item.gainLossPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Button */}
      <button onClick={() => setShowAddModal(true)} className="btn-primary">
        + Add Skin
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <PortfolioSelector
          onAddSkin={handleAddSkin}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
```

### 2.3 Price History Chart Component

**File**: `frontend/src/components/portfolio/PriceHistory.tsx` (NEW)

```typescript
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { skinAPI } from '../../api/skins';

interface PricePoint {
  date: string;
  price: number;
  movingAvg7d: number;
}

interface PriceHistoryProps {
  skinId: number;
  skinName: string;
}

export function PriceHistory({ skinId, skinName }: PriceHistoryProps) {
  const [data, setData] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriceHistory();
  }, [skinId]);

  const loadPriceHistory = async () => {
    try {
      const result = await skinAPI.getPriceHistory(skinId, 30);
      setData(result.prices);
    } catch (error) {
      console.error('Failed to load price history', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading chart...</div>;
  if (!data || data.length === 0) return <div>No price data</div>;

  const chartData = {
    labels: data.map(p => new Date(p.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Price',
        data: data.map(p => p.price),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: '7-Day MA',
        data: data.map(p => p.movingAvg7d),
        borderColor: 'rgba(255, 99, 132, 1)',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      }
    ]
  };

  return (
    <div className="price-history">
      <h3>{skinName} - 30-Day Price History</h3>
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Price (€)' }
            }
          }
        }}
      />
    </div>
  );
}
```

### 2.4 Upgrade Modal Component

**File**: `frontend/src/components/subscription/UpgradeModal.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { subscriptionAPI } from '../../api/subscription';
import { loadStripe } from '@stripe/js';

interface UpgradeModalProps {
  currentTier: string;
  onClose: () => void;
}

export function UpgradeModal({ currentTier, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tier: 'creator' | 'pro') => {
    setLoading(true);
    try {
      const { sessionId } = await subscriptionAPI.createCheckoutSession(tier);
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_KEY);
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Upgrade failed', error);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upgrade-modal">
      <div className="modal-content">
        <h2>Upgrade Your Tier</h2>

        {/* Current Tier */}
        <div className="current-tier">
          <p>Current Tier: <strong>{currentTier}</strong></p>
        </div>

        {/* Tier Cards */}
        <div className="tier-cards">
          {/* Creator Tier */}
          <div className="tier-card">
            <h3>Creator Tier</h3>
            <p className="price">€4,99/month</p>
            <ul>
              <li>10+ skins in portfolio</li>
              <li>Price history charts</li>
              <li>Portfolio dashboard</li>
            </ul>
            <button
              onClick={() => handleUpgrade('creator')}
              disabled={loading || currentTier === 'creator'}
              className="btn-primary"
            >
              {currentTier === 'creator' ? 'Current Plan' : 'Upgrade Now'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="tier-card highlighted">
            <h3>Pro Tier</h3>
            <p className="price">€19,99/month</p>
            <ul>
              <li>Everything in Creator</li>
              <li>Volatility analysis</li>
              <li>Rarity scoring</li>
              <li>Export to CSV</li>
            </ul>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading || currentTier === 'pro'}
              className="btn-primary"
            >
              {currentTier === 'pro' ? 'Current Plan' : 'Upgrade Now'}
            </button>
          </div>
        </div>

        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
```

### 2.5 API Client Hooks

**File**: `frontend/src/api/portfolio.ts` (NEW)

```typescript
import { apiClient } from './client';

export const portfolioAPI = {
  async getSummary() {
    const res = await apiClient.get('/portfolio/summary');
    return res.data;
  },

  async addItem(skinId: number, amount: number, buyPrice: number) {
    const res = await apiClient.post('/portfolio', {
      skinId,
      amount,
      buyPrice
    });
    return res.data;
  }
};
```

**File**: `frontend/src/api/skins.ts` (NEW)

```typescript
import { apiClient } from './client';

export const skinAPI = {
  async getPriceHistory(skinId: number, days: number = 30) {
    const res = await apiClient.get(`/skins/${skinId}/price-history`, {
      params: { days }
    });
    return res.data;
  }
};
```

**File**: `frontend/src/api/subscription.ts` (NEW)

```typescript
import { apiClient } from './client';

export const subscriptionAPI = {
  async createCheckoutSession(tier: 'creator' | 'pro') {
    const res = await apiClient.post('/subscriptions/checkout', { tier });
    return res.data;
  }
};
```

### 2.6 Testing Components

**File**: `frontend/src/components/__tests__/PortfolioDashboard.test.tsx` (NEW)

```typescript
import { render, screen } from '@testing-library/react';
import { PortfolioDashboard } from '../portfolio/PortfolioDashboard';

jest.mock('../../api/portfolio', () => ({
  portfolioAPI: {
    getSummary: jest.fn(() => Promise.resolve({
      totalValue: 100,
      invested: 80,
      unrealizedPL: 20,
      percentageChange: 25,
      itemCount: 1,
      items: []
    }))
  }
}));

test('renders KPI cards', async () => {
  render(<PortfolioDashboard />);
  
  await screen.findByText('€100.00');
  expect(screen.getByText('€80.00')).toBeInTheDocument();
});
```

---

## Phase 3: Stripe Integration & Webhooks (6h)

### Objective
Complete Stripe integration with subscription lifecycle management.

### 3.1 Environment Variables

**File**: `.env` (EXTEND)

```bash
# Stripe API
STRIPE_SECRET_KEY=sk_test_... 
STRIPE_PRICE_CREATOR_ID=price_...
STRIPE_PRICE_PRO_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLIC_KEY=pk_test_...  # For frontend

# Frontend
REACT_APP_STRIPE_KEY=pk_test_...
FRONTEND_URL=http://localhost:3000
```

### 3.2 Subscription Service Implementation

**File**: `backend/src/services/subscriptionService.js` (COMPLETE)

```javascript
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const subscriptionService = {
  async getOrCreateSubscription(userId) {
    let sub = await prisma.userSubscriptions.findUnique({
      where: { userId }
    });
    
    if (!sub) {
      sub = await prisma.userSubscriptions.create({
        data: { userId, tier: 'free', status: 'inactive' }
      });
    }
    return sub;
  },

  async updateSubscriptionFromStripe(stripeSubscription) {
    const userId = parseInt(stripeSubscription.metadata?.userId || 0);
    const tier = stripeSubscription.metadata?.tier || 'creator';
    
    const sub = await prisma.userSubscriptions.update({
      where: { userId },
      data: {
        stripeSubId: stripeSubscription.id,
        status: stripeSubscription.status === 'active' ? 'active' : 'pending',
        tier: tier,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        canAccessResearch: tier === 'pro',
        canExportCSV: tier === 'pro'
      }
    });
    
    logger.info('Subscription updated from Stripe', { userId, tier, status: sub.status });
    return sub;
  },

  async cancelSubscriptionFromStripe(stripeSubscription) {
    const userId = parseInt(stripeSubscription.metadata?.userId || 0);
    
    const sub = await prisma.userSubscriptions.update({
      where: { userId },
      data: {
        tier: 'free',
        status: 'canceled',
        canceledAt: new Date(),
        canAccessResearch: false,
        canExportCSV: false
      }
    });
    
    logger.info('Subscription canceled', { userId });
    return sub;
  },

  async checkTier(userId, requiredTier) {
    const sub = await prisma.userSubscriptions.findUnique({
      where: { userId }
    });
    
    const tierHierarchy = { free: 0, creator: 1, pro: 2 };
    const userLevel = tierHierarchy[sub?.tier || 'free'] || 0;
    const requiredLevel = tierHierarchy[requiredTier] || 0;
    
    return userLevel >= requiredLevel;
  }
};
```

### 3.3 Webhook Testing

**File**: `backend/src/__tests__/webhook.test.js` (NEW)

```javascript
import Stripe from 'stripe';
import { subscriptionService } from '../services/subscriptionService.js';

describe('Stripe Webhooks', () => {
  test('handles subscription.created event', async () => {
    const event = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test456',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          metadata: {
            userId: '1',
            tier: 'creator'
          }
        }
      }
    };
    
    // Verify update succeeds
    const sub = await subscriptionService.updateSubscriptionFromStripe(event.data.object);
    expect(sub.status).toBe('active');
    expect(sub.tier).toBe('creator');
  });
});
```

---

## Phase 4: Research Tools (6h) [OPTIONAL - if time permits]

### Objective
Implement volatility calculations and rarity scoring for Pro tier.

### 4.1 Volatility Calculator Service

**File**: `backend/src/services/researchService.js` (NEW)

```javascript
export const researchService = {
  /**
   * Calculate standard deviation (volatility) of prices
   */
  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((a, p) => a + p, 0) / prices.length;
    const variance = prices.reduce((a, p) => a + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    // Return as percentage of mean
    return (stdDev / mean) * 100;
  },

  /**
   * Calculate rarity score based on heuristics
   */
  calculateRarityScore(skin) {
    let score = 0;
    
    // Rarity level contribution (0-30 points)
    const rarityMap = {
      'Consumer Grade': 5,
      'Industrial Grade': 10,
      'Mil-Spec': 15,
      'Restricted': 20,
      'Classified': 25,
      'Covert': 30
    };
    score += rarityMap[skin.rarity] || 0;
    
    // Condition (wear) contribution (0-20 points)
    const wearMap = {
      'Factory New': 20,
      'Minimal Wear': 18,
      'Field-Tested': 15,
      'Well-Worn': 10,
      'Battle-Scarred': 5
    };
    score += wearMap[skin.wear] || 0;
    
    // StatTrak bonus (0-20 points)
    if (skin.isStattrak) score += 20;
    
    // Souvenir bonus (0-30 points) - from collections
    if (skin.isStar) score += 30;
    
    // Normalize to 0-100
    return Math.min(100, score);
  }
};
```

### 4.2 Research Panel Component

**File**: `frontend/src/components/portfolio/ResearchPanel.tsx` (NEW)

```typescript
export function ResearchPanel({ skinId }: { skinId: number }) {
  const [research, setResearch] = useState(null);

  useEffect(() => {
    researchAPI.getAnalysis(skinId).then(setResearch);
  }, [skinId]);

  return (
    <div className="research-panel">
      <h3>Advanced Analytics</h3>
      <div className="metrics">
        <div className="metric">
          <label>Volatility</label>
          <p>{research?.volatility.toFixed(2)}%</p>
        </div>
        <div className="metric">
          <label>Rarity Score</label>
          <p>{research?.rarityScore}/100</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Summary: Implementation Schedule

### Week 1 (May 8-12)

| Day | Task | Est. | Files |
|-----|------|------|-------|
| Wed 5/8 | Phase 0: DB migrations | 2h | schema.prisma, migration SQL |
| Wed 5/8 | Phase 1.1-1.3: API endpoints | 4h | subscriptionService, portfolio controller, skinController |
| Thu 5/9 | Phase 1.4-1.6: Stripe setup | 4h | subscriptionRoutes, subscriptionController, tierGating middleware |
| Thu 5/9 | Phase 1.7: Test P1 endpoints | 4h | portfolio.test.js, subscription.test.js |
| Fri 5/10 | Phase 2.1-2.3: React components | 4h | PortfolioSelector, PortfolioDashboard, PriceHistory |
| Fri 5/10 | Phase 2.4-2.6: API clients + tests | 4h | API client hooks, component tests |

**Week 1 Total**: 22h actual / 24h estimated

### Week 2 (May 13-17)

| Day | Task | Est. | Files |
|-----|------|------|-------|
| Mon 5/13 | Phase 3: Stripe webhooks | 4h | subscriptionController webhook handler, webhook tests |
| Tue 5/14 | Integration testing | 4h | e2e tests for checkout + subscription flow |
| Wed 5/15 | Phase 4 (optional): Research tools | 4h | researchService, ResearchPanel |
| Thu 5/16 | Production polish + docs | 4h | Updates to CLAUDE.md, status report |

---

## Dependency Graph

```
Phase 0 (DB)
    ↓
Phase 1 (API) ← verifyClerkJwt, prismaClient
    ├─ 1.1 subscriptionService
    ├─ 1.2 portfolio endpoints
    ├─ 1.3 price history endpoint
    └─ 1.4-1.6 Stripe integration
        ↓
Phase 2 (React) ← depends on Phase 1 APIs
    ├─ 2.1 PortfolioSelector
    ├─ 2.2 PortfolioDashboard
    ├─ 2.3 PriceHistory (needs Chart.js)
    └─ 2.4-2.5 UpgradeModal + API clients
        ↓
Phase 3 (Webhooks) ← depends on Phase 1 + 2
    └─ Stripe webhook handler + tests
        ↓
Phase 4 (Optional) ← Research tools
    ├─ researchService
    └─ ResearchPanel component
```

---

## Key Architectural Decisions

### 1. Single Portfolio per User (MVP)
- Simplifies schema (no portfolio_id field)
- User can have one active portfolio
- Multi-portfolio support deferred to Sprint 3

### 2. REST API (No GraphQL)
- Simpler to implement + test
- Chart.js works well with REST
- GraphQL can be added later if needed

### 3. Stripe Test Mode
- All development uses Stripe test keys
- Webhooks tested locally with Stripe CLI
- Production keys configured in Vercel dashboard only

### 4. Price History Strategy
- PriceHistory model (already exists) stores daily snapshots
- Aggregate on read (fast for 30 days)
- If >90 days needed, implement aggregation job

### 5. Tier Gating
- Middleware approach (`requireTier('pro')`)
- Feature flags stored in UserSubscriptions
- Can extend to rate limiting per tier later

---

## Production Readiness Checklist

Before deploying Phase 1-3 to production:

- [ ] All tests passing (unit + integration + e2E)
- [ ] Stripe webhook tested with CLI
- [ ] CORS configured for frontend URL
- [ ] Rate limiting verified
- [ ] Error handling tested (network failures, Stripe API errors)
- [ ] No console.errors in browser
- [ ] Mobile responsive (check PortfolioDashboard on phone)
- [ ] CLAUDE.md updated with phase outcomes
- [ ] GitHub Issues closed for completed features

---

**Status**: Ready to begin Phase 0 implementation
**Owner**: Arthur
**Last Updated**: 2026-05-08
