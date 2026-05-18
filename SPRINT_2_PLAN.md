# Sprint 2 Plan: Creator Portfolio Tracker MVP

**Status**: Ready for Implementation 🚀  
**Created**: 2026-05-08  
**Sprint Owner**: Arthur (Solo)

---

## 📋 Sprint Overview

| Item | Value |
|------|-------|
| **Sprint Goal** | Build functional Portfolio Creation, Dashboard, and Price History features for Creator Tier MVP |
| **Duration** | 2 weeks (May 8-22, 2026) |
| **Team** | Arthur (40h/week, solo) |
| **Total Capacity** | ~80 story points (10 business days × 8h/day) |
| **Product Tier** | Creator Tier (€4,99/month) + Pro Tier (€19,99/month) research tools |

---

## 🎯 Sprint Goal (One Sentence)

**In Sprint 2 setzen wir die Foundation für die Creator Portfolio App: Benutzer können Skins tracken, Wertentwicklung sehen, und mit einfachen Research Tools arbeiten.**

### Success Criteria
- ✅ User kann mindestens 10 Skins zu Portfolio hinzufügen (UI fertig)
- ✅ Portfolio Dashboard zeigt Gesamtwert + historische Entwicklung
- ✅ Price History Chart für einzelne Skins (mit Trend-Linie)
- ✅ Stripe Integration testet Creator Tier (€4,99/Mo)
- ✅ Research Tools (Basic): Volatility % + Rarity Score auf Pro Tier
- ✅ Alle neuen Features haben Unit Tests (min. 30% coverage auf neue Code)
- ✅ Production-Ready: Keine console.errors, responsive Mobile/Desktop

---

## 📊 Capacity Planning

### Team Availability
| Resource | Hours/Week | Available Days | Notes |
|----------|-----------|----------------|-------|
| **Arthur** | 40h | 10 days (May 8-22) | Solo, keine PTO, keine External Meetings |
| **Total Sprint Capacity** | 80h | | Buffer: 20% (für Unvorhergesehenes) |
| **Available for Stories** | ~64h | | (80h - 16h buffer = 64h realistische Kapazität) |

### Velocity Assumption
- Basierend auf Sprint 1 (API fertig, Tests fertig): ~8-10 story points/day
- **Conservative Estimate**: 64h @ 8pt/h = **64 story points für Sprint 2**

---

## 🔢 Story Breakdown & Estimates

### P0 - MUST SHIP (Critical Path)

#### 1. **Portfolio Creation UI** | 16 pts | Week 1
Benutzer können Skins zu einem Portfolio hinzufügen, die App speichert sie.

**Subtasks:**
- [ ] React Component: `<PortfolioSelector>` (Skin Search + Add Button) | 4pts
- [ ] API Endpoint: `POST /api/v1/portfolios/:id/items` (Auth required) | 4pts
- [ ] Database Seeding: Test data für 10 sample skins | 2pts
- [ ] Error Handling: Duplicate skins, Rate limits, Invalid skins | 3pts
- [ ] Unit Tests: Portfolio creation flow | 3pts

**Acceptance Criteria:**
- User kann 10 verschiedene Skins zu Portfolio hinzufügen
- Duplikate werden verhindert
- Fehlermeldungen sind verständlich
- API ist authenticated (Clerk JWT)

**Dependencies:** Clerk Auth (✅ from Sprint 1), Skins Datenbank (✅ seeded)

---

#### 2. **Portfolio Dashboard** | 18 pts | Week 1-2
Zeige Gesamtwert, Einzelpositionen, Gewinn/Verlust.

**Subtasks:**
- [ ] React Component: `<PortfolioDashboard>` (Grid Layout mit Metriken) | 5pts
- [ ] API Endpoint: `GET /api/v1/portfolios/:id/summary` (aktuelle Preise + Wert) | 4pts
- [ ] Realtime Price Updates: Fetch aktuelle Preise vom Steam Market | 4pts
- [ ] Calculations: Gesamtwert, Gewinn/Verlust, % Change | 3pts
- [ ] Mobile Responsive: Breakpoints für Tablet/Phone | 2pts

**Acceptance Criteria:**
- Dashboard zeigt: Gesamt Portfoliowert, Einzelne Skin-Werte, Gewinn/Verlust in €, % Change
- Responsive auf Mobile, Tablet, Desktop
- Keine Rechenfehler bei €-Umrechnung
- Preis-Updates sind <5s verzögert

