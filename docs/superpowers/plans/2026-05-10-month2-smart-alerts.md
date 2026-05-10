# Month 2 — Smart Alerts Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an extensible alert engine with 4 alert types (price threshold, volatility, float-tier, case-EV) delivered via email and Discord — the differentiator nobody else in the CS2 tracker market has.

**Architecture:** Polymorphic `Alert` model with type + config JSON. Pluggable evaluator-per-type pattern. Cron job iterates active alerts, dispatches to evaluator, queues notifications via channel-specific delivery service. Tier gating enforces alert quotas (free=1, lite=5, pro=unlimited).

**Tech Stack:** Express 5 / Node 22 ESM, Prisma 6 + Postgres, Nodemailer (email), discord.js (bot), node-cron (orchestration). Existing emailService at `backend/src/services/emailService.js`. Existing cron at `backend/src/cron/priceAlertJob.js` (basic price-threshold logic — will refactor into new evaluator pattern).

**Servers required during work:**
- Backend: `cd backend && npm run dev` → http://localhost:5000
- Frontend: `cd frontend && npm run dev` → http://localhost:3000 (or 3001)

---

## File Structure

**New backend files:**
- `backend/src/services/alerts/` — alert engine root
  - `alertEngine.js` — orchestrator, dispatches to evaluators
  - `evaluators/priceThresholdEvaluator.js`
  - `evaluators/volatilityEvaluator.js`
  - `evaluators/floatTierEvaluator.js`
  - `evaluators/caseEvEvaluator.js`
  - `delivery/emailDelivery.js`
  - `delivery/discordDelivery.js`
- `backend/src/controllers/alertController.js` — REST endpoints
- `backend/src/routes/alertRoutes.js`
- `backend/src/__tests__/alerts.test.js`

**New frontend files:**
- `frontend/src/app/alerts/page.tsx` — alert management UI
- `frontend/src/app/alerts/AlertCard.tsx` — single alert display
- `frontend/src/app/alerts/CreateAlertModal.tsx` — create/edit
- `frontend/src/hooks/useAlerts.ts` — SWR hook

**Modified:**
- `backend/prisma/schema.prisma` — add Alert + AlertEvent models
- `backend/src/cron/priceAlertJob.js` — refactor to use new engine
- `backend/src/cron/index.js` — register new cron tasks
- `backend/src/app.js` — mount alertRoutes
- `backend/src/services/emailService.js` — add `sendAlertEmail()` template

---

## Task 1: Database Schema — Alert + AlertEvent Models

Add polymorphic Alert model. Existing `Watchlist.priceAlert` stays for backward compat but new alerts go through `Alert` model.

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: migration via `npx prisma migrate dev`

- [ ] **Step 1: Add Alert and AlertEvent models to schema**

In `backend/prisma/schema.prisma`, add after the `Watchlist` model:

```prisma
model Alert {
  id              Int       @id @default(autoincrement())
  userId          Int
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  skinId          Int?      // null = portfolio-wide alert
  skin            Skin?     @relation(fields: [skinId], references: [id], onDelete: Cascade)
  caseId          Int?      // for case_ev alerts
  case            Case?     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  type            String    // "price_threshold" | "volatility" | "float_tier" | "case_ev"
  config          Json      // type-specific config (see below)
  channels        String[]  // ["email", "discord"]
  isActive        Boolean   @default(true)
  cooldownMinutes Int       @default(60) // min time between fires
  lastTriggeredAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  events          AlertEvent[]

  @@index([userId, isActive])
  @@index([type, isActive])
}

model AlertEvent {
  id          Int       @id @default(autoincrement())
  alertId     Int
  alert       Alert     @relation(fields: [alertId], references: [id], onDelete: Cascade)
  triggeredAt DateTime  @default(now())
  payload     Json      // snapshot of conditions that triggered (price, volatility, etc.)
  delivered   String[]  // channels successfully delivered to
  failed      String[]  // channels that failed
  errorLog    String?

  @@index([alertId, triggeredAt])
}
```

Also add the back-relation on User and Skin and Case models:

In `User`:
```prisma
alerts          Alert[]
```

In `Skin`:
```prisma
alerts          Alert[]
```

In `Case`:
```prisma
alerts          Alert[]
```

Config JSON shapes (documented in code, not schema):
```js
// price_threshold: { direction: "above"|"below", price: number }
// volatility: { thresholdPercent: number, windowHours: 24 }
// float_tier: { tier: "FN"|"MW"|"FT"|"WW"|"BS", maxFloat: number, maxPrice: number }
// case_ev: { evMarginPercent: number } // fires when case price is N% below drop EV
```

- [ ] **Step 2: Run Prisma migration**

```bash
cd backend
npx prisma migrate dev --name add_alert_models
```

Expected: migration file created at `backend/prisma/migrations/<timestamp>_add_alert_models/migration.sql`. DB schema updated.

- [ ] **Step 3: Regenerate Prisma client**

```bash
cd backend
npx prisma generate
```

Expected: `prisma.alert` and `prisma.alertEvent` now available.

- [ ] **Step 4: Verify with quick query**

```bash
cd backend
node -e "
import('./src/prisma/prismaClient.js').then(async ({default: prisma}) => {
  const count = await prisma.alert.count();
  console.log('Alerts in DB:', count);
  await prisma.\$disconnect();
});
"
```

