# CS2 Skin Tracker — Vault-Home 🗺️

**Projekt**: CS2 Skin Tracker — Freemium SaaS für CS2 Skin-Preise
**Status**: Sprint 2 abgeschlossen ✅ | Notifications Production-Ready ✅
**Live**: https://backend-three-theta-44.vercel.app
**Letzte Aktualisierung**: 2026-06-01 (Vault auf Stand gebracht; Cleanup — [[2026-05-30-obsidian-vault-cleanup]])

> **Startseite des Vaults.** Jeder Bereich hat eine eigene Map-of-Content (MOC).
> Wie Doku angelegt wird → [[CONVENTIONS]]. Auto-Übersichten → [[Dashboard]].

---

## 🧭 Kern-Doku (Single Source of Truth)

| # | Dokument | Inhalt |
|---|----------|--------|
| 01 | [[01-Architecture]] | System-Architektur, Tech Stack, Deployment |
| 02 | [[02-Database-Schema]] | Alle Prisma-Modelle und Felder |
| 03 | [[03-Backend-API]] | Alle API-Endpunkte |
| 04 | [[04-Frontend-Pages]] | Alle Seiten und Routen |
| 05 | [[05-Frontend-Components]] | Komponenten, Hooks, State |
| 06 | [[06-Tech-Debt]] | Bekannte Probleme, Must-Fix vor Production |
| 07 | [[07-Sprint-Status]] | Sprint 1–3 Übersicht |
| 08 | [[08-Environments]] | Env-Variablen und Keys |

---

## 🗂️ Bereiche (MOCs)

| Bereich | Index | Inhalt |
|---------|-------|--------|
| Sprint 1 | [[docs/01-Sprint1/README\|Sprint 1]] | Setup, API-Docs, Testing |
| Sprint 2 | [[docs/02-Sprint2/Overview\|Sprint 2]] | Multi-Source Pricing + SEO, Completion-Report |
| Specs & Pläne | [[docs/superpowers/README\|Process-MOC]] | Designs, Implementation-Pläne, Sprint-Reports |
| Features | [[docs/features/README\|Features-MOC]] | Portfolio · Cases · Skins · Filter |
| Ops & Setup | [[docs/ops/README\|Ops-MOC]] | Deploy · Stripe · Data-Sources · Verification |
| Architektur | [[System-Design]] | Detail-Design, Diagramme |
| ADRs | [[docs/superpowers/adrs/README\|ADR-Index]] | Architektur-Entscheidungen (001–005) |
| Launch | [[docs/launch/README\|Launch-Kit]] | Checklist · Posts · Discords · Demo-Script |
| Sessions | [[2026-06-01-steam-import-and-pricing-overhaul]] · [[2026-05-30-price-pipeline-fix]] · [[2026-05-22-ceo-autonomous-audit]] | Autonome Arbeits-Sessions |
| Archiv | [[docs/archive/README\|Archiv]] | Historische / abgelöste Docs |

---

## 📐 Guides (Working-Memory-Regeln)

[[Business-Context]] · [[Development-Workflow]] · [[Skill-Triggers]] ·
[[Architecture-Decisions]] · [[Production-Checklist]] · [[Token-Optimization]]

---

## 🔬 Research & Strategie

[[2026-05-20-ceo-strategy]] · [[2026-05-20-ceo-checklist]] · [[2026-05-20-market-analysis]] ·
[[2026-05-20-product-roadmap]] · [[2026-05-20-seo-strategy]] · [[2026-05-20-seo-audit]] ·
[[2026-05-20-competitor-seo]] · [[2026-05-22-notifications-audit-fix]] ·
[[2026-05-31-steam-inventory-datacenter-ip-block]]

---

## 📚 Referenz (lose Docs)

[[API]] · [[DECISIONS]] · [[TROUBLESHOOTING]] · [[DESIGN_SYSTEM]] ·
[[CODE_REVIEW_CHECKLIST]] · [[DOCUMENTATION_RULES]] · [[SPEED_WORKFLOW]] ·
[[SYSTEM_STATUS]] · [[API_KEYS]] · [[GITHUB_SECRETS_SETUP]] · [[admin-metrics]] ·
[[github-mcp-SETUP]]

**Changelogs**: [[CHANGELOG\|Auto-Changelog (Root, commit-generiert)]] ·
[[docs/CHANGELOG\|Narrativ-Changelog (kuratiert)]]

---

## ⚡ Quick Reference

**Ports lokal**: Backend :5000 | Frontend :3000
**Auth**: Clerk (`pk_test_` lokal / `pk_live_` production)
**Payments**: Stripe Test-Key (`sk_test_…`)
**Tier-System**: `free → lite → pro`

**Server starten**:
```bash
cd backend && npm run dev   # Port 5000
cd frontend && npm run dev  # Port 3000
```

**Tests**:
```bash
cd backend && npm run test:sprint2
cd frontend && npx playwright test --project=chromium
```
