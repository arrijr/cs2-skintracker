import prisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import { deliverEmail } from './delivery/emailDelivery.js';
import { volatilityEvaluator } from './evaluators/volatilityEvaluator.js';
import { floatTierEvaluator } from './evaluators/floatTierEvaluator.js';
import { caseEvEvaluator } from './evaluators/caseEvEvaluator.js';

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
registerEvaluator('float_tier', floatTierEvaluator);
registerEvaluator('case_ev', caseEvEvaluator);

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
    } else if (channel === 'in_app') {
      // In-app notifications are surfaced via the AlertEvent row written
      // below (the frontend polls /alerts/:id/events). No separate transport
      // needed — the row IS the notification.
      res = { ok: true };
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

// Edge-trigger predicate: fire only when the alert was NOT in the triggered
// state on the previous run. `null` (never evaluated) counts as not-triggered,
// so the first match still fires.
export function shouldFire(lastConditionState, isTriggered) {
  return isTriggered === true && lastConditionState !== true;
}

export async function runAllAlerts() {
  const alerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: { skin: true, case: true, user: true },
  });
  const results = [];
  for (const alert of alerts) {
    // Cooldown check — still applies as a floor on top of edge-trigger
    // so rapid oscillation around the threshold can't spam.
    if (alert.lastTriggeredAt) {
      const ageMs = Date.now() - alert.lastTriggeredAt.getTime();
      if (ageMs < alert.cooldownMinutes * 60 * 1000) continue;
    }

    const result = await evaluateAlert(alert);
    if (!result) continue;

    const isTriggered = result.triggered === true;

    // Edge-trigger: only fire on false→true transition. A price parked above
    // the threshold won't keep emailing the user every cooldown window.
    if (shouldFire(alert.lastConditionState, isTriggered)) {
      const delivery = await deliverAlert({ alert, result });
      results.push({ alert, result, delivery });
    }

    // Persist current state for the next run so the transition check works.
    // Skip if unchanged to keep the write volume low.
    if (alert.lastConditionState !== isTriggered) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastConditionState: isTriggered },
      });
    }
  }
  return results;
}
