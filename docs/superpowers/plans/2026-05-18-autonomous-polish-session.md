# Autonomous Polish Session — 2026-05-18 (evening)

> User went offline. This plan documents what I (Claude) will do solo while they're away. Conservative scope, no pushes to prod, commits stay local for user to push when back.

## Goal

Bring CS2 Skin Tracker as close to production-quality as I can without making decisions that need user input. Focus on items already discussed + decided.

## Inputs

- `docs/superpowers/plans/2026-05-18-profile-settings-production-ready.md` (Phase 1 done, Phase 2 partial)
- `CLAUDE.md` tracker section (Profile/Settings + Tech Debt + Discord deprecation)
- Open Phase 2 follow-ups: `/subscriptions/reactivate` endpoint, `/portfolio/export?format=csv` endpoint
- Open Phase 3+ items: MFA, Sessions, Avatar, Audit log surface, public profile
- Onboarding flow (queued as next bucket, never started)
- Discord cleanup (decided to drop, not started)
- Known portfolio bug: `getPortfolioSummary` doesn't aggregate by skinId

## Scope decisions

### IN (will do tonight)

| # | Item | Why |
|---|---|---|
| A | Onboarding flow (`/onboarding` page already scaffolded) | Pre-launch broken funnel; high value |
| B | Backend endpoints: `POST /subscriptions/reactivate` + `GET /portfolio/export?format=csv` | UI already there, just needs backend |
| C | Discord cleanup (schema migration + alertEngine + Alert.channels validator) | User decided to drop; safer to clean now |
| D | `getPortfolioSummary` skinId aggregation bug | Known tech debt; correctness issue |
| E | Clerk `<UserProfile />` integration in `/profile?tab=security` for MFA + Sessions + Avatar + Email management | Single component covers 4 features |
| F | Mobile responsiveness verification (visual scan + fixes for obvious breaks) | Production must work on mobile |

### OUT (deferred — needs user input or too big)

- Light theme (~1 day of work, scope decision needed: full theme system vs CSS variables)
- Public profile page (product decision: social features? privacy defaults?)
- Audit log UI surface (backend has AuditLog table, but format/filters need spec)
- Playwright test fixtures (Clerk test accounts setup; out of scope)
- Stripe live keys swap (prod-only, user controls)
- Removing `DEV_TEST_TOKEN` from prod env groups (user controls)

### NOT GOING TO TOUCH

- Anything in `backend/.env` (local secrets)
- Anything in Render env groups (production secrets)
- `git push` to main (user pushes when back)
- Database migrations on PROD without explicit task being safe (CASCADE drops on Discord column might be wide-impact — will check schema first)

## Execution waves

### Wave 1 (parallel, ~15 min)

Three agents in parallel — no shared files:

1. **Onboarding** — implement `/onboarding/page.tsx` content + redirect from signup; add to ProfileDropdown + AppHeader; design-system consistent.
2. **Backend endpoints** — implement reactivate + CSV export, wire to existing frontend buttons in BillingTab.
3. **Discord cleanup** — remove `discordWebhook` from User schema (migration), strip `discord` branch from alertEngine, update `VALID_CHANNELS`, remove any leftover frontend references.

### Wave 2 (after Wave 1 lands cleanly, ~10 min)

Two agents in parallel:

4. **Portfolio aggregation fix** — `getPortfolioSummary` should aggregate by skinId (multiple purchases of same skin = one line).
5. **Clerk `<UserProfile />` integration** — slot into Security tab. Removes the "Manage password" link (UserProfile covers password + MFA + sessions + email).

### Wave 3 (~10 min)

6. **Mobile responsiveness pass** — scan `/`, `/dashboard`, `/skins`, `/portfolio`, `/profile`, `/alerts`, `/items`. Fix obvious breaks: overflow, stacking, font sizes, touch targets.

### Wave 4 (~15 min)

7. **Review agent** — comprehensive review covering:
   - Functional: every changed endpoint + UI works end-to-end
   - UX: navigation flows, empty states, loading states, error toasts
   - Security: every new endpoint has auth, no field leaks, no injection vectors
   - Performance: no obvious N+1 queries in new code
   - Documentation: CLAUDE.md tracker updated, plan files referenced

### Final

- Update CLAUDE.md tracker with everything done
- Commit all changes (multiple semantic commits, not one big blob)
- Leave a "what to push" note for user
- Don't push

## Safety rails

- Each agent is given a strict "DON'T" list (no servers, no installs, no pushes, no schema changes outside the migration in their scope)
- Migrations get hand-written SQL files, applied to Supabase via MCP only after I read+verify the SQL
- Stop on any agent report with ⚠️ or ❌ status — re-evaluate before next wave
- All changes documented in CLAUDE.md tracker as we go

## What user sees when back

- CLAUDE.md summarizes everything new
- A "Ready to push" list at the bottom of CLAUDE.md (commits made, not pushed)
- One paragraph in this plan file's "Final Report" section (added at end) describing what shipped + what's still open
- No surprise behavior changes; production unchanged (no push)
