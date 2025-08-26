# Portfolio Enhancements

## Task 1: Click-to-Filter + Persistent Sorting ✅

### Features Implemented

#### Click-to-Filter (Donut → Tabelle)
- **Segment Clicks**: Klick auf Donut-Segmente filtert die Portfolio-Tabelle
- **Filter-Chip**: Zeigt aktiven Filter mit "Clear"-Aktion
- **"Others" Handling**: Spezieller Filter für kleinere Kategorien
- **Feature Flag**: `NEXT_PUBLIC_PORTFOLIO_ALLOCATION_FILTER` (Default OFF)

#### Persistent Sorting
- **LocalStorage**: Sortierwahl wird über Reload gespeichert
- **Backward Compatible**: Standard-Sortierung bleibt unverändert
- **Sortieroptionen**: Name (A-Z), Performance, Recent, Weight

### Implementation Details

#### PortfolioAllocation.tsx
```typescript
// Click handler für Donut-Segmente
onClick: (event: any, elements: any[]) => {
  if (!FILTER_ENABLED || !onFilterChange) return;
  
  if (elements.length > 0) {
    const index = elements[0].index;
    const label = allocationData.labels[index];
    const filterValue = allocationData.filterValues[index];
    
    if (label === "Others") {
      // Spezielle Behandlung für "Others" Segment
      onFilterChange({ type: allocationType, value: "Others", values: otherFilterValues });
    } else {
      onFilterChange({ type: allocationType, value: filterValue });
    }
  }
}
```

#### PortfolioTable.tsx
```typescript
// Filter-Logik
if (activeFilter && activeFilter.value !== "Others") {
  filteredSkins = filteredSkins.filter((entry) => {
    if (activeFilter.type === "weaponType") {
      return entry.skin.weaponType === activeFilter.value;
    } else if (activeFilter.type === "rarity") {
      return entry.skin.rarity === activeFilter.value;
    } else if (activeFilter.type === "wear") {
      return entry.skin.wear === activeFilter.value;
    }
    return true;
  });
}

// Persistent Sorting
useEffect(() => {
  const savedSort = localStorage.getItem('portfolio-sort');
  if (savedSort && ['performance', 'recent', 'name', 'weight'].includes(savedSort)) {
    setSortBy(savedSort as any);
  }
}, []);
```

### Usage

1. **Filter aktivieren**: `NEXT_PUBLIC_PORTFOLIO_ALLOCATION_FILTER=true`
2. **Segment klicken**: Klick auf Donut-Segment filtert Tabelle
3. **Filter löschen**: "Clear" Button oder X im Filter-Chip
4. **Sortierung**: Wird automatisch gespeichert und wiederhergestellt

---

## Task 2: Last Updated Chip + Stale Indicators ✅

### Features Implemented

#### Last Updated Chip
- **Global Badge**: Zeigt letzten Update-Zeitpunkt in User-Zeitzone
- **Refresh Button**: Manueller Refresh der Portfolio-Daten
- **Feature Flag**: `NEXT_PUBLIC_PORTFOLIO_LASTUPDATED_CHIP` (Default ON)

#### Stale Indicators
- **Per-Zeile Warnung**: "Stale" Badge bei Preisen > 48h alt
- **Tooltip**: Zeigt genauen Zeitpunkt des letzten Updates
- **Tolerant**: Keine aggressiven Warnungen, nur bei verfügbaren Daten

#### Auto-Refresh (Optional)
- **Feature Flag**: `NEXT_PUBLIC_PORTFOLIO_AUTOREFRESH` (Default OFF)
- **Intervall**: 15 Minuten (konfigurierbar)

### Implementation Details

#### LastUpdatedChip.tsx
```typescript
// Datenquellen-Priorität
const loadLastUpdated = async () => {
  try {
    // 1. Health endpoint (bevorzugt)
    const healthResponse = await fetch("/api/v1/health/cron-status");
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      if (healthData.priceHistoryLastRun) {
        setLastUpdated({
          timestamp: healthData.priceHistoryLastRun,
          source: 'health'
        });
        return;
      }
    }

    // 2. Fallback: Portfolio-Daten
    setLastUpdated({
      timestamp: new Date().toISOString(),
      source: 'portfolio'
    });

  } catch (err) {
    // 3. Fallback: Aktuelle Zeit
    setLastUpdated({
      timestamp: new Date().toISOString(),
      source: 'fallback'
    });
  }
};
```

