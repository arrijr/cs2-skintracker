# Stripe Dashboard Configuration Checklist

**Estimated Time**: 10 minutes  
**Access**: https://dashboard.stripe.com

---

## Step-by-Step Setup

### 1. Create Pro Product & Price

1. Go to **Products** → **+ Add product**
   ```
   Product Name: CS2 Skin Tracker Pro
   Description: Monthly Pro subscription with unlimited features
   Type: Standard product (select this)
   ```

2. Click **Add pricing**
   ```
   Pricing model: Standard pricing
   Price: 4.99 EUR
   Billing period: Monthly (recurring)
   ```

3. **SAVE THE PRICE ID** 
   - Look for the price ID starting with `price_`
   - Example: `price_1234567890`
   - Copy this → **STRIPE_PRICE_PRO_ID** in your `.env`

4. Click **Save and continue**

---

### 2. Create Enterprise Product & Price

1. Go back to **Products** → **+ Add product**
   ```
   Product Name: CS2 Skin Tracker Enterprise
   Description: Custom enterprise plan with unlimited API calls
   Type: Standard product
   ```

2. Click **Add pricing**
   ```
   Pricing model: Standard pricing
   Price: 99.00 EUR
   Billing period: Monthly (recurring)
   ```

3. **SAVE THE PRICE ID**
   - Copy the price ID starting with `price_`
   - Example: `price_0987654321`
   - Copy this → **STRIPE_PRICE_ENTERPRISE_ID** in your `.env`

---

### 3. Get API Keys

1. Go to **Developers** → **API keys**

2. Under **Standard keys** section:
   - **Publishable key** (starts with `pk_live_...` or `pk_test_...`)
   - Copy this → **STRIPE_PUBLIC_KEY** in your `.env`

3. Under the same section:
   - **Secret key** (starts with `sk_live_...` or `sk_test_...`)
   - ⚠️ **KEEP THIS SECRET** - Only show once
   - Copy this → **STRIPE_SECRET_KEY** in your `.env`

---

### 4. Set Up Webhook Endpoint

1. Go to **Developers** → **Webhooks**

2. Click **Add endpoint**
   ```
   Endpoint URL: https://your-backend.com/api/v1/webhooks/stripe
   
   Replace "your-backend.com" with:
   - Production: your Render backend URL
   - Local testing: Use Stripe CLI (see below)
   ```

3. Select **Events to send** - Check these boxes:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

4. Click **Add endpoint**

5. **SAVE THE SIGNING SECRET**
   - After creation, you'll see the endpoint details
   - Look for **Signing secret** (starts with `whsec_...`)
   - Copy this → **STRIPE_WEBHOOK_SECRET** in your `.env`

---

## Your .env File Should Look Like

```bash
# backend/.env

# Stripe Keys (from API Keys page)
STRIPE_PUBLIC_KEY=pk_test_51234567890abcdefghijklmnop  # Publishable
STRIPE_SECRET_KEY=sk_test_0987654321abcdefghijklmnop   # Secret

# Stripe Prices (from Products page)
STRIPE_PRICE_PRO_ID=price_1234567890                   # Pro €4.99/month
STRIPE_PRICE_ENTERPRISE_ID=price_0987654321            # Enterprise €99/month

# Stripe Webhook (from Webhooks page)
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnop

# Webhook URL (for local testing, Stripe CLI will provide this)
STRIPE_WEBHOOK_URL=https://your-backend.com/api/v1/webhooks/stripe
```

---

## Testing Locally with Stripe CLI

### Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Chocolatey):**
```bash
choco install stripe
```

**Windows (Manual):**
Download from https://github.com/stripe/stripe-cli/releases

### Connect to Your Stripe Account

```bash
stripe login
# Opens browser for authentication
```

### Forward Webhooks to Localhost

```bash
stripe listen --forward-to http://localhost:5000/api/v1/webhooks/stripe
```

Output:
```
> Ready! Your webhook signing secret is whsec_test_xxxxx
```

**Save this signing secret** → **STRIPE_WEBHOOK_SECRET** (for local .env)

### Trigger Test Events

In a new terminal:

```bash
# Trigger checkout.session.completed
stripe trigger checkout.session.completed

# Trigger subscription.created
stripe trigger customer.subscription.created

# Trigger payment success
stripe trigger invoice.payment_succeeded
```

---

## Verification Checklist

- [ ] Pro product created with price €4.99/month
- [ ] Enterprise product created with price €99/month
- [ ] Pro price ID saved (STRIPE_PRICE_PRO_ID)
- [ ] Enterprise price ID saved (STRIPE_PRICE_ENTERPRISE_ID)
- [ ] Publishable key copied (STRIPE_PUBLIC_KEY)
- [ ] Secret key copied (STRIPE_SECRET_KEY)
- [ ] Webhook endpoint created
- [ ] Webhook signing secret saved (STRIPE_WEBHOOK_SECRET)
- [ ] Local Stripe CLI configured for testing
- [ ] Test webhook triggers work

---

## Common Issues

### ❌ "Missing Stripe Keys"
```
✅ Make sure you're looking at STANDARD keys, not restricted keys
✅ Verify you're on the API Keys page, not somewhere else
```

### ❌ "Webhook not receiving events"
```
✅ Ensure endpoint URL is correct (no typos)
✅ Check that Status is "Enabled" (not "Disabled")
✅ Use Stripe CLI for local testing - webhook won't work with localhost directly
```

### ❌ "Invalid price ID"
```
✅ Make sure you're copying from Products → [Product Name] → Pricing section
✅ Price IDs start with "price_"
❌ Don't confuse with product IDs (start with "prod_")
```

---

## Next: Integrate into Backend

Once you have all keys, move to **SPRINT1_SETUP_GUIDE.md** Step 1.