Expected: `Alerts in DB: 0` — confirms model is reachable.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add Alert and AlertEvent models for smart alerts engine"
```

---

## Task 2: Alert Engine Core + Evaluator Interface

Build the orchestrator + evaluator interface. No specific evaluator yet — that's Task 4-6.

**Files:**
- Create: `backend/src/services/alerts/alertEngine.js`
- Create: `backend/src/services/alerts/evaluators/baseEvaluator.js`
- Test: `backend/src/__tests__/alerts.test.js` (extend)

- [ ] **Step 1: Write failing test**

Create `backend/src/__tests__/alerts.test.js`:
```js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { evaluateAlert, runAllAlerts } from '../services/alerts/alertEngine.js';

describe('alertEngine', () => {
  it('evaluateAlert returns null when no evaluator registered for type', async () => {
    const result = await evaluateAlert({ id: 1, type: 'unknown_type', config: {} });
    expect(result).toBeNull();
  });

  it('evaluateAlert dispatches to registered evaluator and returns its result', async () => {
    const result = await evaluateAlert({
      id: 1,
      type: 'price_threshold',
      config: { direction: 'above', price: 100 },
      skin: { priceLatest: 150 }
    });
    expect(result).toBeTruthy();
    expect(result.triggered).toBe(true);
    expect(result.payload.currentPrice).toBe(150);
  });

  it('evaluateAlert returns triggered:false when condition not met', async () => {
    const result = await evaluateAlert({
      id: 1,
      type: 'price_threshold',
      config: { direction: 'above', price: 100 },
      skin: { priceLatest: 50 }
    });
    expect(result.triggered).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js
```

Expected: FAIL — `Cannot find module ../services/alerts/alertEngine.js`.

- [ ] **Step 3: Create base evaluator interface**

Create `backend/src/services/alerts/evaluators/baseEvaluator.js`:
```js
/**
 * Base evaluator interface. Each evaluator implements:
 *   evaluate(alert) -> { triggered: boolean, payload: object }
 *
 * `alert` is a Prisma Alert record with included relations (skin, case, user).
 * Evaluator is responsible for fetching any extra data it needs (e.g. price history).
 */
export class BaseEvaluator {
  async evaluate(/* alert */) {
    throw new Error('Evaluator must implement evaluate()');
  }
}
```

- [ ] **Step 4: Create alertEngine with priceThreshold evaluator inline (will extract later)**

Create `backend/src/services/alerts/alertEngine.js`:
```js
import prisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';

const evaluators = new Map();

export function registerEvaluator(type, evaluator) {
  evaluators.set(type, evaluator);
}

// Inline price_threshold evaluator (extracted to its own file in Task 4)
registerEvaluator('price_threshold', {
  async evaluate(alert) {
    const currentPrice = alert.skin?.priceLatest;
    if (currentPrice == null) return { triggered: false, payload: {} };
    const { direction, price } = alert.config;
    const triggered = direction === 'above'
      ? currentPrice >= price
      : currentPrice <= price;
    return {
      triggered,
      payload: { currentPrice, threshold: price, direction },
    };
  },
});

export async function evaluateAlert(alert) {
  const evaluator = evaluators.get(alert.type);
  if (!evaluator) return null;
  try {
    return await evaluator.evaluate(alert);
  } catch (err) {
    logger.error('Evaluator threw', { alertId: alert.id, type: alert.type, err: err.message });
    return null;
  }
}

export async function runAllAlerts() {
  const alerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: { skin: true, case: true, user: true },
  });
  const results = [];
  for (const alert of alerts) {
    // Cooldown check
    if (alert.lastTriggeredAt) {
      const ageMs = Date.now() - alert.lastTriggeredAt.getTime();
      if (ageMs < alert.cooldownMinutes * 60 * 1000) continue;
    }
    const result = await evaluateAlert(alert);
    if (result?.triggered) {
      results.push({ alert, result });
    }
  }
  return results;
}
```

- [ ] **Step 5: Run tests, expect pass**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js
```

Expected: 3 PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/alerts/ backend/src/__tests__/alerts.test.js
git commit -m "feat(alerts): alert engine core with pluggable evaluators"
```

---

## Task 3: Delivery Layer — Email + Discord

Two delivery channels. Email uses existing nodemailer setup. Discord uses webhook URLs (simpler than full bot for v1).

**Files:**
- Create: `backend/src/services/alerts/delivery/emailDelivery.js`
- Create: `backend/src/services/alerts/delivery/discordDelivery.js`
- Modify: `backend/src/services/emailService.js` (add `sendAlertEmail`)
- Modify: `backend/src/services/alerts/alertEngine.js` (call delivery)
- Test: `backend/src/__tests__/alerts.test.js`

- [ ] **Step 1: Add sendAlertEmail to emailService**

In `backend/src/services/emailService.js`, add at the bottom (before the export):

```js
export async function sendAlertEmail({ to, subject, alertType, skinName, payload }) {
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #fff;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 16px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⚡ skintrackr.com Alert</h1>
      </div>
      <div style="background: #1e293b; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #fff; margin-top: 0;">${escapeHtml(subject)}</h2>
        <p style="color: #cbd5e1;"><strong>Type:</strong> ${escapeHtml(alertType)}</p>
        ${skinName ? `<p style="color: #cbd5e1;"><strong>Skin:</strong> ${escapeHtml(skinName)}</p>` : ''}
        <pre style="background: #0f172a; padding: 16px; border-radius: 6px; color: #a78bfa; overflow-x: auto;">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
        <a href="https://skintrackr.com/alerts" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 6px;">Manage alerts</a>
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 16px; text-align: center;">
        skintrackr.com · <a href="https://skintrackr.com/account" style="color: #94a3b8;">unsubscribe</a>
      </p>
    </div>
  `;
  return sendMail({ to, subject: `[skintrackr] ${subject}`, html });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
```

If `sendMail` doesn't exist in the file under that name, look at the existing export and adapt — it's likely `sendEmail` or default export. Match the existing pattern.

- [ ] **Step 2: Create email delivery wrapper**

Create `backend/src/services/alerts/delivery/emailDelivery.js`:
```js
import { sendAlertEmail } from '../../emailService.js';
import logger from '../../../utils/logger.js';

export async function deliverEmail({ alert, result }) {
  const user = alert.user;
  if (!user?.email) {
    return { ok: false, error: 'no email on user record' };
  }
  if (!user.emailAlerts) {
    return { ok: false, error: 'user has emailAlerts=false' };
  }
  try {
    await sendAlertEmail({
      to: user.email,
      subject: buildSubject(alert, result),
      alertType: alert.type,
      skinName: alert.skin?.name,
      payload: result.payload,
    });
    return { ok: true };
  } catch (err) {
    logger.error('Email delivery failed', { alertId: alert.id, err: err.message });
    return { ok: false, error: err.message };
  }
}

function buildSubject(alert, result) {
  const skin = alert.skin?.name || 'your portfolio';
  switch (alert.type) {
    case 'price_threshold':
      return `${skin} hit $${result.payload.currentPrice}`;
    case 'volatility':
      return `${skin} volatility spike (${result.payload.changePercent}%)`;
    case 'float_tier':
      return `Rare float listed: ${skin}`;
    case 'case_ev':
      return `Case-EV inversion: ${alert.case?.name || skin}`;
    default:
      return `Alert: ${alert.type}`;
  }
}
```

- [ ] **Step 3: Create Discord delivery**

Create `backend/src/services/alerts/delivery/discordDelivery.js`:
```js
import logger from '../../../utils/logger.js';

const COLORS = {
  price_threshold: 0xa855f7,  // purple
  volatility: 0xf59e0b,        // amber
  float_tier: 0x10b981,        // emerald
  case_ev: 0xec4899,           // pink
};

export async function deliverDiscord({ alert, result, webhookUrl }) {
  if (!webhookUrl) {
    return { ok: false, error: 'no webhook URL configured' };
  }
  const embed = {
    title: buildTitle(alert, result),
    description: buildDescription(alert, result),
    color: COLORS[alert.type] || 0x64748b,
    fields: Object.entries(result.payload).map(([name, value]) => ({
      name,
      value: String(value),
      inline: true,
    })),
    timestamp: new Date().toISOString(),
    footer: { text: 'skintrackr.com' },
  };
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Discord ${res.status}: ${body}`);
    }
    return { ok: true };
  } catch (err) {
    logger.error('Discord delivery failed', { alertId: alert.id, err: err.message });
    return { ok: false, error: err.message };
  }
}

