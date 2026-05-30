# CS2 Skin Tracker - Kostenlose Datenquellen Analysis

**Update**: Keine SteamWebAPI.com bezahlt (zu teuer)  
**Ziel**: Nur kostenlose APIs/Scraping verwenden  

---

## 🎯 Kostenlose Datenquellen für CS2 Skins

### Option 1: Steam Community Market API ⭐ EMPFOHLEN
```
Status: ✅ KOSTENLOS, Offiziell von Valve
URL: https://steamcommunity.com/market/priceoverview/
Methode: HTTP GET request (JSON response)

Beispiel:
GET https://steamcommunity.com/market/priceoverview/?appid=730&market_hash_name=StatTrak%E2%84%A2%20M4A4%20%7C%20Howl%20%28Factory%20New%29&json=1

Response:
{
  "success": true,
  "lowest_price": "€1,234.56",
  "volume": "120",
  "median_price": "€1,250.00"
}
```

**Pros**:
- ✅ 100% kostenlos
- ✅ Offiziell von Valve
- ✅ Keine API Key nötig
- ✅ Alle Skins vorhanden
- ✅ Real-time Preise

**Cons**:
- ⚠️ Rate-Limits (sehr streng, ~1 req/sec)
- ⚠️ Kein Verlauf (nur aktueller Preis)
- ⚠️ Kein Supply/Demand Daten
- ⚠️ Braucht URL-Encoding für Skin-Namen

**Rate-Limiting**:
- ~1 request pro Sekunde
- Bei zu schnell → 429 Too Many Requests
- Lösungen: Caching + Delays

---

### Option 2: SkinBaron API ⭐ GUTE ALTERNATIVE
```
Status: ✅ KOSTENLOS, Inoffiziell (aber zuverlässig)
URL: https://api.skinbaron.com/
Datenquellen: SkinBaron Marketplace (Millionen Trades)

Endpoints:
GET /api/v2/Market/GetItems
GET /api/v2/Skin/{itemId}/history

Beispiel Response:
{
  "items": [
    {
      "classId": 1234,
      "marketHashName": "M4A4 | Howl (Factory New)",
      "averagePrice": 1250,
      "lowestPrice": 1200,
      "highestPrice": 1300,
      "volume": 150
    }
  ]
}
```

**Pros**:
- ✅ Kostenlos
- ✅ Supply/Demand Daten
- ✅ Historical Trends
- ✅ Bessere Rate-Limits als Steam

**Cons**:
- ⚠️ Inoffiziell (könnte ändern/verschwinden)
- ⚠️ Dokumentation ist minimal
- ⚠️ Abhängig von SkinBaron Marketplace (nicht alle Skins)

---

### Option 3: CSGOFloat API ⭐ KLEIN ABER KOSTENLOS
```
Status: ✅ KOSTENLOS, Community-Projekt
URL: https://api.csgofloat.com/

Endpoints vorhanden aber begrenzt
Haupt-Use: Float checking (nicht für Preise)

Nicht ideal für Preise, eher für Item-Details
```

---

### Option 4: Web Scraping (RISKY aber kostenlos)
```
Targets: 
  - Buff.163 (Chinese marketplace, aber vielen Preisen)
  - CSGOGo.com
  - SkinMart.com
  - Andere Marketplaces

Methode: 
  - Puppeteer/Playwright für JavaScript rendering
  - BeautifulSoup (Python)
  - Cheerio (Node.js)

Risiko:
  ⚠️ Terms of Service violation?
  ⚠️ IP bans
  ⚠️ HTML-Struktur ändert sich → broken scraper
  
Nur als Fallback verwenden!
```

---

## 🏆 MEINE EMPFEHLUNG: Hybrid-Ansatz (KOSTENLOS)

### Strategie: Multi-Source für Redundanz

```javascript
// Priorität für Datenquellen:
1. Steam Community Market API    (Primary, offiziell, kostenlos)
2. SkinBaron API                 (Secondary, inoffiziell, kostenlos)
3. Cache Layer                   (Last 24h Prices lokal speichern)
4. Fallback: Cached Prices       (Wenn beide APIs down sind)
```

