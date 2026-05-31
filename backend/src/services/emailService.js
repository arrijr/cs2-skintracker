import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Lazy-init: do NOT call `nodemailer.createTransport` at module load, because
// SMTP auth would silently 5xx every send if env vars were missing. We build
// the transport on first use and throw a loud, specific error so the upstream
// delivery layer can record it on the AlertEvent row (instead of a generic
// "Invalid login: 535-5.7.8" failure that doesn't say "wrong env var").
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error(
      'Email transport not configured — set EMAIL_USER + EMAIL_PASS. For a custom ' +
        'SMTP provider (e.g. All-Inkl / kasserver) also set EMAIL_HOST + EMAIL_PORT; ' +
        'without EMAIL_HOST it defaults to Gmail. In CI/tests, mock sendAlertEmail.'
    );
  }
  // Generic SMTP when EMAIL_HOST is set (All-Inkl: host like wXXXXXXX.kasserver.com,
  // port 587 STARTTLS or 465 SSL). Falls back to Gmail service if no host given.
  const host = process.env.EMAIL_HOST;
  if (host) {
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);
    _transporter = nodemailer.createTransport({
      host,
      port,
      // 465 ⇒ implicit TLS; 587 ⇒ STARTTLS. Allow explicit override via EMAIL_SECURE.
      secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465,
      auth: { user, pass },
    });
  } else {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return _transporter;
}

// Keys whose value is a Euro-denominated price across all evaluator payloads.
// price_threshold: currentPrice, threshold. volatility: currentPrice, pastPrice.
// float_tier: currentPrice, maxPrice. case_ev: casePrice, expectedValue.
const PRICE_KEYS = new Set([
  'currentPrice', 'pastPrice', 'maxPrice', 'casePrice', 'expectedValue', 'threshold',
]);
// Keys whose value is a percentage.
const PERCENT_KEYS = new Set([
  'changePercent', 'thresholdPercent', 'evMargin', 'marginThreshold',
]);

// Render the structured evaluator payload as a small key:value list instead of
// dumping `JSON.stringify` into the body (which leaked internal field names
// like `wearMatches: true` straight to the user).
export function renderPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const rows = Object.entries(payload)
    .filter(([k]) => k !== 'reason') // internal-only short-circuit reasons
    .map(([k, v]) => {
      const label = k
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase());
      let value;
      if (typeof v === 'number' && PRICE_KEYS.has(k)) {
        value = `€${Number(v).toFixed(2)}`;
      } else if (typeof v === 'number' && PERCENT_KEYS.has(k)) {
        value = `${Number(v).toFixed(2)}%`;
      } else if (typeof v === 'number') {
        value = Number.isInteger(v) ? String(v) : Number(v).toFixed(2);
      } else {
        value = String(v);
      }
      return { label, value };
    });
  return rows;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export async function sendAlertEmail({ to, subject, alertType, skinName, payload }) {
  const rows = renderPayload(payload);
  const rowsHtml = Array.isArray(rows)
    ? rows
        .map(
          ({ label, value }) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#94a3b8;">${escapeHtml(label)}</td><td style="padding:4px 0;color:#fff;font-weight:600;">${escapeHtml(value)}</td></tr>`
        )
        .join('')
    : '';
  const rowsText = Array.isArray(rows)
    ? rows.map(({ label, value }) => `  ${label}: ${value}`).join('\n')
    : '';

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #fff;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 16px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⚡ skintrackr.io Alert</h1>
      </div>
      <div style="background: #1e293b; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #fff; margin-top: 0;">${escapeHtml(subject)}</h2>
        <p style="color: #cbd5e1;"><strong>Type:</strong> ${escapeHtml(alertType)}</p>
        ${skinName ? `<p style="color: #cbd5e1;"><strong>Item:</strong> ${escapeHtml(skinName)}</p>` : ''}
        ${rowsHtml ? `<table style="margin-top:12px;border-collapse:collapse;width:100%;">${rowsHtml}</table>` : ''}
        <a href="https://skintrackr.io/alerts" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 6px;">Manage alerts</a>
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 16px; text-align: center;">
        skintrackr.io · <a href="https://skintrackr.io/account" style="color: #94a3b8;">manage preferences</a>
      </p>
    </div>
  `;

  const text =
    `${subject}\n\n` +
    `Type: ${alertType}\n` +
    (skinName ? `Item: ${skinName}\n` : '') +
    (rowsText ? `\n${rowsText}\n` : '') +
    `\nManage alerts: https://skintrackr.io/alerts\n`;

  try {
    return await getTransporter().sendMail({
      // EMAIL_FROM override lets you set a friendly From (e.g. a verified alias).
      // Default = the authenticated mailbox — most SMTP providers (All-Inkl
      // included) reject a From that isn't the auth user or an alias of it.
      from: process.env.EMAIL_FROM || `"SkinTrackr" <${process.env.EMAIL_USER}>`,
      to,
      subject: `[skintrackr] ${subject}`,
      html,
      text,
      headers: {
        'List-Unsubscribe': '<mailto:unsubscribe@skintrackr.io>, <https://skintrackr.io/account>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  } catch (err) {
    // Surface the cause clearly so the delivery layer's AlertEvent.errorLog
    // contains an actionable message instead of nodemailer's raw stack.
    logger.warn('sendAlertEmail failed', { to, alertType, reason: err.message });
    throw err;
  }
}