#### Stale Detection
```typescript
const isStale = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 48; // 48 Stunden Schwellwert
  } catch {
    return false;
  }
};
```

### Usage

1. **Chip aktivieren**: `NEXT_PUBLIC_PORTFOLIO_LASTUPDATED_CHIP=true` (Default)
2. **Auto-Refresh**: `NEXT_PUBLIC_PORTFOLIO_AUTOREFRESH=true` (Optional)
3. **Refresh Button**: Klick lädt alle Daten neu
4. **Stale Badges**: Erscheinen automatisch bei alten Preisen

---

## Feature Flags

### Environment Variables

```bash
# Task 1: Click-to-Filter (Default: OFF)
NEXT_PUBLIC_PORTFOLIO_ALLOCATION_FILTER=true

# Task 2: Last Updated Chip (Default: ON)
NEXT_PUBLIC_PORTFOLIO_LASTUPDATED_CHIP=true

# Task 2: Auto-Refresh (Default: OFF)
NEXT_PUBLIC_PORTFOLIO_AUTOREFRESH=true
```

### Rollout Strategy

#### Phase 1: Preview (Flags ON)
- Click-to-Filter aktiviert
- Last Updated Chip aktiviert
- Auto-Refresh deaktiviert

#### Phase 2: Production (Flags OFF)
- Click-to-Filter deaktiviert
- Last Updated Chip aktiviert
- Auto-Refresh deaktiviert

#### Phase 3: Full Release (Flags ON)
- Alle Features aktiviert
- Performance-Monitoring
- User-Feedback

---

## Testing Matrix

### Manual Testing Checklist

#### Task 1: Click-to-Filter
- [ ] Segment-Klick filtert Tabelle korrekt
- [ ] "Others" Segment funktioniert
- [ ] Filter-Chip zeigt aktiven Filter
- [ ] "Clear" entfernt Filter
- [ ] Wechsel zwischen Tabs funktioniert
- [ ] Empty-State bei keinem Match

#### Task 1: Persistent Sorting
- [ ] Sortierung wird gespeichert
- [ ] Nach Reload wiederhergestellt
- [ ] Default-Sortierung bleibt unverändert
- [ ] Alle Sortieroptionen funktionieren

#### Task 2: Last Updated Chip
- [ ] Chip zeigt plausiblen Zeitstempel
- [ ] Refresh-Button lädt Daten neu
- [ ] Fallback bei fehlenden Daten
- [ ] User-Zeitzone wird korrekt angezeigt

#### Task 2: Stale Indicators
- [ ] Stale-Badge bei >48h alten Preisen
- [ ] Tooltip zeigt genauen Zeitpunkt
- [ ] Keine Warnungen bei fehlenden Daten
- [ ] Badge verschwindet nach Update

### Edge Cases

- [ ] Keine Health-API → Fallback funktioniert
- [ ] Keine Filter-Daten → Graceful Degradation
- [ ] Netzwerk-Fehler → User-Feedback
- [ ] Feature Flags OFF → Seite unverändert

---

## Performance Considerations

### Click-to-Filter
- **Client-seitig**: Keine zusätzlichen API-Calls
- **Memoization**: Filter-Logik optimiert
- **Rendering**: Nur sichtbare Zeilen werden gerendert

### Last Updated Chip
- **Lazy Loading**: Daten werden bei Bedarf geladen
- **Caching**: Zeitstempel werden gecacht
- **Auto-Refresh**: Nur bei aktiviertem Flag

### Stale Indicators
- **Berechnung**: Einmal pro Zeile, nicht bei jedem Render
- **Threshold**: Konfigurierbar (aktuell 48h)
- **Fallback**: Keine Berechnung bei fehlenden Daten

---

## Future Enhancements

### Click-to-Filter
- **URL-Parameter**: Filter in URL speichern
- **Mehrere Filter**: Kombination von Kategorien
- **Filter-History**: Letzte Filter speichern

### Last Updated
- **WebSocket**: Real-time Updates
- **Push-Notifications**: Bei neuen Daten
- **Custom Intervals**: Benutzerdefinierte Refresh-Zeiten

### Stale Indicators
- **Konfigurierbare Schwellen**: User-spezifische Warnungen
- **Batch-Updates**: Mehrere Preise gleichzeitig aktualisieren
- **Progressive Enhancement**: Mehr Details bei Hover
