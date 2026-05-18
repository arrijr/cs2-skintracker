# 🚀 Sprint 1: Database & Payment Setup - Implementation Guide

**Welcome!** You're about to implement the payment & API infrastructure for CS2 Skin Tracker's freemium SaaS model.

---

## 📖 Quick Navigation

### 🎯 Starting Point
- **New to this project?** → Start with **SPRINT1_SUMMARY.md**
- **Ready to code?** → Go to **SPRINT1_SETUP_GUIDE.md**
- **Need Stripe config?** → See **STRIPE_DASHBOARD_SETUP.md**

### 📊 Progress Tracking
- **Interactive Checklist** → Open `sprint1_progress.html` in browser
- **Click items to mark complete** → Progress saves to browser storage

### 💻 Code Files Created

**Backend Services:**
- `src/services/stripe-service.js` - Stripe integration (checkout, webhooks)
- `src/middleware/tier-gating.js` - Feature limits by subscription tier
- `src/routes/webhook-stripe.js` - Webhook endpoint (Stripe → App)
- `src/routes/api-keys.js` - API key management for B2B customers
- `src/routes/public-api.js` - Public API endpoints (skins, cases, history)

**Database:**
- `prisma/schema.prisma` - UPDATED with payment fields & new models
- `prisma/migrations/20260505_add_payment_and_api_models/migration.sql` - DB migration

**Documentation:**
- `SPRINT1_SUMMARY.md` - Executive overview
- `SPRINT1_SETUP_GUIDE.md` - Detailed implementation steps
- `STRIPE_DASHBOARD_SETUP.md` - Stripe configuration checklist
- `SERVER_JS_INTEGRATION.js` - Code snippets for server.js

---

## ⚡ TL;DR - The 4 Steps

### Step 1: Configure Stripe (15 min)
```
1. Create Pro (€4.99/mo) & Enterprise (€99/mo) products
2. Copy API keys from Stripe Dashboard
3. Set up webhook endpoint
4. Add keys to backend/.env
```
→ **Use:** STRIPE_DASHBOARD_SETUP.md

### Step 2: Apply Database (10 min)
```bash
cd backend
npx prisma migrate dev --name add_payment_and_api_models
```

### Step 3: Integrate Routes (10 min)
```javascript
// In backend/src/server.js, add:
app.use('/api/v1/webhooks', stripeWebhookRouter);
app.use('/api/v1/api-keys', apiKeysRouter);
app.use('/api/public', publicAPIRouter);
```
→ **Use:** SERVER_JS_INTEGRATION.js

### Step 4: Test (10 min)
```bash
# Create API key
curl -X POST http://localhost:5000/api/v1/api-keys \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Test"}'

# Use API key to access public API
curl http://localhost:5000/api/public/skins \
  -H "Authorization: Bearer <api-key>"
```

---

## 📋 What Gets Built

### User Tiers
```
FREE     → 10 skins, 5 alerts, no API access
PRO      → Unlimited skins, 100 alerts, 10k API calls/day ($4.99/mo)
ENTERPRISE → Everything unlimited (custom pricing)
```

### API Features
```
B2B API          ✅ Fully implemented - /api/public/*
API Keys         ✅ Fully implemented - /api/v1/api-keys
Rate Limiting    ✅ Per-key quota tracking
Usage Logging    ✅ Every request logged to database
Stripe Webhooks  ✅ Auto-updates user tier on payment
```

---

## 🎯 Success Criteria

When Sprint 1 is complete, you should have:

