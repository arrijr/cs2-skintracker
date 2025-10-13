# Troubleshooting Guide

## 🚨 **CRITICAL: Database Safety Rules**

**NEVER run destructive commands in production!**

FORBIDDEN in production:
* `prisma migrate reset`
* `DROP TABLE` commands  
* `TRUNCATE` commands
* Any script that deletes data

These commands are ONLY allowed in development (NODE_ENV=development)

Script Safety:
* All database scripts include safety guards
* Scripts check `NODE_ENV` before running
* Production database operations are blocked by default
* Only idempotent operations (upserts) are allowed in production

Skin Import Process:
* Development: `NODE_ENV=development node backend/scripts/importSkins.js`
* Production: Use Steam Web API (Premium) only, scripts upsert skins
* Portfolio & User data is NEVER automatically deleted

---

## Quantity History Chart Width Issues
------------------------------------

**Symptom**: Quantity History bars are too narrow and don't span the full width of the card, leaving visible gaps.

**Root Cause**: Missing `w-full` on ChartContainer and suboptimal XAxis configuration for Recharts.

**Solution**: Implement shadcn/recharts best practices:
1. Add `w-full` to ChartContainer for proper width inheritance
2. Configure XAxis with `type="category"` + `scale="band"`
3. Set `barCategoryGap="0%"` and `barGap={0}` on BarChart
4. Reduce margins to 8px for edge-to-edge bars
5. Remove all width-manipulating props from Bar component

**Container Chain**: Card → CardContent → ChartContainer(w-full) → ResponsiveContainer(100%) → BarChart

**Files**: `frontend/src/app/skins/[skinId]/page.tsx`

**Status**: ✅ Fixed and confirmed working

---

## Wrong Host for API Requests (404)
---------------------------------

**Problem**: Frontend calls wrong API host (localhost instead of production)

**Symptoms**:
* 404 errors in browser console
* API calls fail in production
* Portfolio shows empty state

**Solution**:
1. Check `NEXT_PUBLIC_API_URL` in environment variables
2. For local development: `http://localhost:3001`
3. For production: `https://your-backend-url.com`
4. Restart frontend after changing environment variables

**Frontend API Configuration** (`frontend/src/lib/api.ts`):
```typescript
const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) return apiUrl;
  
  // Fallback for development
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://your-backend-url.com';
};
```

---

## Portfolio Shows Empty State
-----------------------------

**Problem**: Portfolio displays "No skins found" or empty grid

**Symptoms**:
* Portfolio page loads but shows no data
* Dashboard shows 0 skins
* User is logged in but portfolio is empty

**Root Causes**:
1. **Database is empty** - No skins imported
2. **API authentication fails** - JWT token issues
3. **CORS errors** - Frontend can't reach backend
4. **Wrong environment** - Development vs production mismatch

**Diagnostic Steps**:
1. Check browser console for errors
2. Verify API endpoints return data: `GET /api/v1/skins`
3. Check authentication: `GET /api/v1/portfolio`
4. Verify database has skins: Run `node scripts/checkAllTables.js`

**Solutions**:

### 1. Import Skins (Most Common Fix)
```bash
# Import all skins from Steam API
cd backend
NODE_ENV=development node scripts/steamImportSkins.js --real-run
```

### 2. Fix Authentication
```bash
# Check JWT token in browser DevTools > Application > Local Storage
# Verify Clerk configuration in frontend/.env.local
```

### 3. Fix CORS Issues
```bash
# Backend must allow frontend domain in CORS settings
# Check backend/src/app.js CORS configuration
```

---

## Missing Skin Prices
---------------------

**Problem**: Skins display but show "No price available"

**Symptoms**:
* Skins visible in browser but no prices shown
* Portfolio shows skins but $0.00 values
* Price history charts are empty

**Root Cause**: Steam API import only loads basic skin data, not prices

**Solution**: Generate realistic sample prices
```bash
cd backend
NODE_ENV=development node scripts/generateRealisticPrices.js
```

