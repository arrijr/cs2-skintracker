# CS2 Skin Tracker — Produktstrategie & 3-Monats-Plan

**Datum**: 2026-05-10  
**Status**: Spec — wartet auf Review  
**Owner**: Arthur  
**Domain**: skintrackr.com

---

## 1. Vision & Positionierung

**Ein-Satz-Pitch:** "The Robinhood for CS2 Investors" — investor-grade Portfolio-Tracking + Smart Alerts für ernsthafte Trader und Investoren.

**Tagline (DE/EN):** "Track. Analyze. Profit." / "Verfolge. Analysiere. Profitiere."

**Differenzierung gegen Markt:** Alle existierenden Tools sind entweder
- Free + cluttered (Pricempire, SteamLedger),
- Free + simpel (SkinFolio, Steamfolio), oder
- content-getrieben (SteamAnalyst, EsportFire).

**Niemand bietet eine fokussierte, polierte, premium Investor-UX.** Das ist unsere Lücke.

**Strategische Ziele:**
- Geschäftsmodell: **Lifestyle / Side-Project** (Option A) mit optionalem Übergang in **Bootstrapped Business** (Option B), wenn Traction sich zeigt
- Optimierung: niedrige Fixkosten, profitabel, kein Growth-um-jeden-Preis
- Realistisches Y1-Ziel: **1.000 Free-User in 30 Tagen, 50 zahlende User, ~250€ MRR Monat 2**, ~1.500€ MRR Ende Jahr 1

---

## 2. Zielgruppen

| Persona | Größe | Strategie |
|---------|-------|-----------|
| **Casual Collector** (10-50 Skins) | 70% der Free-User | Auto-akquiriert via Free-Tier. Phase 2 Affiliate-Monetarisierung. Niedrige Conversion zu Paid. |
| **Serious Trader** (Portfolio 1-10k€) | Hauptzielgruppe | Lite-Tier (4,99€). Core-Battle gegen SteamLedger/Pricempire. Volumen + brauchbare Conversion. |
| **Pro Investor** (Portfolio 10k+€) | Kleinste Gruppe, höchste LTV | Pro-Tier (19,99€). Tax-Export, Multi-Portfolio, Smart Alerts — niemand bedient sie sauber. **Größte ungenutzte Lücke im Markt.** |
| **Content Creator** | Klein, später | Phase 3 — eigenes Persona-Tier mit Showcase-Tools |

---

## 3. Monetarisierung

### Streams (3-Monats-Fokus = nur Stream 1)

| Stream | Anteil Y1 (Schätzung) | Phase |
|--------|----------------------|-------|
| **Abonnements** (Lite/Pro) | 60% | **Phase 1: jetzt** ✅ |
| **Affiliate** (DMarket 20%, Skinport BD) | 30% | **Phase 2: Monat 4-6 (deferred)** |
| **API/B2B** | 10% | Phase 3+ |

### Pricing (locked)

| Tier | Preis | Stripe Price ID |
|------|-------|----------------|
| Free | 0€ | — |
| **Lite** | 4,99€/Monat | `price_1TUlNwAfapl1SDUrKYSVYrm9` ✅ |
| **Pro** | 19,99€/Monat | `price_1TTkJIAfapl1SDUrKg1Nb06O` ✅ |
| Trader (Phase 2) | 39€/Monat | TBD |

### Affiliate (deferred)

Nicht in den ersten 3 Monaten. Wird Phase 2 sobald Traction da ist:
- DMarket: öffentliches 20%-Programm, plug-and-play
- Skinport: BD-Outreach erforderlich
- CS.MONEY: B2B-Partnership FAQ vorhanden

---

## 4. Feature-Roadmap (3 Monate)

### Monat 1 — Foundation & Launch (jetzt + 4 Wochen)

**Ziel:** Production-ready, polished, launchable.

