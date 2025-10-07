# csgodatabase.com Import System

## 🎯 Lösung für Case Contents Import

Erstellt am: 7. Okt 2025

### Problem:
- 42 Cases brauchen Contained Skins
- Keine API verfügbar
- Manuelle Eingabe zu aufwändig

### Lösung: Template-basiertes Import-System

#### 1. Case URL Mapping
**Datei:** `backend/scripts/csgodatabase-case-urls.json`
- Enthält alle 38+ Cases mit URLs
- Quelle: https://www.csgodatabase.com/cases/

#### 2. Template Script
**Datei:** `backend/scripts/importCaseFromCSGODatabase.template.js`
- Universelles Template für alle Cases
- Kopieren & anpassen für jede Case
- Automatische Skin-Erstellung
- Idempotent (alte Daten werden überschrieben)

#### 3. Workflow-Dokumentation
**Datei:** `backend/scripts/CSGODATABASE_IMPORT_WORKFLOW.md`
- Schritt-für-Schritt Anleitung
- Drop-Chancen Referenz
- Top Priority Cases Liste
- Beispiele

## 📋 Workflow (Kurzversion):

```bash
# 1. Template kopieren
cp importCaseFromCSGODatabase.template.js importKilowattFromCSGODB.js

# 2. Script anpassen:
#    - CASE_NAME = "Kilowatt Case"
#    - CSGODB_URL = "https://www.csgodatabase.com/cases/kilowatt-case/"
#    - CASE_SKINS = [...] # Von Website kopieren

# 3. Ausführen
node importKilowattFromCSGODB.js

# 4. Verifizieren
node checkContainedSkins.js
```

## ✅ Vorteile:

1. **Wartbar** - Jede Case hat eigenes Script
2. **Transparent** - Klare Datenquelle (csgodatabase.com)
3. **Versioniert** - Scripts in Git
4. **Idempotent** - Mehrfach ausführbar ohne Probleme
5. **Standard-Rates** - Drop-Chancen dokumentiert

## 🎯 Top 10 Priority Cases:

1. ✅ Operation Breakout Weapon Case (DONE)
2. ⏳ Kilowatt Case (neueste)
3. ⏳ Revolution Case
4. ⏳ Recoil Case
5. ⏳ Dreams & Nightmares Case
6. ⏳ Chroma Case
7. ⏳ Chroma 2 Case  
8. ⏳ Spectrum Case
9. ⏳ Prisma Case
10. ⏳ CS:GO Weapon Case (Original)

## 📊 Aktueller Stand:

- **8/42 Cases** haben Contained Skins (19%)
- **Operation Breakout** mit korrekten Daten
- **Template-System** ready für alle anderen

## 🔄 Nächste Schritte:

1. Top 10 Cases importieren
2. Bei Bedarf: Weitere Cases
3. Später: Automatisches Scraping-System (optional)
