# Launch Posts — Drafts

Use these as starting points. Adjust per channel. Founder-tone, not corporate. Honest about beta status.

---

## Reddit — r/csgomarketforum (POST FIRST — friendlier audience)

**Title:**
```
[Show] I built a free portfolio tracker for CS2 skins — Robinhood-style P&L, alerts coming soon
```

**Body:**
```
Hey traders,

I'm a solo dev who got tired of guessing whether my skin "investments" were actually making money. So I built **skintrackr.com** — a portfolio tracker focused on real numbers (cost basis, unrealized P&L, allocation) instead of just current prices.

**What it does today:**
- Track your full portfolio with cost basis (so you see actual profit, not just current value)
- Live prices from multiple marketplaces
- Watchlist with price alerts
- KPIs on a clean dashboard

**Coming next month:**
- Smart alerts (volatility spikes, float-tier breakouts, case EV inversions) via Discord/email
- More analytics (Sharpe, drawdown)

**Coming Month 3:**
- Tax-ready CSV export (FIFO/LIFO)
- Multi-portfolio support

**Pricing:**
- Free forever for up to 5 skins + 1 alert
- Lite €4.99/mo: unlimited watchlist, 5 alerts, 90d history
- Pro €19.99/mo: full analytics + Pro tools

Try it: https://skintrackr.com

Looking for honest feedback — what's missing, what's confusing, what would make you actually use this. Roast me.

[Demo GIF]
```

---

## Reddit — r/GlobalOffensive

**Title:**
```
I built a CS2 skin portfolio tracker — investor-grade P&L for your inventory [Free + Premium]
```

**Body (shorter, more casual):**
```
After getting roasted by my own skin "investments" for years, I built skintrackr.com — a tracker that tells you whether you're actually making money on your skins.

Free for casual collectors (up to 5 skins). Premium tiers (€4.99 / €19.99) for serious traders with bigger portfolios.

Key features today:
- Real cost basis + unrealized P&L
- Live prices from multiple markets
- Clean dashboard, dark mode

Coming soon: smart alerts (Discord + email), tax exports, more analytics.

Solo dev, beta status, free to try: https://skintrackr.com

Feedback welcome.

[Demo GIF]
```

---

## Hacker News — Show HN

**Title:**
```
Show HN: skintrackr.com – Robinhood-style portfolio tracker for CS2 skins
```

**Body:**
```
Hey HN,

I built skintrackr.com — a portfolio tracker for CS2 (Counter-Strike) skin investors. The CS2 skin market is ~$5B/year but every existing tracker is either cluttered (Pricempire) or barely functional (random forums). I wanted something investor-grade with real cost-basis P&L, allocation analytics, and tax export.

Stack:
- Next.js 15 + React 19 + Tailwind on the frontend
- Express 5 + Node 22 ESM + Prisma 6 + Postgres on the backend
- Clerk for auth, Stripe for subscriptions
- Vercel for hosting

What I learned solo:
- Stripe checkout has hidden gotchas with deprecated `redirectToCheckout` (use direct URL redirect)
- Clerk metadata vs DB single-source-of-truth needs to be explicit early
- Subagent-driven development (per-task isolated agents with code review) is wildly more productive than monolithic chat sessions

Status: beta, ~6 weeks of evening work. Pricing: free, €4.99, €19.99.

Roast it. Particularly looking for feedback on:
- The pricing tiers (am I priced too low?)
- Smart alerts feature design (volatility, float-tier, case-EV — which would you actually want?)
- Things that look "indie-quality" and need polish

https://skintrackr.com
```

---

## Twitter/X Thread (7 tweets)

**Tweet 1:**
```
After 3 years of guessing whether my CS2 skin "investments" were profitable, I built skintrackr.com — a Robinhood-style portfolio tracker.

Real cost basis. Real P&L. No more guessing.

Free for casuals, €4.99 for traders, €19.99 for pros.

[Demo GIF]
```

**Tweet 2:**
```
The problem: every existing CS2 tracker is either:
- Cluttered (Pricempire)
- Free + simple (SkinFolio)
- Content-driven (SteamAnalyst)

Nobody serves the serious investor with a clean dark-mode P&L view.

So I built one.
```

**Tweet 3:**
```
What it does today:
✓ Live prices from multiple markets
✓ Cost-basis P&L (not just current value)
✓ Portfolio allocation
✓ Watchlist + price alerts

Free: 5 skins, 1 alert.
Lite (€4.99): unlimited watchlist, 5 alerts, 90d history.
Pro (€19.99): full analytics.
```

**Tweet 4:**
```
Coming Month 2: SMART ALERTS.

Not just "skin X = $50". Things like:
- Volatility spike (>5% in 24h)
- Float-tier breakouts (rare FN listed cheap)
- Case EV inversions (case price < expected drop value)

Via Discord, email, or Telegram.

This is the killer feature.
```

**Tweet 5:**
```
Coming Month 3: TAX-READY EXPORTS.

FIFO/LIFO cost basis. CSV export. Capital-gains formatting.

If you've ever tried to do tax filings on your skin profits, you know what pain this solves.
```

**Tweet 6:**
```
Tech stack for the curious:
- Next.js 15 + React 19 frontend
- Express 5 + Node 22 ESM backend
- Postgres + Prisma 6
- Clerk auth, Stripe subs
- Vercel hosting

~6 weeks of evening work, solo dev.
```

**Tweet 7:**
```
Try it (beta, free): https://skintrackr.com

Brutal feedback welcome. Looking for:
- Bugs
- Pricing thoughts
- Feature priorities
- "Would you actually pay for this?"

Reply with your inventory size + I'll roast your portfolio with real metrics 👇
```

---

## Notes

- Don't post all at once — space by 30-60 min between Reddit / HN / Twitter
- Reply to every comment within 2 hours during launch day
- Don't argue with negative feedback — say "good point, will look into it" + actually do it
- Track click-through and signups per channel via UTM params or referrer
- Monday/Tuesday 9 AM EST = peak Reddit traffic
