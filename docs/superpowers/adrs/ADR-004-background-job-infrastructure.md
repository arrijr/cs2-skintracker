# ADR-004: Background job infrastructure

**Status:** Accepted — **Partially Superseded by addendum below (2026-05-12)**
**Date:** 2026-05-10 (decided) · 2026-05-11 (formalized) · 2026-05-12 (addendum: GHA quota exhausted)
**Deciders:** Arthur (sole engineer)

## Context

We have four recurring jobs that must run independently of the request lifecycle:

| Job | Purpose | Cadence | Worst-case duration |
|-----|---------|---------|---------------------|
| **catalog-sync** | Pull bymykel/CSGO-API catalog → Postgres | Daily 02:30 UTC | ~5 min |
| **price-refresh-chunk** | Scrape Steam Market prices (chunked) | 4× daily at 6h offset | ~3.3 h per chunk |
| **portfolio-history-snapshot** | Snapshot portfolio values for charts | Daily 00:00 UTC | ~10 min |
| **price-alerts-check** | Evaluate alert triggers | Hourly | ~2 min |

Backend (`backend/`) is deployed on Vercel serverless, which has hard execution caps:
- **Hobby tier:** 60s per function invocation
- **Pro tier ($20/mo):** 300s per function invocation

Even Pro can't run our worst-case 3.3h price-refresh chunk.

## Decision

**GitHub Actions runners execute Node scripts directly against the Supabase database.** No HTTP call through Vercel.

Implementation already shipped (May 10):

- `backend/scripts/run-job.js <jobName>` — unified entrypoint
- `.github/workflows/cron-catalog-sync.yml` — daily catalog sync
- `.github/workflows/cron-price-refresh.yml` — 4× daily chunks (offset 0, 4000, 8000, 12000)
- `.github/workflows/manual-job.yml` — workflow_dispatch for ad-hoc runs

Spec lives at `docs/superpowers/specs/2026-05-10-job-trigger-infrastructure.md`. This ADR formalizes the options matrix and the constraints that made GHA the winner.

## Options Considered

### Option A: Vercel Cron + chunked work (rejected)

| Dimension | Assessment |
|-----------|------------|
| Cost | $20/mo (Pro required) |
| Complexity | High — split each job into 60×5-min chunks, persist resume cursor |
| Reliability | Low — every chunk transition is a failure point |
| Observability | Vercel Dashboard logs |

Rejected because price-refresh would need ~40 chained chunks per day, with manual orchestration of cursor state.

### Option B: GitHub Actions runners executing Node scripts (CHOSEN)

| Dimension | Assessment |
|-----------|------------|
| Cost | $0 (free public repo; private repo: 2000 min/mo free, then $0.008/min) |
| Complexity | Low — workflow YAML + `run-job.js` entrypoint |
| Reliability | High — GitHub-hosted runners up 99.9%+ |
| Job timeout | 6h (free tier soft cap, fits 3.3h chunks comfortably) |
| Observability | GitHub Actions UI + logs retained 90 days |
| Vendor lock-in | Medium — locked to GitHub for jobs, but easy to migrate |

### Option C: Dedicated worker service (Inngest / Trigger.dev / Render Background) (rejected)

| Dimension | Assessment |
|-----------|------------|
| Cost | Inngest free up to 50k runs/mo; Trigger.dev free up to 10k. Render: $7/mo for a worker. |
| Complexity | Medium — new vendor account, SDK, env vars, monitoring |
| Reliability | High |
| Job timeout | Unlimited typically |
| Observability | Best of all options — built-in retry, replay, step inspector |
| Future-proof | Yes |

Rejected at v1 because we already had a GitHub repo + free tier — zero marginal cost.

### Option D: Self-hosted cron (cron-style VPS / Docker on Hetzner) (rejected)

Rejected: infrastructure burden, monitoring burden, single point of failure.

## Trade-off Analysis

Option B wins on **cost** and **time-to-ship**. Trade-offs accepted:
- **No retry-on-failure built-in.** If a price-refresh chunk fails mid-run, next day's chunk picks up — we lose a day of prices for some items. Acceptable: price-refresh is idempotent and DB has stale prices marked.
- **No step-level resume.** A 3h job that fails at 2:55 restarts from zero. Mitigation: chunk size already keeps each run small.
- **No native observability beyond logs.** Need to manually wire Sentry / status-page integration.

If we ever need any of: per-step retries, fan-out concurrency, programmatic triggering from app code, real-time job dashboards → migrate to Inngest. Migration path is preserved by keeping the `run-job.js <name>` entrypoint pattern.

## Consequences

