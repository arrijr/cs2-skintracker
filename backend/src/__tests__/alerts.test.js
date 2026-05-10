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
