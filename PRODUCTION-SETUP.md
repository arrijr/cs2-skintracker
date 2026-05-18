# CS2 Skin Tracker - Production Deployment Setup

## PHASE 1: Collect Production Keys (Manual)

You need to collect two production secret keys from:

### 1. Clerk Secret Key
1. Go to **Clerk Dashboard** (https://dashboard.clerk.com)
2. Navigate to: **Project Settings → API Keys**
3. Find the **Secret Key** section
4. Copy the key (starts with `sk_live_`)
5. Keep it safe - you'll paste it below

### 2. Stripe Secret Key
1. Go to **Stripe Dashboard** (https://dashboard.stripe.com)
2. Navigate to: **Developers → API Keys**
3. Find the **Secret Key** (live keys section)
4. Copy the key (starts with `sk_live_`)
5. Keep it safe - you'll paste it below

---

## PHASE 2: Run Secure Setup Script

Open **PowerShell** in the project directory and run:

```powershell
# Navigate to project root
cd "C:\Users\Arthur\Documents\Coding\CS2 Skin Tracker"

# Run the secure setup script
# When prompted, paste the keys (they will NOT be shown on screen)
.\setup-production-secrets.ps1
```

**What this script does:**
- ✅ Prompts you to paste CLERK_SECRET_KEY (shows as dots)
- ✅ Prompts you to paste STRIPE_SECRET_KEY (shows as dots)
- ✅ Validates both keys match `sk_live_*` pattern
- ✅ Updates `.env` file locally
- ✅ Commits changes to git
- ✅ Pushes to main branch (triggers Vercel auto-deploy)
- ✅ Logs all operations (NO keys in log)
- ✅ Clears sensitive variables from memory

**Log location:** `C:\Users\Arthur\AppData\Roaming\Claude\local-agent-mode-sessions\1e91ea34-1617-42f9-9cd6-0e6c34926dea\c7c6fc4d-39b5-4622-be8e-1f903abb2cfa\local_b1f0193c-c2cd-4f10-920f-61d21ff587f1\outputs\production-setup-log.txt`

---

## PHASE 3: Set Vercel Environment Variables

After the script completes, Claude will:

1. **Call Vercel MCP** to set environment variables in production scope:
   - `CLERK_SECRET_KEY`
   - `STRIPE_SECRET_KEY`

2. **Verify both are set** via `get_environment_variables`

3. **Update ALLOWED_ORIGINS** with live Vercel URL

---

## PHASE 4: Register Stripe Webhook

1. Get live Vercel deployment URL
2. Register webhook: `https://<live-url>/api/v1/webhooks/stripe`
3. Copy webhook signing secret (`whsec_...`)
4. Save to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## PHASE 5: Final Verification

Test production endpoints:
- `GET /api/v1/skins` (should return 200 with real data)
- `GET /api/v1/keys` (should return 200 with real data)
- Webhook endpoint should accept POST requests

---

## Security Notes

- Keys are NEVER logged in plaintext
- Keys are NEVER echoed back to console
- Keys are only stored in:
  - `.env` file (local, git-ignored)
  - Vercel Dashboard (encrypted)
- `.env` is already in `.gitignore` ✅
- Dev test tokens will be removed in Sprint 2

---

## Troubleshooting

**"Key must start with sk_live_"**
- Make sure you copied from LIVE keys, not TEST keys
- TEST keys start with `sk_test_`

**"git push" fails**
- Make sure you have git configured: `git config user.name` and `git config user.email`
- Make sure you have push access to the repository

**Keys not showing in Vercel**
- Wait 30 seconds for Vercel to sync environment variables
- Verify in Vercel Dashboard: Settings → Environment Variables

---

## Next Steps

After successful deployment:
1. Monitor Vercel logs for errors
2. Test `/api/v1/skins` endpoint with curl or Postman
3. Verify Stripe webhooks are being received
4. Start Sprint 2 (price fetching service)