- **Easier:** new jobs are just a new YAML file + script. Bypassed Vercel timeout entirely. Free.
- **Harder:** debugging a failed run requires reading GH Actions logs. Adding non-cron triggers (e.g. "run job when user uploads inventory") is awkward — needs a webhook from app → GH `repository_dispatch`.
- **Revisit when:** we need to fire jobs from app code (e.g. instant inventory parse on Steam-connect), or jobs grow beyond simple cron.

## Action Items

1. [x] `run-job.js` entrypoint
2. [x] 3 workflows: catalog-sync, price-refresh, manual-job
3. [x] Secret rotation completed (May 10)
4. [ ] Add a `repository_dispatch`-triggered workflow when we need ad-hoc job runs from app code (deferred — YAGNI)
5. [ ] Add Sentry breadcrumbs in `run-job.js` for production error tracking (low priority)
6. [ ] Document on-call: where to look when a cron job fails (GH Actions → workflow run → step logs)

---

## Addendum (2026-05-12): GHA quota exhausted — needs migration

**Observation:** Within ~2 weeks of go-live, the arrijr account hit `100% of 2,000 Actions minutes` quota for the month. Resets 2026-06-01.

**Root-cause math we missed in the original ADR:**
- 4 daily chunks × ~3.3h each = 13.2h/day of compute
- × 30 days = 396h/month = **~24,000 min/month**
- 12× the free private-repo budget

The original ADR's "free at zero marginal cost" assumption was wrong because we underestimated the time-per-chunk (price-refresh on 4000 items × 3s spacing = 200 min, plus retries/backoffs).

### Mitigation options (deferred decision until budget resets June 1)

| Option | Cost | Effort | Risk |
|--------|------|--------|------|
| **Make repo public** | $0 | 1 click | Code exposed; secrets must rotate; public repos get unlimited Actions minutes |
| **Pay for Actions** | ~$24/mo at $0.008/min × 3000 min | 0 | Long-term cost compounds |
| **Migrate to Inngest free tier** | $0 (50k runs/mo) | Medium — SDK + workflow rewrite | New vendor dependency |
| **Migrate to Render Background Worker** | $7/mo | Medium — Dockerfile + deploy config | Vendor lock-in |
| **Self-host cron on a VPS** | $5/mo (Hetzner) | High — provisioning + monitoring | Single point of failure |
| **Reduce cadence to 1× daily full sweep at slower spacing** | Stays in budget | Low | Stale prices, but 24h staleness probably fine for catalog |

### Interim (May 12 → June 1)

- Local backfill runs ad-hoc when needed (`scripts/run-job.js price-refresh-chunk` from dev machine)
- No automated price refresh until either (a) quota reset or (b) migration

### Decision (2026-05-12, late afternoon): **Migrate to Inngest**

Rejected "make repo public" — we don't want the code exposed at this stage (pre-launch, multiple Pro features in active dev). Chose **Inngest free tier**.

**Why Inngest wins:**

- **50k runs/month free** — we project ~150 function-invocations/month (4 daily price-refresh + 30 catalog-sync + 720 hourly alerts ≈ 750/month). Massively under the cap.
- **Step-based execution** is the killer feature. Our 3.3h price-refresh job becomes ~200 atomic steps, each <30s. Each step runs as a separate Vercel function invocation, so we sidestep both the Vercel 60s limit AND the GHA 6h-per-job limit.
- **Built-in retries, replay, step inspector** — far better observability than tailing GH Actions logs.
- **No infrastructure burden** — no VPS, no Docker, no monitoring stack.
- **Migration path preserved** — `run-job.js <name>` entrypoint becomes the body of an Inngest function. Easy to swap.

**Tradeoffs accepted:**
- New vendor dependency (Inngest could change pricing). Mitigation: keep `run-job.js` runnable standalone so we can fall back to any cron host.
- Vercel function execution counts grow (each step = 1 invocation). At free-tier limit of 100k/day on Vercel Hobby, our ~800 steps/day is fine.

### Migration plan

1. Install `inngest` SDK in backend
2. Mount `/api/inngest` endpoint (serves all Inngest function handshakes + invocations)
3. Refactor each existing job (`runCatalogSync`, `runPriceRefresh`, `checkPriceAlerts`, `calculateAndStorePortfolioValues`) as an Inngest function with `step.run()` for atomic units
4. Set cron triggers via `inngest.createFunction({ cron: '0 3 * * *' })` — no more YAML
5. Keep GHA workflows in repo as code (they don't run anyway until quota resets), as a fallback option
6. User provides `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` env vars (Vercel + local .env)

### Action: implement Inngest migration

Code changes follow this ADR. Tracking: `docs/superpowers/plans/2026-05-12-inngest-migration.md` (TBD if plan grows large).
