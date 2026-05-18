# Sprint 2: Price Update Service

**Status**: 🟡 PLANNING  
**Planned Duration**: 3-4 days (30 hours)  
**Start Date**: May 6, 2026  
**Dependencies**: [[../01-Sprint1/README|Sprint 1]] ✅ Complete

---

## 📦 What Will Be Built

### 1. Price Fetching Service
- **Steam Community Market API** (free, no API key needed)
  - Primary data source
  - Rate limited to 1 req/second
  - Caching for efficiency
- **SkinBaron API** (free fallback)
  - Alternative if Steam fails
  - Fallback for new items
- **Database Storage**
  - Historical prices stored
  - 365-day retention
  - Daily snapshots

### 2. GitHub Actions Workflow
- **Daily Automation**
  - Runs at 02:00 UTC
  - Fetches prices from APIs
  - Updates database
  - No Render Premium needed (saves €19/mo!)
- **Error Handling**
  - Retry logic on failures
  - Email notifications
  - Slack alerts optional

### 3. Frontend Components (Partial)
- **Pricing Page**
  - Display current prices
  - Price charts (30/90 day trends)
  - Tier comparison table
- **Stripe Checkout Button**
  - Redirect to checkout
  - Pre-fill customer data
  - Success/cancel handling

---

## 🎯 Objectives

- [ ] Price fetching service (Steam + SkinBaron)
- [ ] GitHub Actions workflow configured
- [ ] Database populated with historical prices
- [ ] Frontend pricing page component
- [ ] Stripe checkout button integration
- [ ] Error handling & monitoring
- [ ] Documentation complete

---

## 🏗️ Architecture

```
GitHub Actions (Daily 02:00 UTC)
    ↓
Price Fetching Service
    ├─ Steam Community API (primary)
    └─ SkinBaron API (fallback)
    ↓
Database (Skin + Price History)
    ↓
Frontend (Charts + Pricing Page)
    ↓
Users see live prices
```

---

## 📊 Data Flow

```
Steam API Returns
  {
    "skin_id": "dragon-lore",
    "current_price": 5000,
    "updated_at": "2026-05-06T02:00:00Z"
  }
    ↓
Price Service Updates DB
  Skin.currentPrice = 5000
  PriceHistory.add({ date, price, change })
    ↓
Frontend Displays
  "Dragon Lore: $5000 (+2.5%)"
```

---

## 📅 Timeline

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| **Day 1** | Price service setup + Steam API integration | 8 | ⏳ |
| **Day 1** | SkinBaron fallback + error handling | 4 | ⏳ |
| **Day 2** | GitHub Actions workflow | 4 | ⏳ |
| **Day 2** | Database seeding + historical data | 4 | ⏳ |
| **Day 3** | Frontend pricing page | 6 | ⏳ |
| **Day 3** | Stripe checkout button | 4 | ⏳ |
| **Day 4** | Testing + documentation | 6 | ⏳ |
| **Total** | | **36 hours** | |

---

## 🔌 APIs

### Steam Community Market API
```
GET https://steamcommunity.com/market/pricehistory
  ?country=US
  &currency=1
  &appid=730
  &market_name=Dragon%20Lore

Response: JSON with price history
Rate Limit: 1 request/second
Auth: None needed
Cost: Free
```

### SkinBaron API
```
GET https://api.skinbaron.de/api/v2/sales/history
  ?name=Dragon%20Lore
  &limit=100

Response: JSON with price data
Rate Limit: 10 requests/minute
Auth: None needed
Cost: Free
```

---

## 🛠️ Implementation Plan

### Phase 1: Price Service (Day 1)
```javascript
// services/price-service.js
async function fetchPriceFromSteam(skinName) {
  // Call Steam API
  // Return { price, updatedAt, source }
}

async function fetchPriceFromSkinBaron(skinName) {
  // Fallback to SkinBaron
  // Return { price, updatedAt, source }
}

async function updateAllSkinPrices() {
  // For each skin:
  //   Try Steam, fallback to SkinBaron
  //   Update database
  //   Log history
}
```

### Phase 2: GitHub Actions (Day 2)
```yaml
# .github/workflows/price-update.yml
name: Daily Price Update
on:
  schedule:
    - cron: '0 2 * * *'  # 02:00 UTC daily
jobs:
  update-prices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update prices
        run: npm run prices:update
```

### Phase 3: Frontend (Day 3)
```jsx
// components/PricingPage.jsx
function PricingPage() {
  const [prices, setPrices] = useState([]);
  const [chart, setChart] = useState(null);
  
  useEffect(() => {
    fetchSkinPrices();
  }, []);
  
  return (
    <div>
      <PriceChart data={chart} />
      <SkinsTable prices={prices} />
      <StripeCheckoutButton />
    </div>
  );
}
```

