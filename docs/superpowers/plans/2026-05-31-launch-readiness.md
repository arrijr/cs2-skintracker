---
date: 2026-05-31
type: plan
status: ready-to-execute
owner: Arthur (CEO) + Claude
tags: [plan, launch, revenue, security, polish]
---

# Launch-Readiness Plan — 2026-05-31

> Vollständige Abarbeitungsliste, sortiert nach **Launch-Impact**. Erstellt vormittags,
> Ausführung ab ~14:00. Cron-Verifikation (09:30 UTC PriceHistory-Sprung) läuft separat.
> Verwandt: [[2026-05-30-price-pipeline-fix]], [[06-Tech-Debt]], CEO-Checklist
> `docs/superpowers/research/2026-05-20-ceo-checklist.md`.
>
> **Legende:** 🧑 = CEO-Aktion (Dashboard/Credentials) · 🤖 = Claude autonom · ⏱ = grobe Zeit

---

## ✅ Heute schon erledigt (Kontext)
- Backend-Boot-Crash (doppelter `crypto`-Import) gefixt → `9760061`, Deploy `success`.
- Render Free → **Starter** (always-on) — Cold-Starts weg, Inngest-Cron läuft jetzt durch.
- pg_cron Daily-Snapshot aktiv (jobid 1+2). 147 populäre Wear-Skins frisch, Dupes genullt.
- GH-Actions price-refresh entfernt (redundant).

## ⏳ Offene Verifikation (passiv)
- [ ] Nach 09:30 UTC Cron: PriceHistory heute springt ~700 → ~2000+ (End-to-End-Beweis). 🤖

---

## 🔴 Tier 0 — Revenue-Blocker (ohne das kein Geld)

### T0.1 — Email-Versand reparieren ⏱15-40min
**Problem:** Alerts feuern, aber `EMAIL_USER`/`EMAIL_PASS` fehlen in Render → keine Mail kommt an. Kernfeature tot.
**Zwei Wege:**
- (a) 🧑 Gmail App-Passwort erstellen → Render env `EMAIL_USER` + `EMAIL_PASS`. Schnell, aber Gmail-SMTP ist fragil/deprecated.
- (b) 🤖 **Resend-Migration** (empfohlen, CEO-Checklist §6): `emailService.js` von nodemailer auf Resend-SDK umstellen. 🧑 braucht nur Resend-API-Key + verifizierte Domain.
**Files:** `backend/src/services/emailService.js` (schon lazy-init).
**Verify:** Test-Alert auslösen → Mail kommt an.

### T0.2 — Stripe Live ⏱30-45min
**Problem:** Test-Mode → niemand kann real zahlen.
- 🧑 Stripe Live-Dashboard: 4 Produkte/Preise erstellen (Lite Monthly/Annual, Pro Monthly/Annual) → Price-IDs kopieren.
- 🧑 Vercel env: `STRIPE_PRICE_{LITE,PRO}_{MONTHLY,ANNUAL}` + `STRIPE_SECRET_KEY` (live) + Webhook-Secret.
- 🧑 Stripe-Webhook auf prod-URL registrieren.
- 🤖 Wiring verifizieren, Test-Checkout durchspielen.
**Ref:** CEO-Checklist §4.

### T0.3 — Clerk Live-Keys ⏱15min
- 🧑 Clerk-Dashboard → Production-Instance → `pk_live_` / `sk_live_` → Vercel env.
- 🧑 `CLERK_AUDIENCE` auf prod-Wert (`cs2-skintracker-api`).
- 🤖 Verifizieren dass authed Requests durchgehen (JWT-Template-Audience matcht).
**Ref:** CEO-Checklist §5.

---

## 🟠 Tier 1 — Launch-Glaubwürdigkeit

### T1.1 — researchService Crash für Pro-User ⏱20min 🤖
**Problem:** `getPortfolioResearch` referenziert `prisma.userSubscriptions` — Modell existiert NICHT → Runtime-Error für genau die zahlenden Pro-User.
**Files:** `backend/src/services/researchService.js`. Fix: echte Tier-Quelle nutzen (`User.tier` / subscriptionService), nicht das Phantom-Modell.
**Verify:** Pro-User Research-Endpoint → 200 statt 500.

