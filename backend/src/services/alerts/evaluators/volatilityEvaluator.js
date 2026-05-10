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
    const { thresholdPercent, windowHours = 24 } = alert.config || {};
    if (typeof thresholdPercent !== 'number' || thresholdPercent <= 0) {
      return { triggered: false, payload: { reason: 'invalid thresholdPercent' } };
    }
    const skinId = alert.skinId ?? alert.skin?.id;
    const currentPrice = alert.skin?.priceLatest;
    if (skinId == null || currentPrice == null) {
      return { triggered: false, payload: { reason: 'missing skin or current price' } };
    }
    const past = await priceHistoryFetcher({ skinId, hoursAgo: windowHours });
    if (!past || !past.price || past.price <= 0) {
      return { triggered: false, payload: { reason: 'no usable historical price found' } };
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
