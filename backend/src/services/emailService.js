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