function buildTitle(alert, result) {
  return `⚡ ${alert.type.replace('_', ' ').toUpperCase()}: ${alert.skin?.name || alert.case?.name || 'Portfolio'}`;
}

function buildDescription(alert, result) {
  const lines = [];
  if (alert.skin) lines.push(`**Skin:** ${alert.skin.name}`);
  if (alert.case) lines.push(`**Case:** ${alert.case.name}`);
  return lines.join('\n');
}
```

- [ ] **Step 4: Wire delivery into alertEngine**

In `backend/src/services/alerts/alertEngine.js`, add at the top:
```js
import { deliverEmail } from './delivery/emailDelivery.js';
import { deliverDiscord } from './delivery/discordDelivery.js';
```

Add a new exported function:
```js
export async function deliverAlert({ alert, result }) {
  const delivered = [];
  const failed = [];

  for (const channel of alert.channels) {
    let res;
    if (channel === 'email') {
      res = await deliverEmail({ alert, result });
    } else if (channel === 'discord') {
      res = await deliverDiscord({ alert, result, webhookUrl: alert.user?.discordWebhook });
    } else {
      res = { ok: false, error: `unknown channel ${channel}` };
    }
    if (res.ok) delivered.push(channel);
    else failed.push(channel);
  }

  // Persist event + update lastTriggeredAt
  await prisma.alertEvent.create({
    data: {
      alertId: alert.id,
      payload: result.payload,
      delivered,
      failed,
      errorLog: failed.length ? failed.map(c => `${c}: failed`).join('; ') : null,
    },
  });
  await prisma.alert.update({
    where: { id: alert.id },
    data: { lastTriggeredAt: new Date() },
  });

  return { delivered, failed };
}
```

Update `runAllAlerts` to call `deliverAlert`:
```js
export async function runAllAlerts() {
  const alerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: { skin: true, case: true, user: true },
  });
  const results = [];
  for (const alert of alerts) {
    if (alert.lastTriggeredAt) {
      const ageMs = Date.now() - alert.lastTriggeredAt.getTime();
      if (ageMs < alert.cooldownMinutes * 60 * 1000) continue;
    }
    const result = await evaluateAlert(alert);
    if (result?.triggered) {
      const delivery = await deliverAlert({ alert, result });
      results.push({ alert, result, delivery });
    }
  }
  return results;
}
```

- [ ] **Step 5: Add discordWebhook field to User model**

In `backend/prisma/schema.prisma`, add to User:
```prisma
discordWebhook  String?
```

Run:
```bash
cd backend
npx prisma migrate dev --name user_discord_webhook
npx prisma generate
```

- [ ] **Step 6: Smoke test (no test, just import sanity)**

```bash
cd backend
node -e "import('./src/services/alerts/alertEngine.js').then(m => console.log(Object.keys(m)));"
```

Expected: `['registerEvaluator', 'evaluateAlert', 'runAllAlerts', 'deliverAlert']`

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/alerts/delivery/ backend/src/services/alerts/alertEngine.js backend/src/services/emailService.js backend/prisma/
git commit -m "feat(alerts): email + Discord delivery + AlertEvent logging"
```