**What This Script Does**:
* Generates realistic CS2 skin prices based on weapon type, rarity, wear
* Creates price variations (latest, median, average, min, max)
* Adds market data (volume, sales, etc.)
* Creates price history entries
* Uses CS2 market knowledge for accurate pricing

**Price Generation Logic**:
- **Knives**: $50-$12,000 (highest value items)
- **Rifles**: $0.50-$8,000 (AK-47, AWP, M4A4, etc.)
- **Pistols**: $0.05-$1,200 (Glock, USP, Deagle, etc.)
- **SMGs**: $0.05-$400 (MAC-10, MP9, etc.)
- **Rarity multipliers**: Consumer (1x) to Contraband (50x)
- **Wear multipliers**: Factory New (1x) to Battle-Scarred (0.2x)
- **StatTrak multiplier**: 2.5x for StatTrak items

---

## Steam API Rate Limiting
-------------------------

**Problem**: Steam API returns 429 (Too Many Requests) errors

**Symptoms**:
* Price update scripts fail with HTTP 429
* Import scripts hang or timeout
* "Rate limit exceeded" errors in logs

**Solutions**:
1. **Use realistic price generation instead** (recommended):
   ```bash
   NODE_ENV=development node scripts/generateRealisticPrices.js
   ```

2. **If using real Steam API**, implement proper rate limiting:
   ```javascript
   const BATCH_DELAY = 2000; // 2 seconds between batches
   const BATCH_SIZE = 50;    // Smaller batches
   await sleep(BATCH_DELAY); // Delay between requests
   ```

---

## PowerShell Command Issues
---------------------------

**Problem**: PowerShell doesn't recognize `&&` operator

**Symptoms**:
* "Das Token && ist in dieser Version kein gültiges Anweisungstrennzeichen"
* Commands fail when chaining with `&&`

**Solutions**:
1. **Use semicolon instead**:
   ```powershell
   cd frontend; npm run dev
   cd backend; npm start
   ```

2. **Use separate commands**:
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Use full paths**:
   ```powershell
   cd "C:\Users\Arthur\Documents\Coding\CS2 Skin Tracker\frontend"
   npm run dev
   ```

---

## Database Connection Issues
----------------------------

**Problem**: Cannot connect to database

**Symptoms**:
* "Connection refused" errors
* "Database does not exist" errors
* Scripts fail with Prisma connection errors

**Solutions**:
1. **Check DATABASE_URL**:
   ```bash
   echo $DATABASE_URL  # Linux/Mac
   echo $env:DATABASE_URL  # Windows PowerShell
   ```

2. **Verify database exists**:
   ```bash
   cd backend
   NODE_ENV=development node scripts/checkDatabase.js
   ```

3. **Run migrations**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

---

## Environment Variable Issues
-----------------------------

**Problem**: Scripts can't find required environment variables

**Symptoms**:
* "STEAM_API_KEY not found" errors
* "DATABASE_URL not set" errors
* API calls fail with authentication errors

**Solutions**:
1. **Check .env file exists**:
   ```bash
   ls backend/.env  # Should exist
   ```

2. **Verify variables are set**:
   ```bash
   cd backend
   NODE_ENV=development node scripts/checkEnv.js
   ```

3. **For production (Render)**:
   - Set environment variables in Render dashboard
   - Restart services after changing environment variables
   - Check logs for environment variable errors

---

## Common Script Commands
------------------------

**Database Health Check**:
```bash
cd backend
NODE_ENV=development node scripts/checkAllTables.js
```

**Import All Skins**:
```bash
cd backend
NODE_ENV=development node scripts/steamImportSkins.js --real-run
```

**Generate Realistic Prices**:
```bash
cd backend
NODE_ENV=development node scripts/generateRealisticPrices.js
```

**Check Price Data**:
```bash
cd backend
NODE_ENV=development node scripts/checkPriceData.js
```

**Test Steam API Connection**:
```bash
cd backend
NODE_ENV=development node scripts/testSteamAPI.js
```

---

## Performance Issues
-------------------

**Problem**: Slow loading times or timeouts

**Solutions**:
1. **Optimize database queries**:
   - Add indexes for frequently queried fields
   - Use pagination for large datasets
   - Implement caching where appropriate

