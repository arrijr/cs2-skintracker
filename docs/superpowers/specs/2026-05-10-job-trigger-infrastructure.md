# Job Trigger Infrastructure (Admin Endpoints + GitHub Actions Cron)

**Date:** 2026-05-10
**Status:** Spec — approved
**Owner:** Arthur

---

## 1. Problem

Backend is deployed on Vercel (serverless). `node-cron` schedules registered in `backend/src/cron/index.js` never execute in production — serverless functions don't keep long-lived processes alive. This means:

- Daily catalog sync from bymykel: never runs in prod
- Price refresh against Steam Market: never runs in prod
- Existing price alert cron, portfolio history cron, etc.: also broken (latent bug)

We need a reliable way to:
1. Trigger long-running jobs (price refresh = ~10h) from outside the request lifecycle
2. Do it on a daily schedule
3. Stay on Vercel (no migration)

---

## 2. Approach (decided)

Two pieces:

**(a) Admin trigger endpoints in the Express backend.** Each existing cron job gets a corresponding `POST /api/v1/admin/jobs/<name>` endpoint that runs the same logic synchronously, protected by a shared secret.

**(b) GitHub Actions workflows that call those endpoints on a cron schedule.** GitHub-hosted runners get up to 6 hours per job (Free tier) — enough for a full price refresh (~10h is the worst case; in practice we filter and parallelize, see Note in §6).

Why GitHub Actions over Vercel Cron:
- Vercel Cron caps function duration at 60s (Hobby) or 300s (Pro). Both kill long jobs.
- GitHub Actions allows 6h/job. Free for public repos, generous for private.
- We already use GitHub for source; no new vendor.

---

## 3. Endpoints

| Method | Path | What it does |
|--------|------|----------|
| `POST` | `/api/v1/admin/jobs/catalog-sync` | Run `runCatalogSync()` synchronously, return summary |
| `POST` | `/api/v1/admin/jobs/price-refresh` | Run `runPriceRefresh()` synchronously, return summary |
| `POST` | `/api/v1/admin/jobs/price-refresh?max=N` | Same but limit to N items (smoke runs, partial refreshes) |
| `POST` | `/api/v1/admin/jobs/portfolio-history` | Run existing `calculateAndStorePortfolioValues` |
| `POST` | `/api/v1/admin/jobs/price-alerts` | Run existing `checkPriceAlerts` |

**Note:** the existing `node-cron` registrations stay in code for local-dev convenience but become dead code in production (no impact — they just never fire on Vercel).

### Auth

Every job endpoint requires header `X-Job-Secret: <secret>` matching `process.env.JOB_TRIGGER_SECRET`. Wrong/missing secret → 401. The secret is stored as a Vercel env var AND a GitHub Actions secret.

This is a shared-secret bearer token approach. Simpler than Clerk admin JWT for machine-to-machine, and removes the dependency on user auth for cron execution.

### Response

`200 OK` with JSON summary on success. `5xx` on failure with error message (job result still partially recorded in DB).

For long jobs (`price-refresh`): the endpoint waits for completion before responding. GitHub Actions has a long HTTP timeout (configurable). For Vercel: backend on Vercel = 60s function limit (Free) / 300s (Pro) — **problem.**

### Critical constraint

Vercel function duration limits us. Solutions:
- Run jobs from GitHub Actions runner directly (clones repo, runs node, talks to Postgres). Endpoint becomes a no-op approach — we DON'T need the Vercel endpoint at all.
- Or: use Vercel Pro tier (5min limit) + chunked jobs (refresh in batches of 1000 items, ~50min each = 10 chained calls).

**Chosen:** Run jobs **directly inside the GitHub Actions runner**. The workflow checks out the code, installs deps, sets `DATABASE_URL` from secret, and runs the same script the cron job would (`runCatalogSync()`, `runPriceRefresh()`). No HTTP endpoint needed. The Vercel backend stays request-only for user-facing API.

This pivot simplifies the design significantly. The admin endpoints become **optional** (nice-to-have for manual triggers via curl from a workstation, but not required for the cron). For v1 we skip them entirely.

---

## 4. Architecture (simplified)

```
┌─────────────────────────────────────────────┐
│ GitHub Actions Runner (daily cron)          │
│   - checkout repo                           │
│   - npm ci                                  │
│   - node scripts/run-job.js <name>          │
│   - reads DATABASE_URL from secrets         │
│   - executes runCatalogSync()/runPriceRefresh() │
│   - writes results to Postgres              │
└─────────────────────────────────────────────┘
                       ↓
              ┌────────────────┐
              │ Supabase (Prod)│
              └────────────────┘
                       ↑
              ┌─────────────────────────────────────┐
              │ Vercel Backend (user-facing API)    │
              │   - reads same DB                   │
              │   - serves /api/v1/* to frontend    │
              └─────────────────────────────────────┘
```

GitHub Actions runner and Vercel backend both read/write the same Supabase database. No HTTP between them.

---

## 5. Components