---

## Task 4: Volatility Evaluator

Fires when a skin's price moves >X% in last N hours. Uses `PriceHistory` records.

**Files:**
- Create: `backend/src/services/alerts/evaluators/volatilityEvaluator.js`
- Modify: `backend/src/services/alerts/alertEngine.js` (register evaluator)
- Test: `backend/src/__tests__/alerts.test.js`

- [ ] **Step 1: Write failing test**

In `backend/src/__tests__/alerts.test.js`, add:
```js
import { volatilityEvaluator } from '../services/alerts/evaluators/volatilityEvaluator.js';

describe('volatilityEvaluator', () => {
  it('triggers when 24h change exceeds threshold', async () => {
    const alert = {
      id: 1,
      type: 'volatility',
      config: { thresholdPercent: 5, windowHours: 24 },
      skin: {
        id: 100,
        name: 'AK-47 | Redline',
        priceLatest: 110,
      },
    };
    // Stub: most recent priceHistory 24h ago = 100, current = 110 → +10% → triggers
    const result = await volatilityEvaluator.evaluate(alert, {
      priceHistoryFetcher: async () => ({ price: 100 }),
    });
    expect(result.triggered).toBe(true);
    expect(result.payload.changePercent).toBeCloseTo(10, 1);
  });

  it('does not trigger when change below threshold', async () => {
    const alert = {
      id: 1,
      type: 'volatility',
      config: { thresholdPercent: 5, windowHours: 24 },
      skin: { id: 100, priceLatest: 102 },
    };
    const result = await volatilityEvaluator.evaluate(alert, {
      priceHistoryFetcher: async () => ({ price: 100 }),
    });
    expect(result.triggered).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js -t volatilityEvaluator
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create volatilityEvaluator**

Create `backend/src/services/alerts/evaluators/volatilityEvaluator.js`:
```js
import prisma from '../../../prisma/prismaClient.js';

async function defaultPriceHistoryFetcher({ skinId, hoursAgo }) {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return prisma.priceHistory.findFirst({
    where: { skinId, date: { lte: cutoff } },
    orderBy: { date: 'desc' },
  });
}

export const volatilityEvaluator = {
  async evaluate(alert, { priceHistoryFetcher = defaultPriceHistoryFetcher } = {}) {
    const { thresholdPercent, windowHours = 24 } = alert.config;
    const skinId = alert.skinId ?? alert.skin?.id;
    const currentPrice = alert.skin?.priceLatest;
    if (skinId == null || currentPrice == null) {
      return { triggered: false, payload: { reason: 'missing skin or price' } };
    }
    const past = await priceHistoryFetcher({ skinId, hoursAgo: windowHours });
    if (!past?.price) {
      return { triggered: false, payload: { reason: 'no historical price found' } };
    }
    const changePercent = ((currentPrice - past.price) / past.price) * 100;
    return {
      triggered: Math.abs(changePercent) >= thresholdPercent,
      payload: {
        currentPrice,
        pastPrice: past.price,
        changePercent: Number(changePercent.toFixed(2)),
        windowHours,
        thresholdPercent,
      },
    };
  },
};
```

- [ ] **Step 4: Register in alertEngine**

In `backend/src/services/alerts/alertEngine.js`, add at the top:
```js
import { volatilityEvaluator } from './evaluators/volatilityEvaluator.js';
```

Add after the existing `registerEvaluator('price_threshold', ...)` call:
```js
registerEvaluator('volatility', volatilityEvaluator);
```

- [ ] **Step 5: Run tests**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js
```

Expected: All previous tests still PASS, 2 new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/alerts/
git commit -m "feat(alerts): volatility evaluator (>X% in N hours)"
```

---

## Task 5: Float-Tier Evaluator

Fires when a rare float listing appears. Requires Skin to have `priceLatest` and ideally `lowestFloat` data — depends on what SteamWebAPI provides.

For v1: trigger when `priceLatest <= maxPrice` AND skin's wear matches the configured tier. (We don't yet store individual listings — this is a price+wear-tier filter, not literal "rare float fresh on market".)

**Files:**
- Create: `backend/src/services/alerts/evaluators/floatTierEvaluator.js`
- Modify: `backend/src/services/alerts/alertEngine.js`
- Test: `backend/src/__tests__/alerts.test.js`

- [ ] **Step 1: Write failing test**

```js
import { floatTierEvaluator } from '../services/alerts/evaluators/floatTierEvaluator.js';

