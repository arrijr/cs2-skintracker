# CS2 Skin Tracker — Dokumentations-Hub

**Projekt**: CS2 Skin Tracker — Freemium SaaS für CS2 Skin-Preise  
**Status**: Sprint 2 abgeschlossen ✅ | Sprint 3 laufend 🔄  
**Live**: https://backend-three-theta-44.vercel.app  
**Letzte Aktualisierung**: Mai 2026

---

## Navigation

| Dokument | Inhalt |
|----------|--------|
| [[01-Architecture]] | System-Architektur, Tech Stack, Deployment |
| [[02-Database-Schema]] | Alle Prisma-Modelle und Felder |
| [[03-Backend-API]] | Alle API-Endpunkte |
| [[04-Frontend-Pages]] | Alle Seiten und Routen |
| [[05-Frontend-Components]] | Komponenten, Hooks, State |
| [[06-Tech-Debt]] | Bekannte Probleme, Must-Fix vor Production |
| [[07-Sprint-Status]] | Sprint 1–3 Übersicht |
| [[08-Environments]] | Env-Variablen und Keys |

---

## Quick Reference

**Ports lokal**: Backend :5000 | Frontend :3000  
**Auth**: Clerk (`pk_test_` lokal / `pk_live_` production)  
**Payments**: Stripe Test-Key `sk_test_51TTkHg...`  
**Tier-System**: `free → creator → pro`

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