### Implementation:

```javascript
// lib/price-service.js
const STEAM_API_URL = 'https://steamcommunity.com/market/priceoverview/'
const SKINBARON_API = 'https://api.skinbaron.com/api/v2/Market/GetItems'

async function getSkimPrice(appId, marketHashName) {
  // 1. Versuch: Steam Market API
  try {
    const steamPrice = await fetchSteamPrice(appId, marketHashName)
    await cache.set(`price_${marketHashName}`, steamPrice, 3600) // 1h cache
    return {
      source: 'steam',
      price: steamPrice,
      timestamp: Date.now()
    }
  } catch (err) {
    console.warn(`Steam API failed for ${marketHashName}`, err.message)
  }

  // 2. Versuch: SkinBaron API
  try {
    const baronPrice = await fetchSkinBaronPrice(marketHashName)
    await cache.set(`price_${marketHashName}`, baronPrice, 3600)
    return {
      source: 'skinbaron',
      price: baronPrice,
      timestamp: Date.now()
    }
  } catch (err) {
    console.warn(`SkinBaron API failed for ${marketHashName}`, err.message)
  }

  // 3. Fallback: Cache
  const cachedPrice = await cache.get(`price_${marketHashName}`)
  if (cachedPrice) {
    return {
      source: 'cache',
      price: cachedPrice,
      timestamp: Date.now(),
      warning: 'Using cached price (APIs unavailable)'
    }
  }

  // 4. Last Resort: Return null
  throw new Error(`Could not fetch price for ${marketHashName}`)
}

// Rate-Limited Fetcher (important für Steam!)
async function fetchSteamPrice(appId, marketHashName) {
  // Wait vor jedem Request (avoid rate limiting)
  await sleep(1000) // 1 second delay
  
  const url = `${STEAM_API_URL}?appid=${appId}&market_hash_name=${encodeURIComponent(marketHashName)}&json=1`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Steam API returned ${response.status}`)
  }
  
  const data = await response.json()
  if (!data.success) {
    throw new Error('Steam API returned success=false')
  }
  
  // Parse price (remove currency symbol and convert to number)
  const priceStr = data.lowest_price.replace(/[€$£]/g, '').replace(',', '.')
  return parseFloat(priceStr)
}

