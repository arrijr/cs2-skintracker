# Pre-Launch Checklist

Run through this 24h before launch. Check every box. Fix anything that fails before posting.

---

## Production Verification

- [ ] `https://skintrackr.com` loads with valid SSL
- [ ] Landing page hero copy matches "Robinhood for CS2" pitch
- [ ] All 6 features render correctly
- [ ] Pricing page shows Free / Lite (€4.99) / Pro (€19.99)
- [ ] Footer links work
- [ ] No console errors on landing page (Chrome DevTools)
- [ ] No 404s in Network tab on first page load

## Auth Flow

- [ ] Sign-up via Clerk works end-to-end (real email, click verification)
- [ ] Sign-in works
- [ ] Sign-out works
- [ ] Logged-in user lands on `/dashboard` after sign-in
- [ ] Anonymous user redirected from `/dashboard` to `/sign-in`

## Core Features

- [ ] Add skin to portfolio works
- [ ] Portfolio KPIs render with real numbers
- [ ] Watchlist add/remove works
- [ ] Skin detail pages load
- [ ] Search/filter works on `/skins`

## Stripe Checkout

- [ ] Click "Choose Lite" → redirects to Stripe checkout
- [ ] Click "Choose Pro" → redirects to Stripe checkout
- [ ] Test mode card `4242 4242 4242 4242` completes
- [ ] After payment, user redirected back to dashboard
- [ ] Subscription status updates (User.isPremium → true via webhook)

## Mobile

- [ ] Open `https://skintrackr.com` on a real phone (not just DevTools)
- [ ] Hero readable
- [ ] CTA buttons reachable with thumb
- [ ] Pricing cards stack correctly
- [ ] Dashboard works (or shows "use desktop" if not optimized yet)

## Email & Support

- [ ] `hello@skintrackr.com` (or chosen alias) inbox monitored
- [ ] Forwarding to personal email set up
- [ ] Reply within 2 hours during launch day
- [ ] Have a "support page" or at least a contact email visible in footer

## Content

- [ ] Demo video uploaded to YouTube (unlisted)
- [ ] Demo GIF created for Reddit
- [ ] All 4 post drafts (r/csgomarketforum, r/GlobalOffensive, HN, Twitter) finalized
- [ ] Discord servers identified, joined, and observed for at least 24h

## Analytics

- [ ] Sign-up event tracked (or at least DB count visible)
- [ ] Stripe checkout success rate trackable
- [ ] Vercel analytics enabled
- [ ] (Optional) Plausible / Umami / GoatCounter installed for landing page

## Backup

- [ ] DB has a recent backup (Vercel Postgres or external)
- [ ] All env vars documented in `docs/08-Environments.md`
- [ ] Stripe webhook secret stored securely

## Legal

- [ ] Privacy policy page linked in footer (even if minimal)
- [ ] Terms of service page linked in footer
- [ ] Imprint (Impressum) for German users — required by law
- [ ] Cookie consent banner (if using analytics)

---

## Launch Day Checklist

**T-1 hour:**
- [ ] All servers green (Vercel dashboard)
- [ ] Test sign-up + checkout one more time
- [ ] Phone handy for monitoring

**T-0:**
- [ ] Post r/csgomarketforum (smaller, friendlier, monitor for issues)

**T+30min:**
- [ ] Post r/GlobalOffensive

**T+60min:**
- [ ] Post Hacker News Show HN

**T+90min:**
- [ ] Twitter thread

**T+120min onwards:**
- [ ] Discord posts (one per hour, max 3 servers in first 4 hours)

**Throughout the day:**
- [ ] Reply to every comment within 2 hours
- [ ] Note feedback in `docs/launch/results.md`
- [ ] Fix critical bugs same-day, queue minor ones

## Post-Launch (24h)

- [ ] Sign-up count
- [ ] Free → Paid conversion count
- [ ] Reddit/HN comments + sentiment
- [ ] Top 3 feature requests
- [ ] Bugs reported
- [ ] Decide next priority based on feedback