---

## 📊 Database Schema (Updates)

### Skin Model (Add)
```prisma
model Skin {
  id String @id
  name String
  rarity String
  
  // Price tracking
  currentPrice Float
  lastPriceUpdate DateTime
  priceSource String  // "steam" | "skinbaron"
  
  // Relations
  priceHistory PriceHistory[]
}

model PriceHistory {
  id String @id
  skinId String
  date DateTime
  price Float
  change Float?         // price change from previous day
  changePercent Float?  // percent change
  source String        // "steam" | "skinbaron"
  
  skin Skin @relation(fields: [skinId], references: [id])
}
```

---

## 🔐 Security Considerations

- API keys not needed (both Steam and SkinBaron are free, no auth)
- Rate limiting built in (1 req/sec for Steam)
- Error handling prevents API hammering
- GitHub Actions secrets not needed (no auth required)
- Database access via existing auth (Prisma client)

---

## 🧪 Testing Plan

### Unit Tests
- [ ] Steam API parsing
- [ ] SkinBaron API fallback
- [ ] Price history calculation
- [ ] Error handling

### Integration Tests
- [ ] Database price updates
- [ ] GitHub Actions trigger
- [ ] Frontend price display

### Load Tests
- [ ] Can fetch 2000+ skin prices in <5 minutes
- [ ] Handles API failures gracefully
- [ ] Caching prevents rate limit issues

---

## 📈 Success Metrics

- ✅ All prices updated daily
- ✅ <1% API failure rate
- ✅ Frontend displays prices in <500ms
- ✅ Historical data retained for 365 days
- ✅ GitHub Actions runs without manual intervention

---

## 💡 Technical Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|----------------------|
| Steam API first | Free, no auth, most data | SkinBaron only |
| GitHub Actions | Free CI/CD, no infrastructure | Render cron job (€19/mo) |
| Price caching | Prevent API hammering | Real-time fetch (rate limit issues) |
| 365-day retention | Balance storage vs history | 90-day only (less useful) |
| Daily 02:00 UTC | Off-peak hours | Peak hours (API load) |

---

## 🔗 Dependencies

- ✅ **Sprint 1**: API endpoints for frontend to use
- ✅ **Database**: Skin and User models
- ⏳ **Steam API**: Free access (no setup needed)
- ⏳ **GitHub Actions**: Free (already in repo)
- ⏳ **React**: For pricing page component

---

## 📚 Documentation Needed

- [ ] Price service API reference
- [ ] GitHub Actions workflow guide
- [ ] Maintenance procedures
- [ ] Troubleshooting price update failures
- [ ] Frontend component usage guide

---

## 🚀 Production Deployment

**Before Production**:
- [ ] Test price fetching for 7 days
- [ ] Verify historical data accuracy
- [ ] Load test API calls
- [ ] Monitor GitHub Actions runs
- [ ] Verify frontend displays correctly

**Deployment Steps**:
1. Merge to main branch
2. GitHub Actions auto-enables (schedule activation)
3. First run triggers at next 02:00 UTC
4. Monitor logs for errors
5. Verify database population
6. Deploy frontend

---

## ⚠️ Known Risks

| Risk | Mitigation | Contingency |
|------|-----------|-------------|
| Steam API rate limit | 1 req/sec cache | SkinBaron fallback |
| API service downtime | Retry logic with exponential backoff | Use previous price |
| Price spikes/errors | Validate price range | Log anomaly, manual review |
| GitHub Actions limits | Runs at off-peak | Fallback to manual trigger |

---

## 📞 Integration Points

- **Sprint 1 API**: `/api/public/skins` reads updated prices
- **Frontend**: Components fetch from `/api/public/skins?sortBy=price`
- **Stripe**: Pricing page displays subscription options
- **Database**: PriceHistory table logs all changes

---

## 🎓 Learning Goals

- Integrate external free APIs
- Implement automated workflows (GitHub Actions)
- Handle API failures and retries
- Cache and rate limiting strategies
- Historical data analysis

---

## Next Steps

1. [ ] Finalize price API selection
2. [ ] Set up GitHub Actions repository
3. [ ] Implement price service locally
4. [ ] Test with sample data
5. [ ] Deploy to production

---

**Sprint 2 Status**: 🟡 PLANNING  
**Start Date**: May 6, 2026  
**Last Updated**: May 5, 2026

See: [[../../00-Index|Project Hub]]
