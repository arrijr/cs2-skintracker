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

export default checkPriceAlerts;
