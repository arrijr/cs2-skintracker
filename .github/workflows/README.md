# GitHub Actions Workflows

Diese Workflows ersetzen Render Cronjobs (die Premium benötigen) und laufen täglich automatisch und kostenlos.

## 🚀 **Workflows**

### 1. **Update Skin Prices Daily** (`update-skin-prices.yml`)
- **Schedule**: Täglich um 02:00 UTC
- **Funktion**: Holt aktuelle Preise von SteamWebAPI und updated alle Skins
- **Script**: `backend/scripts/updateSkinPrices.js`
- **Secrets**: `DATABASE_URL`, `STEAMWEBAPI_KEY`

### 2. **Save Price History Daily** (`save-price-history.yml`)
- **Schedule**: Täglich um 03:00 UTC (nach Preis-Update)
- **Funktion**: Speichert tägliche Price History für alle Skins
- **Script**: `backend/scripts/savePriceHistory.js`
- **Secrets**: `DATABASE_URL`

### 3. **Save Quantity History Daily** (`save-quantity-history.yml`)
- **Schedule**: Täglich um 03:30 UTC (nach Price History)
- **Funktion**: Speichert Offer Volume History für alle Skins
- **Script**: `backend/scripts/saveQuantityHistory.js`
- **Secrets**: `DATABASE_URL`

## ⚙️ **Einrichtung**

### GitHub Secrets konfigurieren:

1. Gehe zu GitHub Repository
2. Settings > Secrets and variables > Actions
3. Klicke "New repository secret"
4. Füge hinzu:
   - **`DATABASE_URL`**: Deine Supabase/PostgreSQL Connection String
     ```
     postgresql://user:password@host:port/database
     ```
   - **`STEAMWEBAPI_KEY`**: Dein Steam WebAPI Key
     ```
     XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
     ```

### Manuell triggern:

1. Gehe zu GitHub > Actions Tab
2. Wähle einen Workflow aus der Liste
3. Klicke "Run workflow"
4. Wähle Branch (normalerweise `main`)
5. Klicke "Run workflow" (grüner Button)

## 📊 **Monitoring**

### Workflow Status prüfen:
1. GitHub > Actions Tab
2. Sieh die neuesten Workflow Runs
3. Klicke auf einen Run für Details
4. Check die Summary für:
   - Status (Success/Failure)
   - Trigger (Schedule/Manual)
   - Timestamp
   - Anzahl verarbeitete Skins
   - Fehler

### Logs ansehen:
1. Klicke auf einen Workflow Run
2. Klicke auf einen Job (z.B. "update-prices")
3. Expandiere die Steps
4. Sieh die Logs für Details

## 🔥 **Troubleshooting**

### Workflow läuft nicht automatisch:
- **Check**: Workflows müssen im `main` Branch sein
- **Check**: Repository darf nicht archiviert sein
- **Check**: Secrets müssen korrekt gesetzt sein

### Workflow schlägt fehl:
- **Check Logs**: Gehe zu Actions > Workflow Run > Logs
- **Check Secrets**: DATABASE_URL und STEAMWEBAPI_KEY korrekt?
- **Check Database**: Ist die Datenbank erreichbar?
- **Check API**: Ist der SteamWebAPI Key gültig?

### Workflow zeigt "Failed":
1. Gehe zu Actions > gescheiterter Run
2. Scrolle runter zu "Annotations"
3. Sieh Details zum Fehler
4. Fix das Problem (meist Secrets oder API Issues)
5. Re-run den Workflow

## 💰 **Kosten**

GitHub Actions ist **kostenlos** für:
- Public Repositories: Unbegrenzte Minuten
- Private Repositories: 2000 Minuten/Monat

Diese Workflows nutzen ca. 15-30 Minuten/Monat total.

## 🎯 **Best Practices**

1. **Secrets sicher halten**: Niemals in Code committen
2. **Timeouts setzen**: Verhindert endlose Runs
3. **Summaries erstellen**: Erleichtert Monitoring
4. **Error Notifications**: Bei Failure benachrichtigen
5. **Logs minimal halten**: Sensibl Daten nicht loggen

## 🔄 **Update-Ablauf**

```
02:00 UTC: Update Skin Prices
    ↓
    Holt Preise von SteamWebAPI
    Updates Skin Daten in DB
    ↓
03:00 UTC: Save Price History
    ↓
    Speichert Tages-Preise in PriceHistory
    ↓
03:30 UTC: Save Quantity History
    ↓
    Speichert Offer Volume in SkinQuantityHistory
```

## 📝 **Scripts**

Alle Scripts sind in `backend/scripts/` und können auch lokal ausgeführt werden:

```bash
cd backend

# Preis-Update
node scripts/updateSkinPrices.js

# Price History speichern
node scripts/savePriceHistory.js

# Quantity History speichern
node scripts/saveQuantityHistory.js
```

## 🚨 **Wichtig**

- Workflows MÜSSEN im `main` Branch sein
- Secrets MÜSSEN gesetzt sein vor dem ersten Run
- Logs werden nach 90 Tagen gelöscht
- Bei Workflow-Änderungen: Commit → Push → Check Actions Tab

