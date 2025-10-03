# API Keys & External Services

## 🔑 SteamWebAPI.com Integration

### Current Setup
- **Service**: [SteamWebAPI.com](https://www.steamwebapi.com/api/doc/steam-market-api)
- **Environment Variable**: `STEAM_API_KEY` (in Render)
- **Status**: ✅ **Working** - 26,017 CS2 items available
- **Update Frequency**: Every hour
- **Data Coverage**: CS2, CSGO, Rust, Dota items

### What We Get
- **Real-time market prices** (pricelatest, pricelatestsell, etc.)
- **Historical price data** (24h, 7d, 30d, 90d)
- **Market statistics** (sold24h, sold7d, offervolume, etc.)
- **Item metadata** (rarity, quality, wear, itemgroup, etc.)
- **Third-party marketplace integration** (DMarket, Skinport, etc.)

### API Endpoints Used
```javascript
// Get all CS2 items
GET https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}

// Get CS2 items only
GET https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2

// Get container/case items
GET https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&itemgroup=container
```

### Response Format
```json
{
  "id": "79f5a6d3-266a-419b-ad5b-f622f63d3060",
  "markethashname": "M4A1-S | Printstream (Factory New)",
  "marketname": "M4A1-S | Printstream (Factory New)",
  "pricelatest": 509.18,
  "pricelatestsell": 510.86,
  "pricemedian": 552.3,
  "priceavg": 546.94,
  "pricemin": 421.81,
  "pricemax": 760.11,
  "sold24h": 5,
  "sold7d": 10,
  "sold30d": 64,
  "itemgroup": "rifle",
  "itemtype": "m4a1-s",
  "itemname": "printstream",
  "rarity": "covert",
  "quality": "normal",
  "isstattrack": 0,
  "isstar": 0
}
```

## ❌ Official Steam API (Not Used)

### Why Not Used
- **No market data access** - Only basic player data
- **403 Forbidden** - Our key doesn't have CS2 permissions
- **Limited functionality** - No pricing, no market statistics

### What We Tried
```javascript
// These endpoints return 403 Forbidden
GET https://api.steampowered.com/IEconItems_730/GetSchema/v2/?key=${STEAM_API_KEY}
GET https://api.steampowered.com/IEconItems_730/GetPlayerItems/v1/?key=${STEAM_API_KEY}
```

## 🚀 Implementation Status

### ✅ What's Working
- **26,017 CS2 items** loaded from SteamWebAPI.com
- **698 cases** identified and available
- **Real market data** for prices and statistics
- **Hourly updates** from SteamWebAPI.com

### 🔄 What's Next
- **Replace generated data** with real SteamWebAPI.com data
- **Implement automatic updates** from SteamWebAPI.com
- **Add price history tracking** using historical data
- **Integrate third-party marketplace data**

## 📝 Environment Variables

### Required in Render
```bash
STEAM_API_KEY=your_steamwebapi_key_here
```

### Local Development
```bash
# .env file
STEAM_API_KEY=your_steamwebapi_key_here
```

## 🛠️ Testing Scripts

### Test SteamWebAPI.com Connection
```bash
cd backend
node scripts/testSteamWebAPI.js
```

### Test Official Steam API (Not Working)
```bash
cd backend
node scripts/testSteamAPIKey.js
```

## 📊 Data Sources

| Source | Status | Items | Cases | Prices | Updates |
|--------|--------|-------|-------|--------|---------|
| SteamWebAPI.com | ✅ Working | 26,017 | 698 | ✅ Real | Hourly |
| Official Steam API | ❌ Blocked | 0 | 0 | ❌ None | N/A |
| Generated Data | ✅ Fallback | 52 | 52 | ⚠️ Fake | Manual |

## 🔧 Troubleshooting

### Common Issues
1. **403 Forbidden** - Wrong API key or expired
2. **No data** - Check SteamWebAPI.com status
3. **Rate limits** - Add delays between requests
4. **Missing prices** - Some items may not have market data

### Solutions
1. **Verify API key** in SteamWebAPI.com dashboard
2. **Check service status** at steamwebapi.com
3. **Implement rate limiting** (2+ seconds between requests)
4. **Use fallback data** for items without prices