2. **Frontend optimization**:
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists
   - Optimize image loading

3. **API optimization**:
   - Implement response caching
   - Use compression (gzip)
   - Optimize database queries

---

## API Response Format Issues

### Problem: Skin Browser zeigt keine Skins an
**Symptom:** Skin Browser ist leer, obwohl Backend läuft
**Ursache:** API Response Format Mismatch zwischen Backend und Frontend
**Lösung:**
1. Prüfe Backend API: `curl https://cs2-skintracker.onrender.com/api/v1/skins?page=1&pageSize=5`
2. Erwartetes Format: `{"items": [...], "total": ..., "page": ...}`
3. Falls altes Format: Backend/Frontend Types synchronisieren
4. API Contract Tests ausführen: `npm run test:api-contract`

### Problem: Frontend erwartet anderes API Format
**Symptom:** Frontend Fehler beim Laden der Skins
**Ursache:** Backend API geändert, Frontend Types nicht aktualisiert
**Lösung:**
1. Backend Types prüfen: `backend/src/types/api.ts`
2. Frontend Types synchronisieren: `frontend/src/types/api.ts`
3. API Contract Tests laufen lassen
4. Beide Seiten deployen

### Prevention
- Immer API Contract Tests vor Deploy ausführen
- Backend/Frontend Types synchron halten
- Breaking Changes dokumentieren
- Code Review Checklist befolgen

---

## Falsche Skin-Preise (Veraltet oder komplett falsch)
---------------------------------------------------

**Problem**: Skin-Preise sind veraltet oder komplett falsch (z.B. 0,06€ statt 26€)

**Symptome**:
* Preise weichen stark von Steam-Preisen ab
* Available Listings sind falsch
* Market Statistics stimmen nicht überein
* Preise wurden seit Wochen nicht aktualisiert

**Root Cause**: 
- Render Cronjobs laufen NICHT ohne Premium Plan
- `updateSkinPrices.js` Script wird nicht automatisch ausgeführt
- Alte Preisdaten in der Datenbank

**Sofort-Lösung: Manuelle Preis-Aktualisierung**

1. **Admin-Panel verwenden** (Empfohlen):
   - Öffne `/admin/update-prices` im Browser
   - Klicke "Update All Skins" für alle Skins
   - ODER gib eine Skin-ID ein für einzelnen Update
   - Warte bis der Update abgeschlossen ist (Log-Output beobachten)

2. **API direkt aufrufen** (Alternative):
   ```powershell
   # Einzelnen Skin updaten
   $body = @{ skinIds = @(19829) } | ConvertTo-Json
   Invoke-RestMethod -Uri "https://cs2-skintracker.onrender.com/api/v1/admin/update-skin-data" -Method POST -ContentType "application/json" -Body $body
   
   # Alle Skins updaten
   $body = @{} | ConvertTo-Json
   Invoke-RestMethod -Uri "https://cs2-skintracker.onrender.com/api/v1/admin/update-skin-data" -Method POST -ContentType "application/json" -Body $body
   ```

**Dauerhafte Lösung: GitHub Actions**

GitHub Actions führen automatisch täglich Preis-Updates durch (kostenlos!):

1. **Workflows sind bereits eingerichtet**:
   - `.github/workflows/update-skin-prices.yml` - Tägliche Preis-Updates (02:00 UTC)
   - `.github/workflows/save-price-history.yml` - Speichert Price History (03:00 UTC)
   - `.github/workflows/save-quantity-history.yml` - Speichert Quantity History (03:30 UTC)

2. **GitHub Secrets konfigurieren**:
   - Gehe zu GitHub > Settings > Secrets and variables > Actions
   - Füge hinzu:
     - `DATABASE_URL` - Deine Supabase Connection String
     - `STEAMWEBAPI_KEY` - Dein Steam WebAPI Key

3. **Manuell triggern** (für sofortigen Update):
   - Gehe zu GitHub > Actions
   - Wähle "Update Skin Prices Daily"
   - Klicke "Run workflow"
   - Warte bis der Workflow abgeschlossen ist (ca. 5-10 Minuten)

