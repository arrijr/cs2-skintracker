import { sendAlertEmail } from '../../emailService.js';
import logger from '../../../utils/logger.js';

export async function deliverEmail({ alert, result }) {
  const user = alert.user;
  if (!user?.email) {
    return { ok: false, error: 'no email on user record' };
  }
  if (user.emailAlerts === false) {
    return { ok: true, skipped: true, reason: 'user opted out of email alerts' };
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
  const raw = (() => {
    const skin = alert.skin?.name || 'your portfolio';
    switch (alert.type) {
      case 'price_threshold':
        return `${skin} hit €${result.payload.currentPrice}`;
      case 'volatility':
        return `${skin} volatility spike (${result.payload.changePercent}%)`;
      case 'float_tier':
        return `Rare float listed: ${skin}`;
      case 'case_ev':
        return `Case-EV inversion: ${alert.case?.name || skin}`;
      default:
        return `Alert: ${alert.type}`;
    }
  })();
  // Strip CRLF to prevent header injection, trim length
  return raw.replace(/[\r\n]+/g, ' ').slice(0, 200);
}
