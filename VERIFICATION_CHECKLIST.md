# Live Test Verification Checklist

**Project**: CS2 Skin Tracker Sprint 2  
**Date**: May 8, 2026  
**Tester**: Arthur  

---

## Pre-Test Verification

- [ ] Backend .env configured (DATABASE_URL, CLERK_SECRET_KEY, STRIPE_SECRET_KEY)
- [ ] Frontend .env.local exists (or defaults to localhost:5000)
- [ ] Node.js v20+ installed
- [ ] npm packages installed in both backend and frontend
- [ ] Supabase database is accessible
- [ ] Stripe test keys are active
- [ ] Clerk configuration is correct

---

## Backend Tests

### Server Startup
- [ ] `npm run dev` starts without errors
- [ ] Server listens on port 5000
- [ ] Nodemon watches for file changes

### Database Connectivity
- [ ] Prisma client connects to Supabase
- [ ] SELECT 1 query succeeds
- [ ] User table is accessible
- [ ] Skin table has data (10+ skins)

### API Endpoints (Test in browser or Postman)

#### Portfolio Endpoints
- [ ] `GET /api/v1/portfolio/summary` returns 200
- [ ] Response includes portfolio KPIs
- [ ] Authenticated requests work

#### Research Endpoints (Public)
- [ ] `GET /api/v1/research/volatility/:id` returns volatility data
- [ ] `GET /api/v1/research/rarity/:id` returns rarity score

#### Research Endpoints (Pro only)
- [ ] `GET /api/v1/research/portfolio` requires authentication
- [ ] Returns 403 for free tier users
- [ ] Returns data for pro tier users

#### Subscription Endpoints
- [ ] `POST /api/v1/subscriptions/checkout` creates session
- [ ] Stripe session ID is returned
- [ ] `GET /api/v1/subscriptions/status` returns tier status
- [ ] `POST /api/v1/subscriptions/cancel` works (for pro users)

### Webhook Processing
- [ ] Stripe webhook handler logs events
- [ ] `checkout.session.completed` updates subscription tier
- [ ] User `isPremium` flag is set correctly

### Error Handling
- [ ] Invalid token returns 401
- [ ] Missing required fields return 400
- [ ] Non-existent resources return 404
- [ ] Rate limiting works (if enabled)

---

## Frontend Tests

### App Startup
- [ ] `npm run dev` starts without errors
- [ ] Next.js dev server runs on port 3000
- [ ] Hot reload works (edit component, see change)

### Authentication
- [ ] Landing page loads
- [ ] Sign In button is clickable
- [ ] Clerk authentication modal appears
- [ ] OAuth providers visible (Google, GitHub, etc.)
- [ ] After auth, redirects to dashboard
- [ ] User profile shows in top-right corner

### Dashboard (Free User)
- [ ] Page loads without errors
- [ ] Portfolio summary card visible
- [ ] "Add Skin" button is clickable
- [ ] "Upgrade to Pro" button visible
- [ ] Research tab disabled or shows Pro-only message

### Portfolio Management
- [ ] Click "Add Skin" opens modal
- [ ] Search field accepts input
- [ ] Results dropdown shows skins from database
- [ ] Select skin fills form fields
- [ ] Enter quantity and price
- [ ] Click "Add" creates portfolio entry
- [ ] Skin appears in portfolio list
- [ ] Portfolio value updates correctly

### Dashboard Analytics
- [ ] Portfolio summary card shows:
  - [ ] Total value (sum of current prices × quantity)
  - [ ] Total invested (sum of buy prices × quantity)
  - [ ] Unrealized P&L (current - invested)
  - [ ] ROI percentage
- [ ] Charts render without errors
- [ ] Responsive layout (test on mobile width)

### Upgrade Flow
- [ ] Click "Upgrade to Pro" button
- [ ] Stripe checkout modal/page opens
- [ ] Test card input field accepts: `4242 4242 4242 4242`
- [ ] Expiry field accepts: `12/25`
- [ ] CVC field accepts: `123`
- [ ] "Pay" button triggers payment
- [ ] After success, modal closes
- [ ] Subscription status updates to "active" or "pro"
- [ ] Pro features unlock (Research tab becomes active)

### Pro Features
- [ ] Research tab now accessible
- [ ] Volatility chart shows for selected skin
- [ ] Rarity score displays
- [ ] Portfolio analysis shows insights
- [ ] 30-day moving average renders correctly

### Price History Chart
- [ ] Click on any skin opens detail view
- [ ] Chart.js renders price history chart
- [ ] X-axis shows dates (last 30 days)
- [ ] Y-axis shows prices
- [ ] Tooltip shows price on hover
- [ ] Chart is responsive

### Navigation
- [ ] All navigation links work
- [ ] URLs match expected routes
- [ ] Back button works
- [ ] Refresh page maintains state (via API)

### Error Handling
- [ ] Invalid authentication shows error
- [ ] Network errors display user-friendly message
- [ ] Form validation prevents empty submissions
- [ ] Loading states show during API calls

---

## Integration Tests

### Authentication to Subscription Flow
- [ ] User creates account via Clerk
- [ ] User automatically created in database
- [ ] User can log in immediately
- [ ] User has UserSubscriptions entry with tier="free"

### Portfolio to Stripe Flow
- [ ] Add skin to portfolio
- [ ] Click upgrade
- [ ] Complete Stripe checkout
- [ ] Webhook updates tier to "pro"
- [ ] Frontend immediately shows pro features
- [ ] Pro endpoints return data

### API Authentication
- [ ] Clerk JWT token validated by backend
- [ ] Free tier users cannot access pro endpoints
- [ ] Pro tier users can access pro endpoints
- [ ] Expired tokens return 401

---

## Performance Tests

### Load Time
- [ ] Homepage loads in < 2 seconds
- [ ] Dashboard loads in < 3 seconds
- [ ] API responses < 100ms (target)
- [ ] Charts render in < 1 second

### Database
- [ ] Portfolio fetch returns data < 50ms
- [ ] Volatility calculation < 100ms
- [ ] No N+1 query problems (check logs)

---

## Data Validation

### Skin Data
- [ ] All 10 test skins present in database
- [ ] Prices are reasonable ($40 - $2,850)
- [ ] 30-day price history exists
- [ ] Volatility can be calculated

### User Data
- [ ] Test user created on first auth
- [ ] User email matches Clerk email
- [ ] UserSubscriptions record created
- [ ] Default tier is "free"

### Portfolio Data
- [ ] Portfolio entries link User → Skin
- [ ] Quantities are positive integers
- [ ] Buy prices are positive floats
- [ ] Buy dates are reasonable timestamps

---

## Browser Compatibility

Test in at least 2 browsers:

### Chrome
- [ ] All features work
- [ ] Charts render
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Charts render
- [ ] No console errors

### Safari (optional)
- [ ] All features work
- [ ] Charts render
- [ ] No console errors

---

## Mobile Responsiveness

Test on viewport: 375px (iPhone SE)

- [ ] Navigation collapses to hamburger
- [ ] Portfolio cards stack vertically
- [ ] Forms are readable and usable
- [ ] Charts scale appropriately
- [ ] Touch interactions work

---

## Final Sign-Off

**Date Tested**: _______________  
**Tester**: _______________  
**All tests passed?**: [ ] YES [ ] NO  
**Issues found**: _______________  

**Ready for production deployment?**: [ ] YES [ ] NO  

---

## Known Issues / Notes

(List any bugs or unexpected behavior found during testing)

1. 
2. 
3. 

---

**Test Results**: PASS / FAIL (circle one)

**Approved for deployment**: _______________  (signature)

**Date**: _______________