**Preis-Update Ablauf**:
1. **02:00 UTC**: `updateSkinPrices.js` läuft → holt aktuelle Preise von SteamWebAPI
2. **03:00 UTC**: `savePriceHistory.js` läuft → speichert tägliche Price History
3. **03:30 UTC**: `saveQuantityHistory.js` läuft → speichert Offer Volume History

**Monitoring**:
- Check GitHub Actions Tab für Status der Workflows
- Logs zeigen Details zu Updates (Anzahl Skins, Fehler, Dauer)
- Admin-Panel zeigt Update-Status in Echtzeit

**Verhindern von falschen Preisen**:
1. GitHub Actions Workflows müssen aktiviert bleiben
2. Secrets müssen aktuell sein
3. API Keys müssen gültig sein (Steam WebAPI Key prüfen)
4. Bei Problemen: Admin-Panel verwenden für manuelle Updates

---

## Falsche "Source Case" Anzeige (P90 Collection etc.)

**Problem**: Skin-Detail-Seiten zeigen falsche "Source Case" wie "P90 Collection" statt echter Cases.

**Symptome**:
* Skin zeigt "P90 Collection" als "Source Case"
* Link führt zu "Error loading case"
* Falsche Collection-Namen basierend auf weaponType

**Root Cause**: 
* Backend-Endpoints erstellten künstliche Collections basierend auf `weaponType`
* `/skins/:skinId/case-info` Endpoint generierte "P90 Collection" etc.
* `getSkinCase` Controller erstellte weaponType-basierte Collections

**Lösung (Implementiert)**:
1. **Entfernt**: `/skins/:skinId/case-info` Endpoint (erstellte künstliche Collections)
2. **Deaktiviert**: `getSkinCase` Controller (erstellte weaponType-basierte Collections)
3. **Behoben**: `/skins/:skinId` Route Handler (entfernte weaponType-basierte caseInfo Erstellung)
4. **Verwendet**: Nur echte `CaseSkin` Beziehungen aus der Datenbank

**Verifikation**:
* Skins mit echten Case-Beziehungen zeigen korrekte "Source Case"
* Skins ohne Case-Beziehung zeigen keine "Source Case" Section
* Keine künstlichen "P90 Collection" etc. mehr
* Links funktionieren nur bei echten Cases

**Frontend-Logic**:
```tsx
{/* Source Section - nur bei echter Case-Beziehung */}
{skin?.caseInfo && skin.caseInfo.id && skin.caseInfo.name && (
  <Card>
    <CardHeader>
      <CardTitle>Source Case</CardTitle>
    </CardHeader>
    <CardContent>
      <h3>{skin.caseInfo.name}</h3>
      <Link href={`/cases/${skin.caseInfo.id}`}>
        <Button>View Case</Button>
      </Link>
    </CardContent>
  </Card>
)}
```

**Backend-Logic**:
```javascript
// Nur echte Case-Beziehungen aus CaseSkin table
if (skin.caseSkins && skin.caseSkins.length > 0) {
  const firstCase = skin.caseSkins[0].case;
  responseData.caseInfo = {
    id: firstCase.id,
    name: firstCase.name
  };
}
```

---

## Getting Help
--------------

1. **Check logs first**:
   ```bash
   # Backend logs
   cd backend && npm start
   
   # Frontend logs  
   cd frontend && npm run dev
   ```

2. **Run diagnostic scripts**:
   ```bash
   # Database health
   NODE_ENV=development node scripts/checkAllTables.js
   
   # Price data check
   NODE_ENV=development node scripts/checkPriceData.js
   ```

3. **Check environment**:
   ```bash
   # Environment variables
   NODE_ENV=development node scripts/checkEnv.js
   
   # Database connection
   NODE_ENV=development node scripts/checkDatabase.js
   ```

4. **Verify API endpoints**:
   ```bash
   # Test API directly
   curl http://localhost:3001/api/v1/skins?limit=5
   curl http://localhost:3001/api/v1/portfolio
   ```