**Dependencies:** Portfolio Creation (1.), Skins + Price History (✅ Sprint 1)

---

#### 3. **Price History & Charts** | 14 pts | Week 1-2
Zeige Preistrends für Skins mit einfachen Charts.

**Subtasks:**
- [ ] React Chart Component (Chart.js): Line chart mit 30-Tage Historie | 5pts
- [ ] API Endpoint: `GET /api/v1/skins/:id/price-history` (aggregierte Daten) | 3pts
- [ ] Frontend: Skin detail view mit Chart (Modal oder Page) | 4pts
- [ ] Trend Line: Berechne 7-Tage Moving Average | 2pts

**Acceptance Criteria:**
- Chart zeigt 30 Tage Preisentwicklung
- Trend-Linie ist sichtbar
- X-Achse zeigt Daten, Y-Achse zeigt €-Preis
- Mobile: Chart ist scrollbar und lesbar

**Dependencies:** Price History Daten (✅ Sprint 1 seeded), Chart.js Library (✅ verfügbar)

---

#### 4. **Stripe Integration für Creator Tier** | 16 pts | Week 2
Benutzer können Creator Tier (€4,99/Mo) abonnieren.

**Subtasks:**
- [ ] React Component: `<UpgradeModal>` mit Stripe Checkout | 4pts
- [ ] Stripe API: Create Subscription (Clerk User → Stripe Customer) | 5pts
- [ ] Webhook Handler: subscription.updated + subscription.deleted | 4pts
- [ ] Database: user_subscriptions Tabelle (für Tier-Tracking) | 2pts
- [ ] Access Control: Creator-only features wenn subscription aktiv | 1pt

**Acceptance Criteria:**
- User kann auf "Upgrade to Creator" Button klicken
- Stripe Checkout öffnet (Test Mode)
- Nach Bezahlung: Creator Tier aktiv in der App
- Webhook verarbeitet subscription.canceled (Tier wird downgraded)

**Dependencies:** Stripe Keys (✅ Sprint 1), Clerk Auth (✅ Sprint 1)

---

#### 5. **Research Tools - Basic** (Pro Tier) | 12 pts | Week 2
Simple Research Features: Volatility %, Rarity Score (heuristics-based).

**Subtasks:**
- [ ] Backend: Volatility Calculator (std dev der letzten 30 Tage Preise) | 4pts
- [ ] Backend: Rarity Heuristic (z.B. basierend auf Condition / Drop % from CSGO) | 3pts
- [ ] React Component: `<ResearchPanel>` (Pro-Tier-only) | 3pts
- [ ] UI: Conditionally show Pro features (Stripe subscription check) | 2pts

**Acceptance Criteria:**
- Volatility % ist korrekt berechnet
- Rarity Score basiert auf nachvollziehbaren Heuristiken (nicht KI)
- Pro Tier users sehen Research Panel
- Free/Creator users sehen "Upgrade to Pro" CTA

**Dependencies:** Price History (3.), Stripe Subscription Logic (4.)

---

### P1 - SHOULD SHIP (High Priority, Falls Zeit bleibt)

#### 6. **Improved Error Handling & Edge Cases** | 8 pts
Robustheit: Netzwerkfehler, Rate Limits, Timeout Recovery.

- Exponential Backoff für API retries
- User-facing Error Messages (nicht generisch "Error")
- Offline Mode: Zeige cached portfolio data

**Dependencies:** All P0 features

---

#### 7. **Enhanced Testing** | 8 pts
Für Production Confidence: Integration Tests + E2E für kritische Flows.

- Portfolio Creation Flow (E2E)
- Subscription Flow (E2E mit Stripe Test Mode)
- Price Updates unter Load (Integration Test)

**Dependencies:** All P0 features

---

### P2 - STRETCH GOALS (Time Permitting)

#### 8. **Push Notifications** | 8 pts
Alert user wenn Skin price sich um 10%+ ändert.

#### 9. **Email Alerts** | 6 pts
Daily portfolio summary email.

#### 10. **Portfolio Comparison** | 6 pts
Vergleiche dein Portfolio mit Markt-Average (wenn genug user data vorhanden).