async function fetchSkinBaronPrice(marketHashName) {
  const response = await fetch(`${SKINBARON_API}?search=${encodeURIComponent(marketHashName)}`)
  const data = await response.json()
  
  if (!data.items || data.items.length === 0) {
    throw new Error(`SkinBaron: No item found for ${marketHashName}`)
  }
  
  return data.items[0].averagePrice
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

---

## ⚡ PERFORMANCE OPTIMIERUNGEN

### 1. Caching Strategy
```javascript
// Cache mehrere Stunden, nicht nur 1 Stunde
const CACHE_TTL = {
  live_prices: 3600,        // 1 hour (aktuell)
  historical: 86400,         // 24 hours
  market_stats: 1800         // 30 min
}

// Bei Startup: Pre-load Top 100 Skins
async function initializeCache() {
  const topSkins = await getTop100Skins()
  for (const skin of topSkins) {
    const price = await getSkimPrice(730, skin.marketHashName)
    await cache.set(`price_${skin.marketHashName}`, price, CACHE_TTL.live_prices)
  }
}
```

### 2. Batch Processing (statt einzelne Requests)
```javascript
// Nicht ideal: Einzelne Requests
for (let skin of skins) {
  const price = await getSkimPrice(730, skin.marketHashName)
}

// Besser: Batch mit Delays
async function batchGetPrices(skins, delayMs = 1100) {
  const results = []
  for (const skin of skins) {
    const price = await getSkimPrice(730, skin.marketHashName)
    results.push(price)
    await sleep(delayMs) // Wait zwischen requests
  }
  return results
}
```

### 3. Background Updates (GitHub Actions)
```yaml
# .github/workflows/update-prices-daily.yml
name: Daily Price Update

on:
  schedule:
    - cron: '0 */6 * * *'  # Alle 6 Stunden

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update prices
        run: |
          node scripts/update-prices.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 📊 DATENQUALITÄT VERGLEICH

| Source | Kostenlos | Offiziell | Real-time | Verlauf | Rate-Limits | Zuverlässigkeit |
|--------|-----------|-----------|-----------|---------|-------------|-----------------|
| **Steam API** | ✅ | ✅ | ✅ | ❌ | Streng | ⭐⭐⭐⭐⭐ |
| **SkinBaron API** | ✅ | ❌ | ✅ | ✅ | Liberal | ⭐⭐⭐⭐ |
| **Scraping** | ✅ | ❌ | ✅ | ❌ | Sehr streng | ⭐⭐ |

**BESTE Option**: Steam + SkinBaron Hybrid

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Basis Setup (2-3 Tage)
```
□ Migrate vom SteamWebAPI.com zu Steam Community API
□ Implementiere SkinBaron als Fallback
□ Set up Cache Layer (Redis oder in-memory)
□ Test mit Top 50 Skins
□ Deploy zu Render
```

### Phase 2: Robustheit (2-3 Tage)
```
□ Error handling (beide APIs können fail)
□ Rate-limit handling (sleep between requests)
□ Monitoring (alerts wenn beide APIs down)
□ Fallback testing
```

### Phase 3: Optimierung (2-3 Tage)
```
□ Pre-load Top 100 Skins on startup
□ Background batch updates (GitHub Actions)
□ Historical price tracking (mit SkinBaron data)
□ Performance testing
```

---

## ⚠️ WICHTIG: RATE LIMITING HANDLING

Steam API ist **SEHR streng**:

```javascript
// FALSCH (wird IP-banned):
for (let i = 0; i < 1000; i++) {
  const price = await fetch(steam_url) // Zu schnell!
}

// RICHTIG:
const prices = []
for (let i = 0; i < 1000; i++) {
  const price = await fetch(steam_url)
  prices.push(price)
  await sleep(1100) // 1.1 second delay
}
```

**Best Practice**:
- 1 request pro Sekunde max
- Use exponential backoff bei 429 errors
- Cache aggressiv (nicht öfter als nötig)

---

## 💡 ALTERNATIVE: Aggregate von Daten

Statt **nur** Preise:
- Kombiniere Steam Market (aktueller Preis)
- SkinBaron (Trends + Supply)
- BitSkins (wenn API verfügbar)
- Dota2 Prices (für Vergleich)

Das macht dein Tool **einzigartig** vs. anderen!

---

## 🎯 FAZIT

### Kostenlos ist möglich! ✅

**Hybrid-Approach**:
1. **Primary**: Steam Community Market API (kostenlos, offiziell)
2. **Secondary**: SkinBaron API (kostenlos, inoffiziell)
3. **Cache**: Speichere 24h Prices lokal
4. **Result**: Zuverlässig + Kostenlos

### Aber mit Kompromiss:
- ⚠️ Nicht ganz real-time (Cache delay)
- ⚠️ Rate-limits müssen beachtet werden
- ⚠️ Historische Daten sind limitiert

### Für dein Business:
- ✅ Kostenlos bleiben
- ✅ Free Tier users bekommen akzeptable Daten
- ✅ Pro Tier könnten später zu bezahlter API upgraden
- ✅ Trotzdem profitabel!

---

## 📝 NÄCHSTE SCHRITTE

1. **Feedback**: Passt dieser Ansatz für dich?
2. **Entscheidung**: Steam + SkinBaron Hybrid starten?
3. **Phase 3**: Dann update ich den Implementation Plan ohne SteamWebAPI.com

**Sollen wir Phase 3 mit kostenloser Datenquellen neuschreiben?** 🚀
