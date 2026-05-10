const TIER_TO_WEAR = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
};

export const floatTierEvaluator = {
  async evaluate(alert) {
    const { tier, maxPrice } = alert.config || {};
    const expectedWear = TIER_TO_WEAR[tier];
    if (!expectedWear) {
      return { triggered: false, payload: { reason: `invalid tier: ${tier}` } };
    }
    if (typeof maxPrice !== 'number' || maxPrice <= 0) {
      return { triggered: false, payload: { reason: 'invalid maxPrice' } };
    }
    const skin = alert.skin;
    if (!skin) {
      return { triggered: false, payload: { reason: 'missing skin' } };
    }
    if (!skin.wear) {
      return { triggered: false, payload: { reason: 'skin has no wear' } };
    }
    const wearMatches = skin.wear === expectedWear;
    const priceUnderMax = skin.priceLatest != null && skin.priceLatest <= maxPrice;
    return {
      triggered: wearMatches && priceUnderMax,
      payload: {
        tier,
        expectedWear,
        actualWear: skin.wear,
        currentPrice: skin.priceLatest,
        maxPrice,
        wearMatches,
        priceUnderMax,
      },
    };
  },
};