#### 11. **Export to CSV** | 4 pts
Download Portfolio als CSV (für Creator Videos/Streams).

---

## 📅 Sprint Schedule

### Week 1 (May 8-12)
**Goal**: Foundation Features fertig (Portfolio Creation, Dashboard Basics)

| Day | Task | Est. | Status |
|-----|------|------|--------|
| Wed 5/8 | Setup Database (if needed), Feature branches | 2h | TODO |
| Wed 5/8 | Portfolio Creation UI + API (Feature 1) | 8h | TODO |
| Thu 5/9 | Portfolio Creation Testing + refinements | 4h | TODO |
| Thu 5/9 | Portfolio Dashboard MVP (Feature 2, Part 1) | 4h | TODO |
| Fri 5/10 | Portfolio Dashboard finalisieren | 4h | TODO |
| Fri 5/10 | Price History Chart Implementation (Feature 3, Part 1) | 4h | TODO |
| Mon 5/13 | Price History finalisieren + Mobile Polish | 4h | TODO |
| Tue 5/14 | Testing & Bug Fixes für Features 1-3 | 6h | TODO |

**Week 1 Target**: 40h capacity, Features 1-3 MVP Done ✅

---

### Week 2 (May 15-22)
**Goal**: Monetization (Stripe) + Research Tools + Production-Ready

| Day | Task | Est. | Status |
|-----|------|------|--------|
| Wed 5/15 | Stripe Integration Design + Setup (Feature 4, Part 1) | 6h | TODO |
| Wed 5/15 | Stripe Checkout UI + API | 6h | TODO |
| Thu 5/16 | Stripe Webhook Handler + Testing | 4h | TODO |
| Thu 5/16 | Research Tools Backend (Volatility, Rarity) (Feature 5, Part 1) | 4h | TODO |
| Fri 5/17 | Research Tools UI + Tier Gating (Feature 5, Part 2) | 4h | TODO |
| Mon 5/20 | Integration Testing + Error Handling (Feature 6) | 4h | TODO |
| Tue 5/21 | E2E Testing: Critical Flows | 4h | TODO |
| Wed 5/22 | Polish, Bug Fixes, Production Readiness Check | 4h | TODO |

**Week 2 Target**: 40h capacity, Features 4-5 Done + Testing ✅, Stretch: P2 features

---

## 📊 Sprint Backlog Summary

| Feature | Story Points | Owner | Priority | Week |
|---------|-------------|-------|----------|------|
| 1. Portfolio Creation | 16 | Arthur | P0 | W1 |
| 2. Portfolio Dashboard | 18 | Arthur | P0 | W1-2 |
| 3. Price History Charts | 14 | Arthur | P0 | W1-2 |
| 4. Stripe Integration | 16 | Arthur | P0 | W2 |
| 5. Research Tools | 12 | Arthur | P0 | W2 |
| 6. Error Handling | 8 | Arthur | P1 | W2 |
| 7. Enhanced Testing | 8 | Arthur | P1 | W2 |
| **P0 Total** | **76 pts** | | | |
| **P1 Total** | **16 pts** | | | |
| **Stretch Goals** | **24 pts** | | | |
| **Available Capacity** | **64 pts** | | | |

**Verdict**: P0 (76pts) > Capacity (64pts) → **Need to descope or extend sprint**. 
**Recommendation**: Move Feature 5 (Research Tools) to "P1 / Week 2 if time" status.

---

## ⚠️ Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Stripe API Complexity** (webhook edge cases, test mode) | Medium | High | Start early (W2 start), test webhook locally with Stripe CLI before deploying |
| **React Chart Library Issues** (Chart.js responsiveness) | Low | Medium | Verify Chart.js mobile rendering before W1 end; have fallback (simple SVG chart) |
| **Database Migrations** (if needed for subscriptions) | Low | Medium | Assume no schema changes initially (just use existing); if needed, do before W2 start |
| **Performance** (fetching 10 skins + price history at once) | Medium | Medium | Optimize queries (indexed on skin_id + created_at), paginate if >100 items |
| **Scope Creep** (user asks for research features earlier) | High | Medium | Stick to P0 first; document scope in JIRA/GitHub Issues, defer nice-to-haves to Sprint 3 |
| **Solo burnout** (40h/week might be ambitious) | Medium | High | Build in daily 15min breaks; stop by 5pm; if stuck >1h, drop P2 features; re-plan mid-sprint if needed |

