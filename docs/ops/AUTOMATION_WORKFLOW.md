# 🤖 Complete Sprint 1→2 Automation Workflow

This document outlines the complete automation workflow to finish Sprint 1 deployment and begin Sprint 2 production verification.

---

## Current State ✅

| Component | Status | Details |
|-----------|--------|---------|
| Sprint 1 Code | ✅ Complete | All 8 code review fixes applied, 57 tests passing |
| Production Backend | ✅ Live | https://backend-three-theta-44.vercel.app (responding) |
| Git Config | ✅ Fixed | Email: arthur_richelhof@yahoo.de |
| Redeploy Commit | ✅ Ready | 38c100a (local, not pushed yet) |
| Sprint 2 Backend | ✅ Complete | fetch-prices.js + GitHub Actions workflow |
| MCP Servers | ✅ Integrated | Vercel, GitHub, Clerk (all in .claude/settings.json) |

---

## Workflow: Manual + Automated Steps

### PHASE 1: Deploy Git Fix (Manual - 5-10 minutes)

**You execute:**
```powershell
cd C:\Users\Arthur\Documents\Coding\CS2 Skin Tracker
git push origin feature/cursor-workflow:main
```

**What happens:**
1. Commit 38c100a pushed to GitHub
2. GitHub webhook triggers Vercel
3. Vercel rebuilds with correct git email
4. Deployment completes (2-5 min)
5. API becomes available at backend-three-theta-44.vercel.app

**Files:**
- `REDEPLOY_INSTRUCTIONS.md` (detailed instructions)

---

### PHASE 2: Verify Deployment (Automated - 5-10 minutes)

**You execute:**
```powershell
$env:VERCEL_TOKEN = "your_token_from_vercel.com/account/tokens"
node verify-redeploy.js
```

**What it does:**
1. ✅ Fetches latest Vercel deployment
2. ✅ Polls until deployment completes
3. ✅ Tests API endpoints respond
4. ✅ Verifies git email fix

**Files:**
- `verify-redeploy.js` (automated verification)

**Expected output:**
```
✅ Deployment READY
✅ All API endpoints responding!
```

---

### PHASE 3: Test GitHub Actions (Automated - 5-15 minutes)

**You execute:**
```powershell
$env:GITHUB_TOKEN = "${GITHUB_TOKEN}"
node trigger-price-updater.js
```

**What it does:**
1. ✅ Validates GitHub token
2. ✅ Triggers price-updater.yml workflow
3. ✅ Polls workflow execution status
4. ✅ Reports job completion
5. ✅ Shows logs link for debugging

**Files:**
- `trigger-price-updater.js` (workflow automation)

**Expected output:**
```
✅ Workflow triggered successfully!
⏳ Status: in_progress (45s)
✅ Workflow completed successfully!
```

---

### PHASE 4: Monitor Production (Automated - 24 hours)

**You execute:**
```powershell
node monitor-production.js
```

**What it does:**
1. ✅ Checks API health every 1 minute
2. ✅ Tracks response times + error rates
3. ✅ Reports every 4 hours
4. ✅ Appends findings to claude.md
5. ✅ Runs for 24 hours

**Files:**
- `monitor-production.js` (24h monitoring)

**Expected output:**
```
✅ API Uptime: 99.5%
✅ Avg Response Time: 145ms
✅ Total Requests: 1440
```

---

## Timeline

| Phase | Duration | Your Action | Automation |
|-------|----------|-------------|-----------|
| **1. Deploy Fix** | 5-10 min | Execute git push | Vercel rebuilds |
| **2. Verify Deploy** | 5-10 min | Set VERCEL_TOKEN + run script | Script polls + tests |
| **3. Test Workflow** | 5-15 min | Set GITHUB_TOKEN + run script | Script triggers + monitors |
| **4. Monitor Prod** | 24 hours | Run script once | Script runs continuously |
| **Total** | **24h+** | ~15 min active | 23h 45m automatic |

---

## Quick Reference: Scripts

### Setup (Do This First)
```powershell
# Navigate to project
cd C:\Users\Arthur\Documents\Coding\CS2 Skin Tracker

# Get tokens (one-time)
# 1. Vercel token: https://vercel.com/account/tokens
# 2. GitHub token: Already in backend/.env (${GITHUB_TOKEN})
```

### Execute Phase by Phase
```powershell
# PHASE 1: Git Push (wait 2-5 min)
git push origin feature/cursor-workflow:main

# Wait for email: "Deployment successful"
# Check: https://vercel.com/arrijr/cs2-skintracker/deployments

# PHASE 2: Verify (wait 5-10 min)
$env:VERCEL_TOKEN = "your_token"
node verify-redeploy.js

# PHASE 3: Test Workflow (wait 5-15 min)
$env:GITHUB_TOKEN = "${GITHUB_TOKEN}"
node trigger-price-updater.js

# PHASE 4: Monitor (runs for 24h, can close terminal)
node monitor-production.js
```

---

## What We're Verifying

### API Correctness ✅
- [ ] GET /api/v1/skins responds
- [ ] GET /api/v1/keys responds
- [ ] GET /health responds
- [ ] Response times < 500ms

### Database Integrity ✅
- [ ] price_history table updates
- [ ] No duplicate entries
- [ ] Timestamps are correct

### GitHub Actions ✅
- [ ] Workflow triggers manually
- [ ] fetch-prices.js executes
- [ ] No rate-limit errors
- [ ] Logs are clean

### Deployment ✅
- [ ] Git email fix applied (arthur_richelhof@yahoo.de)
- [ ] No "Deployment Blocked" errors
- [ ] Environment variables set
- [ ] Stripe webhook configured

---

## Success Criteria

**Phase 1 (Deploy):** Vercel shows "Deployment successful"  
**Phase 2 (Verify):** All endpoints respond with status 200  
**Phase 3 (Test):** Workflow runs to completion (success)  
**Phase 4 (Monitor):** 99%+ uptime over 24 hours  

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Permission denied" on git push | Check git config: `git config --global user.email` must be `arthur_richelhof@yahoo.de` |
| Vercel deployment still fails | Check Vercel build logs: https://vercel.com/arrijr/cs2-skintracker/deployments |
| Script can't find token | Set env var before running: `$env:GITHUB_TOKEN = "ghp_..."` |
| Workflow doesn't trigger | Verify: `.github/workflows/price-updater.yml` exists + is on main branch |
| API returning 500 errors | Check backend logs: https://vercel.com/arrijr/cs2-skintracker |

---

## Files Created

```
verify-redeploy.js              # Phase 2 automation
trigger-price-updater.js        # Phase 3 automation
monitor-production.js           # Phase 4 automation (24h)
REDEPLOY_INSTRUCTIONS.md        # Detailed Phase 1 guide
AUTOMATION_WORKFLOW.md          # This file
```

---

## Next Steps After 24h Monitor

Once monitoring completes:

1. ✅ Review monitoring report in claude.md
2. ✅ Check for any error patterns
3. ✅ Verify price_history has daily updates
4. ✅ Remove DEV_TEST_TOKEN + DEV_FREE_TOKEN
5. ✅ Begin Sprint 2 Phase 2: React frontend

---

**Ready to begin?** Start with:
```powershell
cd C:\Users\Arthur\Documents\Coding\CS2 Skin Tracker
git push origin feature/cursor-workflow:main
```

Then come back here for the next phase.
