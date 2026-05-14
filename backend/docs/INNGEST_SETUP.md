# Inngest Setup — Background Job Orchestration

> Per **ADR-004**. Replaced GitHub Actions cron (free-tier quota exhausted) with Inngest free tier (50k runs/month).

## What runs on Inngest

| Function | Cron | Trigger event | Purpose |
|---|---|---|---|
| `catalog-sync` | `30 2 * * *` (daily 02:30 UTC) | `catalog-sync/manual` | Pull 9 bymykel categories into DB. |
| `price-refresh` | `30 3,9,15,21 * * *` (4×/day) | `price-refresh/manual` | Steam Market scrape, chunked into 15-item steps. |
| `price-alerts-check` | `0 * * * *` (hourly) | `alerts/check` | Evaluate active alerts, send notifications. |
| `portfolio-history-snapshot` | `0 0 * * *` (daily 00:00 UTC) | `portfolio/snapshot` | Snapshot every user's portfolio value. |

All four functions are registered at `POST /api/inngest` (mounted in `src/app.js`). Inngest auto-discovers them when it pings that endpoint.

---

## Local development

```bash
# 1. Backend runs as usual
cd backend
npm run dev          # http://localhost:5000

# 2. In a second terminal — Inngest CLI dev server
npx inngest-cli@latest dev
#   serves dashboard at http://127.0.0.1:8288
#   auto-discovers functions at http://localhost:5000/api/inngest
```

Trigger a function manually from the dev dashboard ("Trigger" button) or via HTTP:

```bash
curl -X POST http://127.0.0.1:8288/e/local-test \
  -H 'Content-Type: application/json' \
  -d '{"name":"catalog-sync/manual","data":{}}'
```

`.env` requires nothing for local dev — when `INNGEST_SIGNING_KEY` is unset, the SDK runs in dev mode (`isDev: true`).

---

## Production setup (one-time)

### Step 1 — Create Inngest account

1. Sign up at https://app.inngest.com (use GitHub login).
2. Create an app named `cs2-skin-tracker` (matches `id` in `src/inngest/client.js`).
3. Note the environment (default: `production`).

### Step 2 — Get keys

In the Inngest dashboard:

- **Event key** → `Manage → Event Keys → Create new`. Used to *send* events.
  - Env var: `INNGEST_EVENT_KEY`
- **Signing key** → `Manage → Signing Key`. Used to *verify* webhook signatures from Inngest.
  - Env var: `INNGEST_SIGNING_KEY`

### Step 3 — Add keys to Vercel

```bash
# Via Vercel CLI (or paste into dashboard → Settings → Environment Variables)
vercel env add INNGEST_EVENT_KEY production
vercel env add INNGEST_SIGNING_KEY production
```

Both vars must be set for the production environment. Without `INNGEST_SIGNING_KEY` the SDK falls back to dev mode and rejects webhook signatures.

### Step 4 — Register the app with Inngest

After Vercel redeploy, register the endpoint with Inngest Cloud:

1. Dashboard → `Apps → Sync new app`.
2. URL: `https://<your-vercel-domain>/api/inngest`
3. Click **Sync**. Inngest pings the endpoint, reads function definitions, and shows all 4 functions.

From this point cron triggers fire on Inngest's schedule and hit your Vercel function.

---

## Sending events from code

```js
import { inngest } from './inngest/client.js';

// Manually trigger price refresh (e.g. from admin endpoint)
await inngest.send({ name: 'price-refresh/manual', data: { skinsOnly: true } });

// Limit to first 500 items
await inngest.send({ name: 'price-refresh/manual', data: { maxItems: 500 } });
```

---

## Operational notes

- **Vercel 60s function limit:** `price-refresh` is chunked into 15-item steps (~45s each). Inngest persists state between steps — if a step times out, only that step retries.
- **Rate-limit cooldown:** if a chunk is >5 items rate-limited and rate-limited > ok, `priceRefresh` calls `step.sleep('cooldown-after-rate-limit', '10m')` durably (doesn't burn execution time).
- **Concurrency guard:** `priceRefresh` is configured `{ concurrency: { limit: 1 } }` — two refreshes never run in parallel.
- **Retries:** transient errors auto-retry per function config (`retries: 2-3`).
- **Cost:** free tier = 50k function runs/month. Our load:
  - catalog-sync: 30/month
  - price-refresh: ~120/month × 200 steps each = 24k runs
  - alerts: 720/month
  - portfolio-snapshot: 30/month
  - **Total ≈ 25k/month** — comfortably under the 50k limit.

---

## Migration from GHA

Old GHA workflow files moved to `.github/workflows/*.yml.bak`. They can be deleted once Inngest is verified in prod. Steps:

1. Verify all 4 functions show up in Inngest dashboard after sync.
2. Manually trigger each via dashboard, confirm DB writes.
3. Wait one cron cycle each (e.g. 24h for catalog-sync, 6h for price-refresh).
4. If both runs succeed → delete `.github/workflows/*.bak`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `GET /api/inngest` returns 500 | Check `INNGEST_SIGNING_KEY` in Vercel — if missing in prod, SDK errors. For dev, ensure no signing key is set (forces dev mode). |
| `mode: "cloud"` in dev | Unset `INNGEST_SIGNING_KEY` in `backend/.env`. Client uses `isDev: !process.env.INNGEST_SIGNING_KEY`. |
| Functions not appearing after sync | Check the Vercel deployment serves `GET /api/inngest` returning JSON with `function_count: 4`. |
| `PUT /api/inngest` returns `Failed to register; fetch failed` (local) | Expected if Inngest CLI dev server isn't running. Start it with `npx inngest-cli@latest dev`. |
| Cron not firing in prod | Check Inngest dashboard → Functions → cron schedule visible? If not, re-sync app. |
