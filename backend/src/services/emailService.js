import nodemailer from "nodemailer";

// Configure transport (e.g. Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // from .env
    pass: process.env.EMAIL_PASS
  }
});

// Function to send price alert email
export async function sendPriceAlertEmail(to, skinName, price, priceAlert, steamUrl = "") {
  const info = await transporter.sendMail({
    from: `"CS2 Skin Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔔 Price Alert for ${skinName}!`,
    text: `The price for "${skinName}" is now at €${price} (your alert: €${priceAlert}). Check it now in the app!`,
    html: `<p>The price for <b>${skinName}</b> is now <b>€${price}</b> (your alert: <b>€${priceAlert}</b>).</p>
           <p><a href="${steamUrl || 'https://steamcommunity.com/market/'}">View on Steam Market</a></p>`
  });
  console.log("Mail sent: %s", info.messageId);
}

export async function sendAlertEmail({ to, subject, alertType, skinName, payload }) {
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #fff;">
      <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 16px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">⚡ skintrackr.com Alert</h1>
      </div>
      <div style="background: #1e293b; padding: 24px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #fff; margin-top: 0;">${escapeHtml(subject)}</h2>
        <p style="color: #cbd5e1;"><strong>Type:</strong> ${escapeHtml(alertType)}</p>
        ${skinName ? `<p style="color: #cbd5e1;"><strong>Skin:</strong> ${escapeHtml(skinName)}</p>` : ''}
        <pre style="background: #0f172a; padding: 16px; border-radius: 6px; color: #a78bfa; overflow-x: auto;">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
        <a href="https://skintrackr.com/alerts" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 6px;">Manage alerts</a>
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 16px; text-align: center;">
        skintrackr.com
      </p>
    </div>
  `;
  return transporter.sendMail({
    from: `"skintrackr.com" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[skintrackr] ${subject}`,
    html,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
