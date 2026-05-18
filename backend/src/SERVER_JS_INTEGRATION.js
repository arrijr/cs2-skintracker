/**
 * Integration Code for backend/src/server.js
 *
 * Copy-paste the highlighted sections into your Express app
 * IMPORTANT: Order matters! Webhook must be BEFORE json() middleware
 */

// ============================================================================
// SECTION 1: Add these imports at the top of server.js
// ============================================================================

const stripeWebhookRouter = require('./routes/webhook-stripe');
const apiKeysRouter = require('./routes/api-keys');
const publicAPIRouter = require('./routes/public-api');

// ============================================================================
// SECTION 2: In your Express app setup, BEFORE middleware
// ============================================================================

// ⚠️ IMPORTANT: Stripe webhook MUST come BEFORE express.json()
// because it needs the raw request body for signature verification
app.use('/api/v1/webhooks', stripeWebhookRouter);

// Standard middleware (json, cors, etc.)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// ============================================================================
// SECTION 3: After authentication middleware, add these routes
// ============================================================================

// Example - after your auth middleware:
// app.use(authenticateUser); // Your auth middleware

// API Key management (requires auth)
app.use('/api/v1/api-keys', apiKeysRouter);

// Public B2B API (API key auth, no user login needed)
app.use('/api/public', publicAPIRouter);

// ============================================================================
// COMPLETE EXAMPLE: Minimal server.js setup
// ============================================================================

/*
const express = require('express');
const cors = require('cors');
const stripeWebhookRouter = require('./routes/webhook-stripe');
const apiKeysRouter = require('./routes/api-keys');
const publicAPIRouter = require('./routes/public-api');

const app = express();

// ⚠️ WEBHOOK FIRST - Before json middleware!
app.use('/api/v1/webhooks', stripeWebhookRouter);

// Then json middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Then your auth middleware
const { requireAuth } = require('./middleware/auth');
app.use(requireAuth); // Applies to all routes below

// Then API routes
app.use('/api/v1/api-keys', apiKeysRouter);
app.use('/api/public', publicAPIRouter);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/

// ============================================================================
// VERIFICATION: Test these endpoints after integration
// ============================================================================

/*
1. Test public API (requires API key):
   curl -X GET http://localhost:5000/api/public/skins \
     -H "Authorization: Bearer <api-key>"

2. Test API key creation (requires auth):
   curl -X POST http://localhost:5000/api/v1/api-keys \
     -H "Authorization: Bearer <clerk-token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test"}'

3. Test webhook signature (Stripe only):
   curl -X POST http://localhost:5000/api/v1/webhooks/stripe \
     -H "stripe-signature: <signature>" \
     -H "Content-Type: application/json" \
     -d '{...}'

4. Check health:
   curl http://localhost:5000/api/v1/health
*/

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
❌ Error: "No signature provided" on webhook
✅ Fix: Make sure webhook router is BEFORE express.json()

❌ Error: "Invalid API key"
✅ Fix: Check Bearer token format: "Authorization: Bearer <key>"

❌ Error: "Cannot read property 'split' of undefined"
✅ Fix: Make sure Authorization header exists on public API requests

❌ Error: "Webhook processing failed"
✅ Fix: Check STRIPE_WEBHOOK_SECRET is correct in .env
*/

module.exports = null; // This is just documentation, not executable code
