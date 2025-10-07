# Case Contents - Verlässliche Datenquelle

## ✅ csgodatabase.com - PRIMARY SOURCE

**URL-Pattern:** `https://www.csgodatabase.com/cases/{case-name}/`

### Vorteile:
- ✅ Vollständige und akkurate Skin-Listen
- ✅ Korrekte Raritäten (Covert, Classified, Restricted, Mil-Spec)
- ✅ Alle 42+ CS2/CSGO Cases verfügbar
- ✅ Verlässlich und aktuell
- ✅ Klare Struktur

### Beispiele:
- Operation Breakout: https://www.csgodatabase.com/cases/operation-breakout-weapon-case/
- Chroma Case: https://www.csgodatabase.com/cases/chroma-case/
- Recoil Case: https://www.csgodatabase.com/cases/recoil-case/

### Drop-Chancen (Standard für alle Cases):
- **Covert (Red):** 0.64% each
- **Classified (Pink):** 3.2% each  
- **Restricted (Purple):** 15.98% each
- **Mil-Spec (Blue):** 15.98% each (meist 5 items = 79.92% total)
- **Exceedingly Rare (Gold/Knives):** 0.26% total (für alle Knives zusammen)

## 📋 Implementierungs-Workflow:

1. **Case auswählen** auf csgodatabase.com
2. **Skin-Liste kopieren** (Name + Rarity)
3. **Script erstellen** wie `implementOperationBreakoutSkinsCorrect.js`
4. **Testen** mit `node backend/scripts/{script-name}.js`
5. **Verifizieren** mit `checkContainedSkins.js`

## 🚨 Wichtige Erkenntnisse:

### Operation Breakout Case - KORRIGIERT
**Quelle:** https://www.csgodatabase.com/cases/operation-breakout-weapon-case/

**Alte falsche Daten (implementOperationBreakoutSkins.js):**
- ❌ AK-47 | Redline (war in ANDEREN Cases)
- ❌ M4A4 | Howl (war in Huntsman Case, jetzt Contraband)
- ❌ AWP | Redline (andere Case)
- ❌ 51 Skins total - komplett falsch!

**Neue korrekte Daten (implementOperationBreakoutSkinsCorrect.js):**
- ✅ M4A1-S | Cyrex (Covert)
- ✅ P90 | Asiimov (Covert)
- ✅ Glock-18 | Water Elemental (Classified)
- ✅ Desert Eagle | Conspiracy (Classified)
- ✅ 19 Skins total (15 Skins + 4 Butterfly Knives)

## 🎯 Nächste Schritte:

1. Altes Script löschen/archivieren
2. Korrigiertes Script ausführen
3. Weitere Top Cases von csgodatabase.com importieren:
   - CS:GO Weapon Case
   - Chroma Case
   - Chroma 2 Case
   - Spectrum Case
   - Prisma Case
   - etc.