### T1.2 — Security Must-Fixes (5) ⏱~1h 🤖
- [ ] CORS: `app.js` `callback(null, true)` → echte Allowlist (Whitelist ist aktuell dekorativ).
- [ ] Clerk-Audience-Validierung wieder aktivieren (`verifyClerkJwt.js` ~Z.96 auskommentiert).
- [ ] `DEV_TEST_TOKEN` + `DEV_FREE_TOKEN` aus jedem prod-Pfad raus (nur Tests).
- [ ] `NODE_TLS_REJECT_UNAUTHORIZED=0` sicherstellen dass NICHT in Render/Vercel-prod gesetzt.
- [ ] (5.) CORS-Origins final gegen die echten Domains.
**Ref:** [[06-Tech-Debt]] 🔴-Sektion.

### T1.3 — Polish-Queue (Agent-C Findings) ⏱2-3h 🤖
- [ ] **AppShell konsolidieren** — `/pricing`, `/cases/[slug]`, `/skins/[weapon]/[slug]` umgehen AppShell → inkonsistentes Chrome. Optional `variant="marketing"` einführen.
- [ ] **Brand-Gradient vereinheitlichen** — Landing nutzt `purple→pink`, Rest `fuchsia→pink`. Auf fuchsia standardisieren.
- [ ] **Stale Copy** — "Coming Month 2/3" in `FeaturesSection.tsx` + "coming Sprint 2" in `pricing/page.tsx` → entfernen (ist live).
- [ ] **/alerts Empty-State CTA** — `EmptyState` ohne primaryCta → inline "Create alert" Button.
- [ ] **/items Suspense-Skeleton** in AppShell wrappen (Layout-Shift).
- [ ] **Dashboard `any`-Casts** typen (`page.tsx` `(kpis as any)`).
- [ ] **Local RARITY_STYLES** → `design-tokens.ts` (zwei Quellen).
- [ ] **Portfolio Pro-Banner** 10s-Auto-Dismiss entfernen.
**Ref:** Agent-C Audit (diese Session).

---

## 🟡 Tier 2 — Wachstum (post-launch)

- [ ] **Preis-Vollständigkeit** beobachten — Inngest füllt liquide Teilmenge über Tage. Passiv. 🤖
- [ ] **SEO finalisieren** — Sitemap → Google Search Console + Bing; `NEXT_PUBLIC_SITE_URL` in Vercel (prod+preview). 🧑+🤖. Ref CEO-Checklist §3.7/§8.
- [ ] **11 HIGH + 11 MEDIUM Security-Findings** abarbeiten (22.05.-Audit, Obsidian). 🤖 multi-session.
- [ ] **PostHog + Sentry** — SDKs drin, nur DSN fehlt. 🧑 Signup → DSN in Vercel. Ref §-Checklist.
- [ ] **Skinport/CSFloat Partner-Codes** (Affiliate-Revenue) — optional. 🧑

---

## ⚪ Tier 3 — Hygiene

- [ ] Feature-Branch `chore/obsidian-vault-cleanup` → main mergen (Docs + Vault-Struktur). 🤖 PR.
- [ ] **Schema-Drift** — `APIKey`/`APILog` fehlen im Prisma-Schema; `MarketSnapshot` createdAt/updatedAt; `Skin.slug` UNIQUE. Eigene Migration-Session. 🤖. Ref [[06-Tech-Debt]] #11.
- [ ] **Stray gitlink** `.claude/worktrees/cranky-wilson-bb64cf` → `git rm --cached`. ⏱2min 🤖
- [ ] **`isPremium` Two-Sources-of-Truth** — Dashboard liest Clerk-metadata, Hook liest DB. Auf DB vereinheitlichen. 🤖
- [ ] **`req.auth?.userId` vs `req.userId`** Inkonsistenz über Controller vereinheitlichen. 🤖

---

## Empfohlene Reihenfolge (14:00-Session)
1. **Cron-Verifikation** (ich hab's bis dahin gecheckt — Ergebnis liegt bereit).
2. **T1.1 researchService** (20min, klarer Crash-Fix, 🤖 sofort machbar ohne CEO).
3. **T0.1 Email** (Resend-Migration 🤖, du gibst nur den API-Key).
4. **T1.2 Security** (🤖, ~1h, macht launch-sicher).
5. Dann **T0.2/T0.3 Stripe+Clerk Live** (brauchen dich am Dashboard) ODER **T1.3 Polish** (🤖 solo).

**Was ich autonom vorziehen KANN während du weg bist** (zero CEO-dependency, low-risk):
T1.1 (researchService), T1.2 (Security), T3 stray-gitlink + branch-merge, Teile von T1.3 Polish.
→ Sag "mach autonom" und ich räum das weg bis 14:00. Sonst liegt alles bereit zum gemeinsamen Abarbeiten.
