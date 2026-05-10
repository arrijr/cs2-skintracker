import prisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';

const evaluators = new Map();

export function registerEvaluator(type, evaluator) {
  evaluators.set(type, evaluator);
}

// Inline price_threshold evaluator (will be extracted to its own file later if needed)
registerEvaluator('price_threshold', {
  async evaluate(alert) {
    const currentPrice = alert.skin?.priceLatest;
    if (currentPrice == null) {
      return { triggered: false, payload: { reason: 'no current price' } };
    }
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
