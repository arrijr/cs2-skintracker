# CS2 Skin Tracker - Live Test Guide

**Date**: May 8, 2026  
**Status**: Sprint 2 Complete - Ready for Integration Testing

---

## Quick Start (Windows)

### 1. Setup Environment

Run the PowerShell setup script:

```powershell
cd C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker
powershell -ExecutionPolicy Bypass -File scripts/test-setup.ps1
```

This will:
- Verify all configuration files
- Check Node.js installation
- Generate Prisma client
- Test Supabase database connection

### 2. Start Development Servers

Open TWO terminal windows:

**Terminal 1 - Backend (Port 5000):**
```bash
cd C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker\backend
npm run dev
```

Expected output:
```
[nodemon] 1.19.4
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): src/**/*
[nodemon] watching extensions: js
Server running on port 5000
```

**Terminal 2 - Frontend (Port 3000):**
```bash
cd C:\Users\Arthur\Documents\Coding\CS2-Skin-Tracker\frontend
npm run dev
```

Expected output:
```
  ▲ Next.js 15.4.3
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.5s
```

---

## Testing Workflow

### Phase 1: Authentication & Navigation

1. Go to http://localhost:3000
2. Click "Sign In" or "Sign Up"
3. Use Clerk authentication (Google, GitHub, or email)
4. Verify redirect to dashboard

**Expected**: Dashboard loads with empty portfolio (first time)

### Phase 2: Portfolio Management

1. Click "Add Skin to Portfolio"
2. Search for a skin (e.g., "AK-47 | Phantom Disruptor")
3. Enter quantity: 5
4. Enter buy price: $42.50
5. Click "Confirm"

**Expected**: Skin appears in portfolio with correct total value

### Phase 3: Dashboard Analytics

1. Check portfolio summary card shows:
   - Total invested
   - Current value
   - Unrealized P&L
   - Portfolio allocation chart

**Expected**: Values update correctly based on current skin prices

### Phase 4: Stripe Upgrade (Pro Tier)

1. Click "Upgrade to Pro" button
2. Enter test card: `4242 4242 4242 4242`
3. Expiry: `12/25`
4. CVC: `123`
5. Complete payment

**Expected**: 
- Subscription status changes to "active"
- Pro research features unlock
- Webhook processed successfully (check backend logs)

### Phase 5: Pro Features

1. Go to "Research" tab (now visible for Pro users)
2. Select a skin from portfolio
3. View volatility analysis
4. View rarity score

**Expected**: Pro-tier endpoints return data correctly

### Phase 6: Price History

1. Click on any skin in portfolio
2. View price history chart (30-day moving average)
3. Verify chart renders with Chart.js

**Expected**: Chart shows realistic price movements

---

## Environment Configuration

### Backend (.env)

Required variables (already set in `/backend/.env`):

```
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
CLERK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env.local)

Will use defaults from `package.json` proxy:

```
NEXT_PUBLIC_API_ORIGIN=http://localhost:5000
```

---

## API Endpoints to Test

### Free Tier

- `GET /api/v1/portfolio/summary` - Portfolio dashboard
- `GET /api/v1/research/volatility/:id` - Volatility (public)
- `GET /api/v1/research/rarity/:id` - Rarity score (public)

### Pro Tier (after upgrade)

- `GET /api/v1/research/portfolio` - Full portfolio analysis
- `GET /api/v1/research/skins/:id` - Detailed skin research

### Subscription Management

- `POST /api/v1/subscriptions/checkout` - Create checkout session
- `GET /api/v1/subscriptions/status` - Get current subscription
- `POST /api/v1/subscriptions/cancel` - Cancel subscription
- `POST /api/v1/subscriptions/webhook` - Stripe webhook (auto)

---

## Test Data

The database comes with:

- **10 CS2 skins** with realistic prices
- **30-day price history** for volatility calculation
- **2 test users** (optional seeding)
- **0 portfolios** (created during testing)

Sample skins:
- AK-47 | Phantom Disruptor ($42.50)
- M4A4 | Howl ($185.00)
- AWP | Dragon Lore ($2,850.00)
- M9 Bayonet | Crimson Web ($1,250.00)

---

## Debugging

### Backend Logs

Check for:
- Prisma connection errors
- Clerk token validation
- Stripe webhook signatures
- CORS issues

```bash
# Backend runs on: http://localhost:5000
# API logs printed to console
```

### Frontend Logs

Check browser console (F12) for:
- API request errors
- Clerk authentication issues
- React component errors
- Chart.js rendering

### Database

Query directly with Supabase dashboard:

```sql
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Skin";
SELECT COUNT(*) FROM "PriceHistory";
SELECT COUNT(*) FROM "Portfolio";
```

---

## Common Issues & Solutions

### Issue: "Prisma Client could not locate Query Engine"
**Solution**: Run `npx prisma generate` in backend directory

### Issue: "CORS error" in frontend
**Solution**: Check `ALLOWED_ORIGINS` in backend .env matches frontend URL

### Issue: "Clerk authentication failing"
**Solution**: Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in frontend

### Issue: "Stripe webhook not processing"
**Solution**: Check webhook secret in Vercel/production environment

### Issue: Database connection timeout
**Solution**: Verify Supabase IP whitelist allows your machine

---

## Success Criteria

Phase 1: ✓ Authentication works  
Phase 2: ✓ Portfolio CRUD operations work  
Phase 3: ✓ Dashboard shows correct calculations  
Phase 4: ✓ Stripe payment flow completes  
Phase 5: ✓ Pro features unlock after payment  
Phase 6: ✓ Charts render correctly  

---

## Next Steps After Testing

1. **Load Testing**: Test with 100+ concurrent users
2. **Performance**: Monitor API response times (<100ms target)
3. **Security Review**: Penetration test, OWASP compliance
4. **Production Deployment**: Merge to main, deploy to Vercel
5. **Monitoring Setup**: Enable Sentry, datadog, or equivalent

---

## Support

For issues during testing:
1. Check backend console for errors
2. Check browser console (F12)
3. Review this guide's "Common Issues" section
4. Check Supabase dashboard for database health
5. Verify all environment variables are set

---

**Last Updated**: May 8, 2026  
**Project**: CS2 Skin Tracker - Real-time Pricing API  
**Team**: Arthur + Claude
