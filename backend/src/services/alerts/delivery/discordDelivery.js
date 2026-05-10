import logger from '../../../utils/logger.js';

const COLORS = {
  price_threshold: 0xa855f7,
  volatility: 0xf59e0b,
  float_tier: 0x10b981,
  case_ev: 0xec4899,
};

const VALID_DISCORD_WEBHOOK = /^https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

function isValidDiscordWebhook(url) {
  if (typeof url !== 'string' || url.length > 200) return false;
  return VALID_DISCORD_WEBHOOK.test(url);
}

export { isValidDiscordWebhook };

export async function deliverDiscord({ alert, result, webhookUrl }) {
  if (!webhookUrl) {
    return { ok: false, error: 'no webhook URL configured' };
  }
  if (!isValidDiscordWebhook(webhookUrl)) {
    return { ok: false, error: 'invalid Discord webhook URL' };
  }
  const embed = {
    title: buildTitle(alert),
    description: buildDescription(alert),
    color: COLORS[alert.type] || 0x64748b,
    fields: Object.entries(result.payload).slice(0, 25).map(([name, value]) => ({
      name: String(name).slice(0, 256),
      value: String(value).slice(0, 1000),
      inline: true,
    })),
    timestamp: new Date().toISOString(),
    footer: { text: 'skintrackr.com' },
  };

  const MAX_ATTEMPTS = 3;
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        return { ok: true };
      }

      const status = res.status;
      const body = await res.text().catch(() => '');

      // Permanent failures — do not retry
      if (status === 404 || status === 401 || status === 403) {
        return { ok: false, error: `Discord ${status} (permanent): ${body.slice(0, 200)}` };
      }

      // Rate-limited — honor Retry-After when possible
      if (status === 429) {
        const retryAfter = parseFloat(res.headers.get('retry-after') || '1');
        lastError = `Discord 429 (rate limit, retry-after ${retryAfter}s)`;
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
          continue;
        }
      }

      // 5xx — retry with backoff
      if (status >= 500 && status < 600) {
        lastError = `Discord ${status}: ${body.slice(0, 200)}`;
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
      }

      // Other 4xx — permanent
      return { ok: false, error: `Discord ${status}: ${body.slice(0, 200)}` };

    } catch (err) {
      // Network / timeout — retry
      lastError = err.message;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
    }
  }
  logger.error('Discord delivery failed after retries', { alertId: alert.id, lastError });
  return { ok: false, error: lastError || 'unknown delivery error' };
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