| File | Purpose |
|------|---------|
| `backend/scripts/run-job.js` | Single entrypoint: `node run-job.js <jobName>`. Dispatches to runCatalogSync/runPriceRefresh based on first arg. |
| `.github/workflows/cron-catalog-sync.yml` | Runs `run-job.js catalog-sync` daily at 02:30 UTC |
| `.github/workflows/cron-price-refresh.yml` | Runs `run-job.js price-refresh` daily at 03:30 UTC |
| `.github/workflows/cron-portfolio-history.yml` | Runs portfolio history calc daily |
| `.github/workflows/manual-job.yml` | `workflow_dispatch` input → run any job on demand from GitHub UI |

Each workflow:
- Triggers on `schedule` (cron) and `workflow_dispatch` (manual)
- Uses `ubuntu-latest`
- Checkout, setup Node 22, `npm ci` in backend
- Sets `DATABASE_URL`, `NODE_TLS_REJECT_UNAUTHORIZED=0` (Supabase cert chain), other env vars from secrets
- Runs `node scripts/run-job.js <name>`
- Job timeout: 5h (price refresh worst case = 10h is too much; will need optimization — see §6)

### GitHub Secrets needed

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Production Supabase URL (URL-encoded password) |
| `STEAM_MARKET_USER_AGENT` | Optional UA override |

---

## 6. Price refresh duration concern

Full refresh of 15,071 items at 3s = ~12.5h. Exceeds GitHub Actions 6h soft cap (Free tier). Options:

**Strategy A — chunked workflow.** Workflow runs only a slice (e.g. `?max=3000` items per run). Schedule 4 separate workflows at staggered times (every 6h). Over 24h, all items covered. Simple, reliable.

**Strategy B — prioritize hot items.** Skip items with no recent volume (e.g. items where last 3 snapshots show no `soldVolume24h`). Probably cuts dataset to 3-5k items → fits in 4h easily.

**Strategy C — parallel from multiple GitHub runners.** Split work, run 4 parallel jobs, each does 1/4 of items. Simple work-sharding via modulo on `id`.

**Chosen:** **A** for v1 (chunked schedule, every 6h). Easiest, no code changes to runPriceRefresh. Strategy B is a later optimization once we see real volume data.

Chunking implementation:
- `runPriceRefresh({ maxItems: N, offset: O })` adds optional limit/offset
- 4 workflows: 02:30 UTC (offset 0, 4000), 08:30 (4000, 4000), 14:30 (8000, 4000), 20:30 (12000, all rest)
- Each workflow ~3.3h max

---

## 7. Tests

- Unit test for `run-job.js` arg-dispatch (`node run-job.js unknown-name` → exit 1, valid name → calls correct fn)
- Smoke test: existing pipeline already verified to work end-to-end (10 items via Steam Market → MarketSnapshot rows written)
- GitHub Actions workflow tested via `workflow_dispatch` manual trigger before relying on cron

---

## 8. NOT Goals (YAGNI)

- ❌ Admin HTTP endpoints in the Express backend — not needed since GitHub Actions runs scripts directly
- ❌ Job queue / Redis / BullMQ — single daily run, no concurrency, overkill
- ❌ Vercel Cron / Pro tier — chosen GitHub Actions instead
- ❌ Realtime price updates — daily snapshot is enough per existing spec
- ❌ Self-healing dead workflows — if a workflow fails, next day's run picks up (price refresh is idempotent)
- ❌ Job history UI — GitHub Actions UI is fine for v1

---

## 9. Migration of existing crons

`backend/src/cron/index.js` keeps the schedules for local-dev convenience (running `npm run dev` simulates production scheduling). In production they no-op (no long-lived process).

We do NOT delete them — they document intent and let local dev see jobs fire.

---

## 10. Success Criteria

- Full catalog sync runs every night, completes in <10min
- Price refresh covers all 15k active items over a 24h period (in 4 chunks)
- Failure rate <2% (Steam Market 429/5xx)
- GitHub Actions run history shows green for both daily jobs
- Manual trigger via `workflow_dispatch` works from GitHub UI

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Steam IP ban on GitHub runner | Medium | High | 3s rate limit (already coded); GitHub runners use varied IPs across runs |
| DATABASE_URL leaked in workflow logs | Low | Critical | Use `${{ secrets.DATABASE_URL }}`, never echo. Rotate if exposed. |
| GitHub Actions free-tier minutes exhausted | Low | Medium | Estimated 4 × 3.3h × 30days = 396h/month; free public repo = unlimited; free private = 2000 min/month → tight on private. Monitor. |
| Workflow runtime exceeds 6h | Low | Medium | Chunking limits each run to 4000 items × 3s ≈ 3.3h. Margin OK. |
| Schema drift breaks job in CI | Medium | High | Use same Prisma client as deployed backend; smoke test before scheduling |

---

## 12. Next Steps

1. Spec reviewed → implementation plan via `writing-plans` skill
2. Subagent-driven execution
3. Manual trigger test
4. Enable cron schedule