- [x] Sprint 2 abgeschlossen
- [ ] Domain `skintrackr.com` registrieren via Vercel
- [ ] **isPremium Bug fix** (DB statt Clerk metadata — Single Source of Truth)
- [ ] **researchService Bug fix** (`prisma.userSubscriptions` Crash für Pro-User)
- [ ] **Clerk Audience-Validierung** wieder aktivieren (`verifyClerkJwt.js`)
- [ ] **Clerk Live-Keys** in Vercel setzen (Test → Live)
- [ ] **Landing Page** (conversion-optimiert) auf `/` mit:
  - Klarer "Robinhood for CS2" Pitch
  - 3-Tier Pricing-Section (re-use `/pricing` Page-Komponenten)
  - Social Proof Section (initial leer, füllt sich nach Launch)
  - Single CTA: "Start Free"
- [ ] **Design-System vereinheitlichen** (siehe Sektion 5)
- [ ] Tech-Debt aus Audit beheben (CORS-Whitelist enforce, DEV-Tokens raus, NODE_TLS_REJECT_UNAUTHORIZED weg)
- [ ] **Soft Launch**: Reddit r/GlobalOffensive, r/csgomarketforum, ausgewählte Discords

### Monat 2 — Killer Feature: Smart Alerts Engine

**Ziel:** Das Feature das uns von SteamLedger, Pricempire, SkinFolio differenziert.

Die Konkurrenz hat nur statische Preis-Schwellen-Alerts. Wir bauen:

- [ ] **Volatilitäts-Alerts** — "Skin X bewegt sich >5% in 24h"
- [ ] **Float-Tier Alerts** — "Rare Float (FN, < 0.01) gerade gelistet"
- [ ] **Case-EV Inversions** — "Case wird billiger als Drop-EV"
- [ ] **Sticker-Combo Detection** — Phase 2.5 (Stretch)
- [ ] **Discord Bot** — Pro-User können Bot zu Server adden, bekommen Alerts dort
- [ ] **Email-Alerts** — alle Tiers (Conversion-Hook für Free-User)
- [ ] **Telegram Bot** — Stretch, sonst Phase 3

### Monat 3 — Investor Features (Pro-Tier Lock-in)

**Ziel:** Pro-Tier so wertvoll machen, dass 19,99€/Monat ein No-Brainer ist.

- [ ] **Realized P&L Tracking** — User trägt Verkäufe ein, System errechnet Gewinn/Verlust
- [ ] **Tax-Export** — FIFO/LIFO Cost Basis, CSV-Export, deutscher Capital-Gains-Style
- [ ] **Multi-Portfolio** — Trader können getrennte Portfolios verwalten (z.B. eigenes vs. für Freunde)
- [ ] **Investor-Metriken** auf Dashboard:
  - Sharpe Ratio
  - Drawdown
  - Allocation Pie (nach Wear, Rarity, Collection)
  - Beta vs. Market-Cap-Index
- [ ] **AI Market Thesis (basic)** — "Warum bewegt sich Skin X?" mit Korrelation zu CS2-Operations und Major-Tournaments
- [ ] **PWA Setup** — Mobile-Home-Screen Widget (großer Gap im Markt)

---

## 5. Design System

### Aktueller Zustand
Inkonsistent — Sprint 1 und Sprint 2 nutzen unterschiedliche Card-Styles, Farb-Tokens, Komponenten. Beispiele:
- Landing Page: brand-celadon / brand-slate Tokens
- Dashboard: slate-900 + indigo
- Pricing-Page: slate-950 + purple/pink Gradient
- Portfolio: gemischt

### Ziel-Aesthetic: "Dark Investment Tool"

Inspiration: Robinhood Dark Mode, Trading 212, Snowball Analytics.

**Token-Set:**
- **Background:** `slate-950` base, `slate-900/60` Cards mit `backdrop-blur`
- **Primär-Akzent:** Purple/Pink Gradient (`from-purple-500 to-pink-500`) für Premium / CTA
- **Sekundär-Akzent:** Amber/Orange (`from-amber-500 to-orange-500`) für Lite-Tier / Warnungen
- **Gains/Losses:** Green-400 / Red-400 (Trading-Standard)
- **Typo:** Inter oder Geist (Trading-UI Standard)
- **Border:** `slate-700/50` mit Hover `slate-600`

**Komponenten-Library:** Shadcn/Radix bleibt Basis. Custom Komponenten werden gebaut auf einheitlichem Token-Set:
- `KPICard` (Wert + Delta + Sparkline)
- `ChartCard` (Card-Wrapper für Charts)
- `AlertCard` (Alert-Konfiguration mit Schwellwerten)
- `TierBadge` (Free/Lite/Pro/aktiv-Indicator)

