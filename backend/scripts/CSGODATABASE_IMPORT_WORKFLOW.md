# csgodatabase.com Case Import Workflow

## 📋 Overview

Dieser Workflow ermöglicht das systematische Importieren von CS2 Case Contents von [csgodatabase.com](https://www.csgodatabase.com/cases/).

## 🎯 Workflow

### 1. Case auswählen

Besuche: https://www.csgodatabase.com/cases/

Wähle eine Case aus, z.B.:
- **Kilowatt Case**: https://www.csgodatabase.com/cases/kilowatt-case/
- **Recoil Case**: https://www.csgodatabase.com/cases/recoil-case/
- **Revolution Case**: https://www.csgodatabase.com/cases/revolution-case/

### 2. Template kopieren

```bash
cd backend/scripts
cp importCaseFromCSGODatabase.template.js import[CaseName]FromCSGODB.js
```

Beispiel:
```bash
cp importCaseFromCSGODatabase.template.js importKilowattFromCSGODB.js
```

### 3. Script anpassen

Öffne das neue Script und passe an:

#### a) Case Name (muss exakt DB-Name matchen)
```javascript
const CASE_NAME = "Kilowatt Case";
```

#### b) csgodatabase.com URL
```javascript
const CSGODB_URL = "https://www.csgodatabase.com/cases/kilowatt-case/";
```

#### c) Skins von Website kopieren

Besuche die URL und kopiere alle Skins mit Rarität:

**Beispiel Kilowatt Case:**

```javascript
const CASE_SKINS = [
  // Covert (Red) - 0.64% each
  { name: "AK-47 | Inheritance", rarity: "Covert", dropChance: 0.64 },
  { name: "USP-S | Jawbreaker", rarity: "Covert", dropChance: 0.64 },
  
  // Classified (Pink) - 3.2% each
  { name: "M4A1-S | Black Lotus", rarity: "Classified", dropChance: 3.2 },
  { name: "Glock-18 | Umbral Rabbit", rarity: "Classified", dropChance: 3.2 },
  { name: "Five-SeveN | Hybrid Hunter", rarity: "Classified", dropChance: 3.2 },
  
  // Restricted (Purple) - 15.98% each
  { name: "Tec-9 | Slag", rarity: "Restricted", dropChance: 15.98 },
  { name: "Nova | Dark Sigil", rarity: "Restricted", dropChance: 15.98 },
  { name: "SSG 08 | Dezastre", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAC-10 | Sakkaku", rarity: "Restricted", dropChance: 15.98 },
  { name: "Zeus x27 | Olympus", rarity: "Restricted", dropChance: 15.98 },
  
  // Mil-Spec (Blue) - 15.98% each
  { name: "P250 | Re.built", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "UMP-45 | Motorized", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Sawed-Off | Analog Input", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP9 | Featherweight", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P90 | Neoqueen", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  
  // Exceedingly Rare (Gold) - 0.26% total
  { name: "★ Kukri Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Autotronic", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  // ... weitere Knife Variants
];
```

### 4. Script ausführen

```bash
node backend/scripts/import[CaseName]FromCSGODB.js
```

Beispiel:
```bash
node backend/scripts/importKilowattFromCSGODB.js
```

### 5. Verifizieren

```bash
node backend/scripts/checkContainedSkins.js
```

Prüfe ob die Case die korrekten Skins hat.

### 6. Committen

```bash
git add .
git commit -m "feat(cases): Add [Case Name] contents from csgodatabase.com"
git push
```

## 📊 Drop-Chancen (Standard)

Diese sind für **ALLE** Cases gleich:

| Rarity | Drop Chance | Beispiel |
|--------|-------------|----------|
| **Covert (Red)** | 0.64% each | AK-47 \| Inheritance |
| **Classified (Pink)** | 3.2% each | M4A1-S \| Black Lotus |
| **Restricted (Purple)** | 15.98% each | Tec-9 \| Slag |
| **Mil-Spec (Blue)** | 15.98% each | P250 \| Re.built |
| **Exceedingly Rare (Gold)** | 0.26% total | ★ Kukri Knife |

**Hinweis:** Bei Knives ist 0.26% die **Gesamt-Chance** für ALLE Knife-Variants zusammen!

## 🎯 Top Priority Cases

Basierend auf Popularität und Wichtigkeit:

1. ✅ **Operation Breakout Weapon Case** (Done)
2. **Kilowatt Case** (neueste)
3. **Revolution Case**
4. **Recoil Case**
5. **Dreams & Nightmares Case**
6. **Chroma Case**
7. **Chroma 2 Case**
8. **Spectrum Case**
9. **Prisma Case**
10. **CS:GO Weapon Case** (Original)

## 🔗 Ressourcen

- **Case Übersicht**: https://www.csgodatabase.com/cases/
- **URLs Mapping**: `backend/scripts/csgodatabase-case-urls.json`
- **Template**: `backend/scripts/importCaseFromCSGODatabase.template.js`

## ⚠️ Wichtige Hinweise

1. **Case Name** muss **exakt** mit DB übereinstimmen (check mit `node scripts/checkContainedSkins.js`)
2. **Alte Relationships werden gelöscht** beim Import (idempotent)
3. **Neue Skins werden automatisch erstellt** falls nicht vorhanden
4. **Knives** immer mit `isSpecial: true` markieren
5. **Bilder** sind Platzhalter - echte URLs kommen von SteamWebAPI.com Update

## 📈 Progress Tracking

Nutze dieses Kommando um zu sehen welche Cases bereits Skins haben:

```bash
node backend/scripts/checkContainedSkins.js
```

Aktueller Stand: **8/42 Cases** haben Contained Skins.