describe('floatTierEvaluator', () => {
  it('triggers when wear matches tier and price below max', async () => {
    const result = await floatTierEvaluator.evaluate({
      id: 1,
      type: 'float_tier',
      config: { tier: 'FN', maxPrice: 200 },
      skin: { wear: 'Factory New', priceLatest: 180 },
    });
    expect(result.triggered).toBe(true);
  });

  it('does not trigger when price above max', async () => {
    const result = await floatTierEvaluator.evaluate({
      id: 1,
      type: 'float_tier',
      config: { tier: 'FN', maxPrice: 200 },
      skin: { wear: 'Factory New', priceLatest: 250 },
    });
    expect(result.triggered).toBe(false);
  });

  it('does not trigger when wear does not match tier', async () => {
    const result = await floatTierEvaluator.evaluate({
      id: 1,
      type: 'float_tier',
      config: { tier: 'FN', maxPrice: 200 },
      skin: { wear: 'Field-Tested', priceLatest: 100 },
    });
    expect(result.triggered).toBe(false);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js -t floatTierEvaluator
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create floatTierEvaluator**

Create `backend/src/services/alerts/evaluators/floatTierEvaluator.js`:
```js
const TIER_TO_WEAR = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
};

export const floatTierEvaluator = {
  async evaluate(alert) {
    const { tier, maxPrice } = alert.config;
    const expectedWear = TIER_TO_WEAR[tier];
    const skin = alert.skin;
    if (!skin || !expectedWear) {
      return { triggered: false, payload: { reason: 'missing skin or invalid tier' } };
    }
    const triggered = skin.wear === expectedWear && skin.priceLatest != null && skin.priceLatest <= maxPrice;
    return {
      triggered,
      payload: {
        wear: skin.wear,
        expectedWear,
        currentPrice: skin.priceLatest,
        maxPrice,
        tier,
      },
    };
  },
};
```

- [ ] **Step 4: Register evaluator**

In `backend/src/services/alerts/alertEngine.js`:
```js
import { floatTierEvaluator } from './evaluators/floatTierEvaluator.js';
// ...
registerEvaluator('float_tier', floatTierEvaluator);
```

- [ ] **Step 5: Run tests**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js
```

Expected: All previous + 3 new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/alerts/
git commit -m "feat(alerts): float-tier evaluator (price+wear filter)"
```

---

## Task 6: Case-EV Inversion Evaluator

Fires when a Case's market price is N% below its expected drop value. Drop EV is sum of (drop chance × skin price) across the case's drops.

**Files:**
- Create: `backend/src/services/alerts/evaluators/caseEvEvaluator.js`
- Modify: `backend/src/services/alerts/alertEngine.js`
- Test: `backend/src/__tests__/alerts.test.js`

- [ ] **Step 1: Write failing test**

```js
import { caseEvEvaluator } from '../services/alerts/evaluators/caseEvEvaluator.js';

describe('caseEvEvaluator', () => {
  it('triggers when case price is below EV by margin', async () => {
    const alert = {
      id: 1,
      type: 'case_ev',
      config: { evMarginPercent: 10 },
      case: {
        id: 1,
        name: 'Operation Bravo Case',
        price: 80, // current case price
        skins: [
          { dropChance: 0.5, skin: { priceLatest: 100 } },
          { dropChance: 0.5, skin: { priceLatest: 100 } },
        ],
      },
    };
    // EV = 0.5*100 + 0.5*100 = 100. Case=80 → 20% below EV → triggers (margin 10%)
    const result = await caseEvEvaluator.evaluate(alert, {
      caseDataFetcher: async () => alert.case,
    });
    expect(result.triggered).toBe(true);
    expect(result.payload.evMargin).toBeCloseTo(20, 1);
  });

  it('does not trigger when below margin', async () => {
    const alert = {
      id: 1,
      type: 'case_ev',
      config: { evMarginPercent: 30 },
      case: {
        id: 1,
        price: 90,
        skins: [
          { dropChance: 1.0, skin: { priceLatest: 100 } },
        ],
      },
    };
    // 10% below EV but margin requires 30% → no trigger
    const result = await caseEvEvaluator.evaluate(alert, {
      caseDataFetcher: async () => alert.case,
    });
    expect(result.triggered).toBe(false);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js -t caseEvEvaluator
```

Expected: FAIL.

- [ ] **Step 3: Create caseEvEvaluator**

Create `backend/src/services/alerts/evaluators/caseEvEvaluator.js`:
```js
import prisma from '../../../prisma/prismaClient.js';

async function defaultCaseDataFetcher(caseId) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      skins: {
        include: { skin: true },
      },
    },
  });
}

export const caseEvEvaluator = {
  async evaluate(alert, { caseDataFetcher = defaultCaseDataFetcher } = {}) {
    const { evMarginPercent } = alert.config;
    const caseId = alert.caseId ?? alert.case?.id;
    if (caseId == null) {
      return { triggered: false, payload: { reason: 'no caseId on alert' } };
    }
    const c = alert.case?.skins ? alert.case : await caseDataFetcher(caseId);
    if (!c?.price || !c.skins?.length) {
      return { triggered: false, payload: { reason: 'no case data' } };
    }
    let ev = 0;
    for (const cs of c.skins) {
      const skinPrice = cs.skin?.priceLatest ?? 0;
      const chance = cs.dropChance ?? 0;
      ev += skinPrice * chance;
    }
    if (ev === 0) {
      return { triggered: false, payload: { reason: 'EV is zero' } };
    }
    const evMargin = ((ev - c.price) / ev) * 100; // positive = case cheaper than EV
    return {
      triggered: evMargin >= evMarginPercent,
      payload: {
        casePrice: c.price,
        expectedValue: Number(ev.toFixed(2)),
        evMargin: Number(evMargin.toFixed(2)),
        marginThreshold: evMarginPercent,
      },
    };
  },
};
```

- [ ] **Step 4: Register evaluator**

In `backend/src/services/alerts/alertEngine.js`:
```js
import { caseEvEvaluator } from './evaluators/caseEvEvaluator.js';
// ...
registerEvaluator('case_ev', caseEvEvaluator);
```

- [ ] **Step 5: Run tests**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPattern=alerts.test.js
```

Expected: All previous + 2 new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/alerts/
git commit -m "feat(alerts): case-EV inversion evaluator"
```

---

## Task 7: REST API + Cron Wiring

Expose CRUD endpoints for alerts. Refactor existing `priceAlertJob.js` to use the new engine. Register cron.

**Files:**
- Create: `backend/src/controllers/alertController.js`
- Create: `backend/src/routes/alertRoutes.js`
- Modify: `backend/src/app.js` (mount route)
- Modify: `backend/src/cron/priceAlertJob.js` (delegate to engine)
- Modify: `backend/src/cron/index.js` (verify schedule)

- [ ] **Step 1: Create alertController**

Create `backend/src/controllers/alertController.js`:
```js
import prisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';

const TIER_QUOTA = { free: 1, lite: 5, pro: 999 };

function getTierFromUser(user) {
  return user?.isPremium ? 'pro' : 'free';
  // TODO: when Lite tier is distinct in DB, return 'lite' for those users
}

export async function listAlerts(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const alerts = await prisma.alert.findMany({
    where: { userId },
    include: { skin: true, case: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ alerts });
}

export async function createAlert(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });

  const { type, skinId, caseId, config, channels, cooldownMinutes } = req.body;
  if (!['price_threshold', 'volatility', 'float_tier', 'case_ev'].includes(type)) {
    return res.status(400).json({ error: 'invalid alert type' });
  }
  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ error: 'at least one channel required' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = getTierFromUser(user);
  const existing = await prisma.alert.count({ where: { userId, isActive: true } });
  const quota = TIER_QUOTA[tier];
  if (existing >= quota) {
    return res.status(403).json({
      error: 'alert quota exceeded for tier',
      tier,
      quota,
      current: existing,
    });
  }

  try {
    const alert = await prisma.alert.create({
      data: {
        userId,
        skinId: skinId ?? null,
        caseId: caseId ?? null,
        type,
        config,
        channels,
        cooldownMinutes: cooldownMinutes ?? 60,
      },
      include: { skin: true, case: true },
    });
    return res.status(201).json({ alert });
  } catch (err) {
    logger.error('createAlert failed', { userId, err: err.message });
    return res.status(500).json({ error: 'failed to create alert' });
  }
}

export async function updateAlert(req, res) {
  const userId = req.userId;
  const id = parseInt(req.params.id);
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    return res.status(404).json({ error: 'alert not found' });
  }
  const { config, channels, isActive, cooldownMinutes } = req.body;
  const updated = await prisma.alert.update({
    where: { id },
    data: {
      ...(config !== undefined ? { config } : {}),
      ...(channels !== undefined ? { channels } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(cooldownMinutes !== undefined ? { cooldownMinutes } : {}),
    },
    include: { skin: true, case: true },
  });
  return res.json({ alert: updated });
}

export async function deleteAlert(req, res) {
  const userId = req.userId;
  const id = parseInt(req.params.id);
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    return res.status(404).json({ error: 'alert not found' });
  }
  await prisma.alert.delete({ where: { id } });
  return res.status(204).send();
}

export async function getAlertEvents(req, res) {
  const userId = req.userId;
  const id = parseInt(req.params.id);
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    return res.status(404).json({ error: 'alert not found' });
  }
  const events = await prisma.alertEvent.findMany({
    where: { alertId: id },
    orderBy: { triggeredAt: 'desc' },
    take: 50,
  });
  return res.json({ events });
}
```

- [ ] **Step 2: Create alertRoutes**

Create `backend/src/routes/alertRoutes.js`:
```js
import { Router } from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import { listAlerts, createAlert, updateAlert, deleteAlert, getAlertEvents } from '../controllers/alertController.js';

const router = Router();

router.use(verifyClerkJwt);
router.get('/', listAlerts);
router.post('/', createAlert);
router.patch('/:id', updateAlert);
router.delete('/:id', deleteAlert);
router.get('/:id/events', getAlertEvents);

export default router;
```

- [ ] **Step 3: Mount route in app.js**

In `backend/src/app.js`, after the existing `/api/v1/research` mount line:
```js
import alertRoutes from './routes/alertRoutes.js';
// ...
app.use('/api/v1/alerts', alertRoutes);
```

- [ ] **Step 4: Refactor priceAlertJob.js**

Replace `backend/src/cron/priceAlertJob.js` body with:
```js
import { runAllAlerts } from '../services/alerts/alertEngine.js';
import logger from '../utils/logger.js';

export async function checkPriceAlerts() {
  try {
    const fired = await runAllAlerts();
    if (fired.length) {
      logger.info('Alerts fired', {
        count: fired.length,
        types: fired.map(f => f.alert.type),
      });
    }
  } catch (err) {
    logger.error('checkPriceAlerts failed', { err: err.message });
  }
}
```

Keep the existing export name (`checkPriceAlerts`) so cron/index.js doesn't break.

- [ ] **Step 5: Smoke test endpoints**

Start backend (`cd backend && npm run dev`). Then:

```bash
# List (should be empty)
curl -s http://localhost:5000/api/v1/alerts -H "Authorization: Bearer test" | head

# Create one
curl -s -X POST http://localhost:5000/api/v1/alerts \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"type":"price_threshold","skinId":1,"config":{"direction":"above","price":100},"channels":["email"]}'
```

Expected: 201 with alert payload.

- [ ] **Step 6: Run all backend tests**

```bash
cd backend
API_URL=http://localhost:5000 npm run test:sprint2
```

Expected: existing tests still pass; new alert tests already passing.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/alertController.js backend/src/routes/alertRoutes.js backend/src/app.js backend/src/cron/priceAlertJob.js
git commit -m "feat(alerts): REST API for CRUD + refactor cron to use new engine"
```

---

## Task 8: Frontend — Alert Management Page

Build `/alerts` page where users create/edit/delete alerts.

**Files:**
- Create: `frontend/src/app/alerts/page.tsx`
- Create: `frontend/src/app/alerts/AlertCard.tsx`
- Create: `frontend/src/app/alerts/CreateAlertModal.tsx`
- Create: `frontend/src/hooks/useAlerts.ts`

- [ ] **Step 1: Create useAlerts hook**

Create `frontend/src/hooks/useAlerts.ts`:
```ts
"use client";
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface Alert {
  id: number;
  type: 'price_threshold' | 'volatility' | 'float_tier' | 'case_ev';
  skinId: number | null;
  caseId: number | null;
  config: Record<string, any>;
  channels: string[];
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  skin?: { id: number; name: string; imageUrl: string | null };
  case?: { id: number; name: string };
}

export function useAlerts() {
  const { getToken } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await fetch(`${apiUrl}/api/v1/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlerts(data.alerts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, getToken]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async (data: Partial<Alert>) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchAlerts();
  };

  const updateAlert = async (id: number, data: Partial<Alert>) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchAlerts();
  };

  const deleteAlert = async (id: number) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/alerts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchAlerts();
  };

  return { alerts, isLoading, error, refresh: fetchAlerts, createAlert, updateAlert, deleteAlert };
}
```

- [ ] **Step 2: Create AlertCard component**

Create `frontend/src/app/alerts/AlertCard.tsx`:
```tsx
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Trash2, Mail, MessageSquare } from "lucide-react";
import { Alert } from "@/hooks/useAlerts";

const TYPE_LABELS: Record<Alert['type'], string> = {
  price_threshold: 'Price Threshold',
  volatility: 'Volatility Spike',
  float_tier: 'Float Tier',
  case_ev: 'Case-EV Inversion',
};

const TYPE_COLORS: Record<Alert['type'], string> = {
  price_threshold: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  volatility: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  float_tier: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  case_ev: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
};

interface AlertCardProps {
  alert: Alert;
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}

export function AlertCard({ alert, onToggle, onDelete }: AlertCardProps) {
  const target = alert.skin?.name || alert.case?.name || 'Portfolio';
  return (
    <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={TYPE_COLORS[alert.type]}>
                {TYPE_LABELS[alert.type]}
              </Badge>
              <span className="text-white font-medium">{target}</span>
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {summarizeConfig(alert)}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {alert.channels.includes('email') && (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> email</span>
              )}
              {alert.channels.includes('discord') && (
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Discord</span>
              )}
              {alert.lastTriggeredAt && (
                <span>last fired {new Date(alert.lastTriggeredAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={alert.isActive}
            onCheckedChange={(checked) => onToggle(alert.id, checked)}
          />
          <Button variant="ghost" size="sm" onClick={() => onDelete(alert.id)} className="text-red-400 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function summarizeConfig(alert: Alert): string {
  switch (alert.type) {
    case 'price_threshold':
      return `Trigger when price ${alert.config.direction} €${alert.config.price}`;
    case 'volatility':
      return `Trigger when ${alert.config.windowHours ?? 24}h change ≥ ${alert.config.thresholdPercent}%`;
    case 'float_tier':
      return `Trigger when ${alert.config.tier} float listed below €${alert.config.maxPrice}`;
    case 'case_ev':
      return `Trigger when case price ≥ ${alert.config.evMarginPercent}% below EV`;
    default:
      return '';
  }
}
```

- [ ] **Step 3: Create CreateAlertModal**

Create `frontend/src/app/alerts/CreateAlertModal.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { Alert } from "@/hooks/useAlerts";

interface CreateAlertModalProps {
  onCreate: (data: Partial<Alert>) => Promise<void>;
}

export function CreateAlertModal({ onCreate }: CreateAlertModalProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Alert['type']>('price_threshold');
  const [skinId, setSkinId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [emailChannel, setEmailChannel] = useState(true);
  const [discordChannel, setDiscordChannel] = useState(false);
  // Per-type config
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [price, setPrice] = useState('');
  const [thresholdPercent, setThresholdPercent] = useState('5');
  const [tier, setTier] = useState('FN');
  const [maxPrice, setMaxPrice] = useState('');
  const [evMarginPercent, setEvMarginPercent] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const channels: string[] = [];
      if (emailChannel) channels.push('email');
      if (discordChannel) channels.push('discord');
      if (channels.length === 0) throw new Error('At least one channel required');

      let config: Record<string, any> = {};
      if (type === 'price_threshold') config = { direction, price: parseFloat(price) };
      if (type === 'volatility') config = { thresholdPercent: parseFloat(thresholdPercent), windowHours: 24 };
      if (type === 'float_tier') config = { tier, maxPrice: parseFloat(maxPrice) };
      if (type === 'case_ev') config = { evMarginPercent: parseFloat(evMarginPercent) };

      await onCreate({
        type,
        skinId: type === 'case_ev' ? null : (skinId ? parseInt(skinId) : null),
        caseId: type === 'case_ev' ? (caseId ? parseInt(caseId) : null) : null,
        config,
        channels,
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          New alert
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v: Alert['type']) => setType(v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="price_threshold">Price threshold</SelectItem>
                <SelectItem value="volatility">Volatility spike</SelectItem>
                <SelectItem value="float_tier">Float tier</SelectItem>
                <SelectItem value="case_ev">Case-EV inversion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type !== 'case_ev' && (
            <div>
              <Label>Skin ID</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={skinId} onChange={e => setSkinId(e.target.value)} placeholder="e.g. 42" />
            </div>
          )}
          {type === 'case_ev' && (
            <div>
              <Label>Case ID</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={caseId} onChange={e => setCaseId(e.target.value)} placeholder="e.g. 7" />
            </div>
          )}

          {type === 'price_threshold' && (
            <>
              <div>
                <Label>Direction</Label>
                <Select value={direction} onValueChange={(v: 'above' | 'below') => setDirection(v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (€)</Label>
                <Input className="bg-slate-800 border-slate-700" type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" />
              </div>
            </>
          )}

          {type === 'volatility' && (
            <div>
              <Label>Threshold % (24h)</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={thresholdPercent} onChange={e => setThresholdPercent(e.target.value)} step="0.1" />
            </div>
          )}

          {type === 'float_tier' && (
            <>
              <div>
                <Label>Tier</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="FN">Factory New</SelectItem>
                    <SelectItem value="MW">Minimal Wear</SelectItem>
                    <SelectItem value="FT">Field-Tested</SelectItem>
                    <SelectItem value="WW">Well-Worn</SelectItem>
                    <SelectItem value="BS">Battle-Scarred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max price (€)</Label>
                <Input className="bg-slate-800 border-slate-700" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} step="0.01" />
              </div>
            </>
          )}

          {type === 'case_ev' && (
            <div>
              <Label>EV margin % (case price below EV by at least this much)</Label>
              <Input className="bg-slate-800 border-slate-700" type="number" value={evMarginPercent} onChange={e => setEvMarginPercent(e.target.value)} step="0.1" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Delivery channels</Label>
            <div className="flex items-center gap-2">
              <Checkbox checked={emailChannel} onCheckedChange={(c) => setEmailChannel(!!c)} id="email" />
              <Label htmlFor="email" className="cursor-pointer">Email</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={discordChannel} onCheckedChange={(c) => setDiscordChannel(!!c)} id="discord" />
              <Label htmlFor="discord" className="cursor-pointer">Discord</Label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
            {submitting ? 'Creating...' : 'Create alert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Create alerts page**

Create `frontend/src/app/alerts/page.tsx`:
```tsx
"use client";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertCard } from "./AlertCard";
import { CreateAlertModal } from "./CreateAlertModal";

export default function AlertsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { alerts, isLoading, error, createAlert, updateAlert, deleteAlert } = useAlerts();

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300">Please sign in to manage alerts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-7 w-7 text-purple-400" />
              Alerts
            </h1>
            <p className="text-slate-400 mt-1">Get notified when your conditions trigger.</p>
          </div>
          <CreateAlertModal onCreate={createAlert} />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        )}

        {error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 text-red-400">{error}</CardContent>
          </Card>
        )}

        {!isLoading && !error && alerts.length === 0 && (
          <Card className="bg-slate-900/60 border-slate-700/50">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No alerts yet</p>
              <p className="text-slate-500 text-sm mt-1">Create your first alert to get notified about price changes, volatility, or case-EV inversions.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={(id, isActive) => updateAlert(id, { isActive })}
                onDelete={deleteAlert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: TypeScript check**

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep -E "alerts|useAlerts" | head -10
```

Fix errors in your changed files. Ignore pre-existing.

- [ ] **Step 6: Smoke-test in browser**

Start frontend, navigate to `/alerts`. Should see empty state. Click "New alert", create a price_threshold alert. Should appear in the list.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/alerts/ frontend/src/hooks/useAlerts.ts
git commit -m "feat(alerts): /alerts page with create/list/delete UI"
```

---

## Self-Review

**Spec coverage:**
- ✅ Volatility alerts → Task 4
- ✅ Float-tier alerts → Task 5
- ✅ Case-EV inversions → Task 6
- ✅ Discord delivery → Task 3
- ✅ Email delivery → Task 3 (foundation laid; existing emailService extended)
- ✅ Tier gating (free/lite/pro quotas) → Task 7 alertController
- ⏸ Sticker-combo detection — explicitly Stretch in spec, not in this plan
- ⏸ Telegram bot — Stretch in spec, deferred to Month 3 or later
- ✅ Frontend management UI → Task 8

**Placeholder scan:** No "TBD". One inline `// TODO: when Lite tier is distinct in DB, return 'lite'` in alertController.js — that's a real future-flag, acceptable since the migration to a tier column is out of scope. Acceptable.

**Type consistency:**
- `Alert.type` enum used identically in backend (`alertController.js`), evaluators, and frontend (`useAlerts.ts`, `AlertCard.tsx`).
- `runAllAlerts()` returns `[{alert, result, delivery}]` — consumer is the cron job which only uses count, no field access mismatch.
- `evaluator.evaluate(alert)` always returns `{triggered, payload}` — used uniformly across all 4 evaluators.

**Scope:** 8 tasks. Solo-dev estimates: T1 (0.5d), T2 (1d), T3 (2d email + Discord webhook), T4 (1d), T5 (0.5d), T6 (1d), T7 (1.5d API + cron), T8 (3d UI) = ~10.5 working days. Fits 4-week solo schedule with margin for bugs and polish.
