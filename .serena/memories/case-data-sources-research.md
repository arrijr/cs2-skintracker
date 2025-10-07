# Case Data Sources Research (7. Okt 2025)

## ❌ Supply-Daten (Total Dropped/Unboxed/Remaining)

**Fazit:** NICHT verfügbar! Valve veröffentlicht diese Daten nicht.

### Was verfügbar ist (SteamWebAPI.com):
- ✅ `offervolume` - Aktuelle Markt-Angebote
- ✅ `sold24h, sold7d, sold30d, sold90d` - Verkaufshistorie
- ✅ Preis-Daten (latest, median, avg, min, max)

### Was wir tun können:
- **Schätzung** basierend auf:
  - offerVolume als Proxy für "remaining"
  - Historische Verkäufe akkumuliert für "total sold"
  - Disclaimer: "Geschätzte Werte basierend auf Marktdaten"

## 🎨 Contained Skins Datenquellen

### Community-Websites (kein API):
1. **cs2skinsdb.com** - Vollständige Case-Listen mit Skins
2. **skinlords.com** - Case-Übersicht mit Contents
3. **csgolist.com** - Detaillierte Case-Daten
4. **csgostash.com** - Drop-Chancen und Raritäten

### Mögliche Ansätze:

#### Option 1: Manuelles Mapping (Aktuell)
- Script wie `implementOperationBreakoutSkins.js`
- Manuell pro Case pflegen
- ✅ Einfach zu kontrollieren
- ❌ Zeitaufwendig (42 Cases)

#### Option 2: Web Scraping
- Scrape von cs2skinsdb.com oder ähnlich
- Automatisch alle Cases befüllen
- ✅ Automatisch
- ❌ Anfällig für Website-Änderungen
- ❌ Legal fragwürdig

#### Option 3: Community-Datenbank
- JSON-Datei mit allen Case-Contents pflegen
- Versioniert in Git
- Updates bei neuen Cases
- ✅ Wartbar
- ✅ Transparent
- ❌ Initiale Arbeit

### Drop-Chancen & Raritäten:

**Standard CS2 Drop-Rates:**
- Consumer Grade: 79.92%
- Industrial Grade: 15.98%
- Mil-Spec Grade: 3.2%
- Restricted: 1.64%
- Classified: 0.64%
- Covert: 0.26%
- Exceedingly Rare (Knives): 0.26%

Diese sind bei allen Cases gleich (laut Community-Konsens).

## 💡 Empfehlung:

**Phase 1 (Sofort):**
- Option 1 nutzen für wichtige Cases (Top 10-15)
- Disclaimer für fehlende Cases

**Phase 2 (Mittelfristig):**
- Community-JSON-Datei erstellen
- Alle 42 Cases manuell eingeben
- In Git versionieren

**Phase 3 (Optional):**
- Scraper für automatische Updates
- Nur für neue Cases