---

## 🏁 Definition of Done

A feature is **Done** when:

- [ ] **Code**: All subtasks merged to `main` via PR (code review completed)
- [ ] **Tests**: Unit tests for business logic (min. 30% coverage on new code); Integration tests for critical paths
- [ ] **Deployment**: Merged code auto-deploys to staging environment (Vercel preview)
- [ ] **Manual QA**: Arthur tested on Desktop + Mobile; all happy paths work
- [ ] **Docs**: Updated CLAUDE.md + added comments to complex logic
- [ ] **Performance**: API response time <500ms; no N+1 queries; Charts load <2s
- [ ] **Errors**: No console.errors, no unhandled promise rejections
- [ ] **Product Sign-off**: Feature matches acceptance criteria from Story

---

## 📈 Metrics & Success Tracking

### Sprint Metrics (Track Daily)
- **Burndown Chart**: Remaining story points vs. time
- **Velocity**: pts completed per day
- **Bug Escape Rate**: Bugs found in testing / total pts shipped

### Feature Metrics (After Launch)
- **Adoption**: % of free users upgrading to Creator Tier
- **Engagement**: Avg skins per portfolio, daily active users
- **Churn**: % of Creator subscribers canceling after 1 month
- **Error Rate**: % of API requests returning 5xx

---

## 🔗 Dependencies & Blockers

### No External Dependencies
- ✅ Clerk Auth (implemented Sprint 1)
- ✅ Stripe Keys (configured Sprint 1)
- ✅ Price History Data (seeded Sprint 1)
- ✅ React + Chart.js (already in stack)

### Internal Blockers
- None identified (assuming no DB migrations needed)

---

## 🧠 Key Decisions for Sprint 2

1. **No KI-Research Tools in MVP** → Simple heuristics only (volatility %, rarity score based on CSGO data)
2. **No Real-time WebSocket Price Updates** → REST polling is sufficient for MVP
3. **Single Portfolio per User** → Multi-portfolio is Sprint 3+
4. **Test Mode Stripe** → Use Stripe Test API; Production keys stay safe
5. **Mobile-First Design** → Content creators watch on phone/tablets; responsive is critical

---

## 📞 Next Steps (After Sprint Planning)

1. **Create GitHub Issues** from this plan (one per feature)
2. **Assign labels**: `sprint-2`, `portfolio-creation`, `stripe`, etc.
3. **Set milestones**: Due date = May 22, 2026
4. **Branch strategy**: `feature/portfolio-creation`, `feature/stripe-integration`, etc.
5. **Daily standup** (optional solo, but log progress)
6. **Mid-sprint check-in** (May 15): Are we on track?

---

## 💡 Recommendations for Execution

### Code Structure
```
src/
  features/
    portfolio/
      Portfolio.tsx         (Dashboard)
      PortfolioCreate.tsx   (Add skins)
      PriceHistory.tsx      (Charts)
      research/
        ResearchPanel.tsx   (Pro tier only)
    subscription/
      UpgradeModal.tsx      (Stripe)
      useSubscription.ts    (Hook for checking tier)
  api/
    portfolio.ts           (API client)
    stripe.ts              (Subscription API)
```

### Testing Strategy
- Unit tests: Business logic (calculations, validations)
- Integration tests: API + DB interactions
- E2E tests: Critical user flows (Create Portfolio → Upgrade → View)

### Deployment Milestones
- **Fri 5/10 EOD**: Features 1-3 in staging
- **Wed 5/15 EOD**: Features 1-4 in staging
- **Wed 5/22 EOD**: All P0 features + tests in production

---

## 📝 Notes for Future Sprints

**Sprint 3 Candidates:**
- Multi-portfolio support (Casual users want separate portfolios per goal)
- Advanced Research Tools (KI-powered anomaly detection, trending signals)
- Community Features (compare portfolio with friends, leaderboards)
- Mobile App (React Native version)

**Technical Debt to Address:**
- Database indexing optimization (if query performance degrades)
- Monitoring/Logging (Sentry integration for production errors)
- Load testing (simulate 1000 concurrent users)

---

**Sprint Owner**: Arthur  
**Last Updated**: 2026-05-08  
**Status**: Ready for Kickoff 🚀
