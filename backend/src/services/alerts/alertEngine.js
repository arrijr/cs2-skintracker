import prisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import { deliverEmail } from './delivery/emailDelivery.js';
import { deliverDiscord } from './delivery/discordDelivery.js';
import { volatilityEvaluator } from './evaluators/volatilityEvaluator.js';

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

registerEvaluator('volatility', volatilityEvaluator);

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

export async function deliverAlert({ alert, result }) {
  const delivered = [];
  const failed = [];
  const channelErrors = {};

  for (const channel of alert.channels) {
    let res;
    if (channel === 'email') {
      res = await deliverEmail({ alert, result });
    } else if (channel === 'discord') {
      res = await deliverDiscord({ alert, result, webhookUrl: alert.user?.discordWebhook });
    } else {
      res = { ok: false, error: `unknown channel ${channel}` };
    }
    if (res.skipped) {
      // user opt-out — log but don't count as delivered or failed
      logger.info('Channel skipped (user preference)', { alertId: alert.id, channel, reason: res.reason });
      continue;
    }
    if (res.ok) {
      delivered.push(channel);
    } else {
      failed.push(channel);
      channelErrors[channel] = res.error;
    }
  }

  await prisma.alertEvent.create({
    data: {
      alertId: alert.id,
      payload: result.payload,
      delivered,
      failed,
      errorLog: Object.keys(channelErrors).length
        ? Object.entries(channelErrors).map(([c, e]) => `${c}: ${e}`).join('; ')
        : null,
    },
  });
  await prisma.alert.update({
    where: { id: alert.id },
    data: { lastTriggeredAt: new Date() },
  });

  return { delivered, failed };
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
      const delivery = await deliverAlert({ alert, result });
      results.push({ alert, result, delivery });
    }
  }
  return results;
}
