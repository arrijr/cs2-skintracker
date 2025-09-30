# Code Review Checklist

## API Changes (KRITISCH)

### Backend API Änderungen
- [ ] **API Response Format geändert?** → Frontend Types aktualisiert?
- [ ] **Neue Felder hinzugefügt?** → Frontend Interface erweitert?
- [ ] **Felder entfernt/umbenannt?** → Breaking Change dokumentiert?
- [ ] **API Contract Tests aktualisiert?**
- [ ] **Backend/Frontend Types synchron?** (backend/src/types/api.ts ↔ frontend/src/types/api.ts)

### Frontend API Integration
- [ ] **API Response Format korrekt?** → Mit Backend übereinstimmend?
- [ ] **TypeScript Interfaces aktuell?** → Alle Backend-Felder enthalten?
- [ ] **Error Handling implementiert?** → Für neue API-Formate?
- [ ] **Fallback für alte API-Versionen?** → Wenn nötig?

## Breaking Changes

### Checkliste für Breaking Changes
- [ ] **Breaking Change dokumentiert?** → In CHANGELOG.md
- [ ] **Migration Guide erstellt?** → Für Frontend-Entwickler
- [ ] **API Versioning berücksichtigt?** → Wenn nötig
- [ ] **Frontend kompatibel?** → Oder Migration geplant?

## Testing

### Vor jedem Commit
- [ ] **API Contract Tests laufen?** → `npm run test:api-contract`
- [ ] **Frontend Tests laufen?** → `npm run test`
- [ ] **Integration Tests laufen?** → Backend + Frontend zusammen
- [ ] **Live-Seite getestet?** → Render + Vercel

## Deployment

### Vor jedem Deploy
- [ ] **Backend deployed?** → Render Service läuft?
- [ ] **Frontend deployed?** → Vercel Build erfolgreich?
- [ ] **API Endpoints erreichbar?** → Live-Tests durchgeführt?
- [ ] **Skin Browser funktioniert?** → Manueller Test

## Notfall-Plan

### Wenn etwas kaputt geht
1. **Sofort rollback** → Letzte funktionierende Version
2. **Problem identifizieren** → API Format Mismatch?
3. **Fix implementieren** → Backend/Frontend synchronisieren
4. **Tests hinzufügen** → Verhindert Wiederholung
5. **Dokumentation aktualisieren** → Lessons learned
