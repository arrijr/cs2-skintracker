import logger from '../../../utils/logger.js';

const COLORS = {
  price_threshold: 0xa855f7,
  volatility: 0xf59e0b,
  float_tier: 0x10b981,
  case_ev: 0xec4899,
};

export async function deliverDiscord({ alert, result, webhookUrl }) {
  if (!webhookUrl) {
    return { ok: false, error: 'no webhook URL configured' };
  }
  const embed = {
    title: buildTitle(alert),
    description: buildDescription(alert),
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

function buildTitle(alert) {
  return `⚡ ${alert.type.replace('_', ' ').toUpperCase()}: ${alert.skin?.name || alert.case?.name || 'Portfolio'}`;
}

function buildDescription(alert) {
  const lines = [];
  if (alert.skin) lines.push(`**Skin:** ${alert.skin.name}`);
  if (alert.case) lines.push(`**Case:** ${alert.case.name}`);
  return lines.join('\n');
}