- ✅ Prisma migration applied (APIKey, APILog tables created)
- ✅ All routes mounted on Express server
- ✅ Can create/revoke API keys for Pro users
- ✅ Can call /api/public/* endpoints with Bearer token
- ✅ API usage logged to database
- ✅ Daily call limits enforced
- ✅ Stripe webhooks update user tier

Test each of these before moving to Sprint 2.

---

## 🛠️ Implementation Order

```
1. STRIPE_DASHBOARD_SETUP.md (15 min) ← Start here
   ↓
2. backend/.env setup with Stripe keys (5 min)
   ↓
3. npx prisma migrate dev (10 min)
   ↓
4. server.js integration (10 min)
   ↓
5. Test endpoints (10 min)
   ↓
6. ✅ SPRINT 1 COMPLETE
```

**Total Time: ~50 minutes**

---

## 📞 Common Questions

**Q: Do I need to pay for Stripe to test?**
A: No! Use Stripe's test mode (pk_test_*, sk_test_*). Switch to live keys when deploying.

**Q: Can I skip the Stripe Dashboard setup?**
A: No - you need the price IDs and webhook signing secret in your .env file.

**Q: Do I need Stripe CLI for local testing?**
A: Highly recommended! It forwards webhooks to localhost so you can test end-to-end locally.

**Q: What if I already have a Stripe account?**
A: Good! Just add the new Pro/Enterprise products and webhook endpoint. You can reuse existing API keys.

---

## 🚨 Critical Points

1. **Webhook must come BEFORE json() middleware** in server.js
   - Stripe needs raw request body for signature verification
   - See SERVER_JS_INTEGRATION.js for correct order

2. **API keys are hashed with SHA-256**
   - Never store unhashed keys in database
   - Only show the key once when creating it

3. **Rate limiting resets daily at UTC midnight**
   - Controlled in tier-gating.js
   - Can manually reset with POST /api/v1/api-keys/:id/reset

4. **Keep .env secrets secret**
   - STRIPE_SECRET_KEY should never be committed to git
   - Use Render/Vercel environment variables for production

---

## 📁 File Reference

| File | Purpose | Created |
|------|---------|---------|
| `SPRINT1_SUMMARY.md` | Overview of what's been built | ✅ |
| `SPRINT1_SETUP_GUIDE.md` | Step-by-step integration guide | ✅ |
| `STRIPE_DASHBOARD_SETUP.md` | Stripe account configuration | ✅ |
| `SERVER_JS_INTEGRATION.js` | Code snippets for server.js | ✅ |
| `sprint1_progress.html` | Interactive progress tracker | ✅ |
| `src/services/stripe-service.js` | Stripe SDK integration | ✅ |
| `src/middleware/tier-gating.js` | Feature limit enforcement | ✅ |
| `src/routes/webhook-stripe.js` | Webhook receiver | ✅ |
| `src/routes/api-keys.js` | API key CRUD + management | ✅ |
| `src/routes/public-api.js` | B2B API endpoints | ✅ |
| `prisma/schema.prisma` | Database schema (UPDATED) | ✅ |
| `prisma/migrations/20260505...` | Database migration SQL | ✅ |

---

## ✅ Checklist Before Starting

- [ ] Node.js & npm installed
- [ ] Backend running locally (`npm run dev`)
- [ ] Stripe account created (free)
- [ ] Clerk authentication already set up
- [ ] PostgreSQL database connected
- [ ] `.env` file exists with existing secrets

---

## 🎓 Learning Resources

If you get stuck on specific parts:

- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Prisma Migrations**: https://www.prisma.io/docs/orm/prisma-migrate
- **Express Middleware**: https://expressjs.com/guide/using-middleware.html
- **API Key Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/API_Key_Cheat_Sheet.html

---

## 🚀 What Comes Next (Sprint 2)

After completing Sprint 1:

1. **Price Update Service** - Fetch prices from free Steam API
2. **GitHub Actions Workflow** - Daily price updates at 02:00 UTC
3. **Frontend Components** - Pricing page, Stripe checkout button

**Sprint 2 Timeline**: 30 hours (3-4 days)

---

## 💬 Need Help?

1. **Check the relevant guide** (SPRINT1_SETUP_GUIDE.md has troubleshooting section)
2. **Review code comments** in generated files
3. **Use Stripe Dashboard help** for Stripe-specific questions
4. **Test with Stripe CLI** for webhook issues

---

## 🎉 Ready to Start?

→ **Open STRIPE_DASHBOARD_SETUP.md** and begin with Step 1!

---

**Total Estimated Time**: 50 minutes of actual work + 25 hours over 3-4 days with testing & refinement

Good luck! 🚀
