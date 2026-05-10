import { describe, it, expect } from '@jest/globals';
import { evaluateAlert } from '../services/alerts/alertEngine.js';

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

  it('triggers on negative change (price drop) exceeding threshold', async () => {
    const alert = {
      id: 1,
      type: 'volatility',
      config: { thresholdPercent: 5, windowHours: 24 },
      skin: { id: 100, priceLatest: 90 },
    };
    const result = await volatilityEvaluator.evaluate(alert, {
      priceHistoryFetcher: async () => ({ price: 100 }),
    });
    expect(result.triggered).toBe(true);
    expect(result.payload.changePercent).toBeCloseTo(-10, 1);
  });

  it('returns triggered:false with reason when no historical price', async () => {
    const alert = {
      id: 1,
      type: 'volatility',
      config: { thresholdPercent: 5, windowHours: 24 },
      skin: { id: 100, priceLatest: 100 },
    };
    const result = await volatilityEvaluator.evaluate(alert, {
      priceHistoryFetcher: async () => null,
    });
    expect(result.triggered).toBe(false);
    expect(result.payload.reason).toMatch(/historical/i);
  });
});

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
    expect(result.payload.tier).toBe('FN');
    expect(result.payload.currentPrice).toBe(180);
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

  it('returns triggered:false with reason when invalid tier', async () => {
    const result = await floatTierEvaluator.evaluate({
      id: 1,
      type: 'float_tier',
      config: { tier: 'XX', maxPrice: 200 },
      skin: { wear: 'Factory New', priceLatest: 100 },
    });
    expect(result.triggered).toBe(false);
    expect(result.payload.reason).toMatch(/tier/i);
  });

  it('returns triggered:false with reason when skin has no wear', async () => {
    const result = await floatTierEvaluator.evaluate({
      id: 1,
      type: 'float_tier',
      config: { tier: 'FN', maxPrice: 200 },
      skin: { wear: null, priceLatest: 100 },
    });
    expect(result.triggered).toBe(false);
  });
});

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
        price: 80,
        skins: [
          { dropChance: 0.5, skin: { priceLatest: 100 } },
          { dropChance: 0.5, skin: { priceLatest: 100 } },
        ],
      },
    };
    const result = await caseEvEvaluator.evaluate(alert, {
      caseDataFetcher: async () => alert.case,
    });
    expect(result.triggered).toBe(true);
    expect(result.payload.evMargin).toBeCloseTo(20, 1);
  });

  it('does not trigger when below required margin', async () => {
    const alert = {
      id: 1,
      type: 'case_ev',
      config: { evMarginPercent: 30 },
      case: {
        id: 1,
        price: 90,
        skins: [{ dropChance: 1.0, skin: { priceLatest: 100 } }],
      },
    };
    const result = await caseEvEvaluator.evaluate(alert, {
      caseDataFetcher: async () => alert.case,
    });
    expect(result.triggered).toBe(false);
  });

  it('returns triggered:false when EV is zero', async () => {
    const alert = {
      id: 1,
      type: 'case_ev',
      config: { evMarginPercent: 10 },
      case: {
        id: 1,
        price: 50,
        skins: [{ dropChance: 0, skin: { priceLatest: 100 } }],
      },
    };
    const result = await caseEvEvaluator.evaluate(alert, {
      caseDataFetcher: async () => alert.case,
    });
    expect(result.triggered).toBe(false);
    expect(result.payload.reason).toMatch(/EV/);
  });

  it('returns triggered:false when no caseId on alert', async () => {
    const result = await caseEvEvaluator.evaluate({
      id: 1,
      type: 'case_ev',
      config: { evMarginPercent: 10 },
    });
    expect(result.triggered).toBe(false);
    expect(result.payload.reason).toMatch(/caseId/i);
  });
});
