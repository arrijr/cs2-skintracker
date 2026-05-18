# Business Context - CS2 Skin Tracker

**What problem are we solving?**

Counter-Strike 2 players and traders need **real-time, accurate pricing data** for in-game cosmetic items. Currently:
- Prices scattered across 3+ websites
- No historical price trends
- Manual tracking = time waste
- No API for integration

**Our Solution**

CS2 Skin Tracker: Centralized API providing:
- Live skin prices (Steam Community Market + SkinBaron fallback)
- 90-365 day price history with trends
- REST API for developers to integrate
- Tier-based pricing: Free (view only) → Pro (10k API calls/day) → Enterprise (unlimited)

---

## 👥 Users

### Primary Users (B2C)
- **CS2 traders** — Track profits, predict price movements
- **Casinos/betting sites** — Need accurate odds/valuations
- **Content creators** — Show viewers live prices
- **Portfolio trackers** — Manage virtual inventories

### Secondary Users (B2B)
- **Third-party apps** — integrate pricing via API
- **Trading bots** — automated arbitrage
- **Analytics platforms** — historical data

---

## 💰 Revenue Model

| Tier | Monthly | Limits | Use Case |
|------|---------|--------|----------|
| **Free** | €0 | View only, no API | Casual players |
| **Pro** | €4.99 | 10k API calls/day, 5 API keys | Small traders, apps |
| **Enterprise** | €99/mo | Unlimited calls, dedicated support | Trading bots, platforms |

---

## 📊 Market Context

- **Market Size**: ~40M CS2 players, millions of skin traders
- **Competitors**: 3-4 fragmented price trackers (no unified API)
- **Opportunity**: Become the "Bloomberg" of CS2 pricing
- **Timeline**: MVP → Launch → Scale

---

## 🎯 Success Metrics

**Phase 1 (Sprint 1-2)**: Get API stable, launch pricing feature
- All endpoints tested ✅
- 99%+ uptime
- <100ms response times

**Phase 2 (Q2 2026)**: Marketing & user growth
- 1000+ registered users
- 100+ API key customers
- $2k MRR from Pro + Enterprise

**Phase 3 (Q3 2026)**: Product expansion
- Mobile app
- Advanced analytics (volatility, trading patterns)
- Custom alerts

---

## 🔐 Data Privacy & Trust

- **User data**: Encrypted, PII protected
- **API keys**: Hashed (SHA-256), never logged
- **Webhooks**: Stripe signature verified
- **Compliance**: GDPR ready (user deletion, data export)

---

## 🚀 Non-Negotiables

1. **Speed**: API must be <100ms p95
2. **Accuracy**: Prices match Steam Community Market within 5 minutes
3. **Reliability**: 99.5%+ uptime
4. **Security**: No leaked credentials, proper auth
5. **Scalability**: Handle 1000s of API keys without degradation

---

See: [[../docs/00-Index|Project Hub]]