### Aufgabe
**1-Tag Design-System-Sprint** in Monat 1: Alle Pages auf einheitlichen Token-Set umstellen. Audit existierende Komponenten, Konsolidierung in `components/ui/` und `components/cards/`.

---

## 6. Launch-Strategie

### Soft Launch (Ende Monat 1)

**Plattformen:**
- **Reddit** r/GlobalOffensive (3.4M Subs) — Show-and-Tell Post mit Demo-GIF
- **Reddit** r/csgomarketforum (kleiner aber Trader-Community)
- **Discords**: Skinport Discord, ausgewählte CS2-Trader-Discords (organisch, kein Spam)
- **Hacker News** Show HN — bringt Tech-affine User + Backlinks
- **Twitter/X** CS2-Trading-Community

**Content für Launch:**
- 60-Sekunden Demo-Video (Portfolio anlegen → KPIs → Premium-Features)
- "Why I built skintrackr.com" Reddit-Post (founder-style, nicht corporate)
- Screenshots der Pricing-Page

### Content-Strategie (Monat 2+)

**SEO-Blog** mit Long-tail Keywords die Konkurrenz dominiert:
- "Best CS2 Skins to Invest in 2026"
- "How to Track Your CS2 Portfolio for Tax"
- "CS2 Skin Volatility Analysis Tutorial"
- "AK-47 Redline Investment Case Study"

Ziel: SteamAnalyst-Traffic abgreifen mit besserem, aktuellerem Content.

---

## 7. KPIs & Erfolg

### 30-Tage-Ziele (nach Launch)
- 1.000 Free-User
- 50 zahlende User (5% Conversion)
- ~250€ MRR
- 5+ organische Reddit-Mentions

### 90-Tage-Ziele
- 5.000 Free-User
- 200 zahlende User
- ~1.000€ MRR
- 1 Top-3 Google-Ranking für mindestens 3 Long-Tail-Keywords
- Discord-Bot mit 100+ aktiven Pro-Subs

### Failure-Signal
Wenn nach 60 Tagen MRR < 100€ → Fundamentale Annahmen falsch, neu brainstormen (Persona, Pricing, Channel).

---

## 8. NICHT-Ziele (YAGNI)

Explizit verworfen für die ersten 3 Monate:
- ❌ Native Mobile Apps (PWA reicht)
- ❌ Eigener Marktplatz (Affiliate später)
- ❌ Crypto/Web3 Features
- ❌ Multi-Game (Rust, Dota 2)
- ❌ Gambling / Case Opening Sites (Image-Risiko)
- ❌ Social Features (Feed, Following) bevor Core stabil
- ❌ Funding / VC-Pitch (Lifestyle-Goal)
- ❌ Affiliate-Integrationen (Phase 2, Monat 4+)
- ❌ Trader-Tier (39€) bauen bevor Pro stabil monetarisiert

---

## 9. Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|-----------|
| Conversion-Rate < 5% | Mittel | Hoch | Pricing-Test (3,99€ Lite?), bessere Onboarding-Flow |
| Reddit-Launch failed | Niedrig | Mittel | Mehrere Subs + Discords parallel, organische Strategie |
| Stripe-Account-Issues | Niedrig | Hoch | Live-Mode-Aktivierung früh testen |
| Datenquelle (Steam API) Rate-Limit | Mittel | Hoch | Caching aggressive, Fallback SteamWebAPI |
| Konkurrent (SteamLedger) baut Smart Alerts | Niedrig | Mittel | First-Mover, Discord-Bot als Lock-in |
| Burnout (Solo, Side-Project) | Mittel | Hoch | 3-Monats-Sprint, dann Reflexion. Keine Hetze nach Launch. |

---

## 10. Nächste Schritte (nach Spec-Approval)

1. Implementation Plan für Monat 1 schreiben (`writing-plans` Skill)
2. Plan in 4-Wochen-Sprints teilen
3. Mit Sprint 3 starten: Domain-Setup + Bug-Fixes + Landing Page

---

**Approval Required:** Bitte Spec reviewen. Anpassungen markieren oder bestätigen, dann gehe ich in den Implementation Plan.
