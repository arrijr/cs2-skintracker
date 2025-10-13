# CS2 Skin Price Tracker

**Professional price tracking and portfolio management platform for Counter-Strike 2 skins with automated data collection, portfolio analytics, and intelligent alerting system.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-blue.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6+-indigo.svg)](https://www.prisma.io/)

---

## 🚀 Overview

A full-stack web application that provides comprehensive CS2 skin price tracking with real-time market data, portfolio management, watchlist functionality, and automated background processing for price updates and alerts.

### Key Features

- **🔐 User Authentication** - Secure JWT-based registration and login
- **👀 Watchlist Management** - Track up to 5 skins (free tier) with customizable price alerts
- **📊 Portfolio Tracking** - Monitor your skin investments with daily value calculations
- **📈 Price History** - Comprehensive historical data with interactive charts
- **📧 Smart Alerts** - Email notifications when price targets are reached
- **🤖 Background Agent** - Automated daily price updates and portfolio calculations
- **🎯 Steam API Integration** - Real-time data from Steam Community Market

---

## 🏗️ Architecture

### Backend Stack
- **Node.js + Express** - RESTful API server
- **PostgreSQL + Prisma ORM** - Database and query management
- **JWT Authentication** - Secure user sessions
- **Node-Cron** - Background job scheduling
- **Nodemailer** - Email notification system

### Frontend Stack
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Interactive price charts
- **Axios** - HTTP client for API communication

### Background Processing
- **Daily Price Updates** (02:00 UTC) - Updates all skin prices via Steam API
- **Portfolio Calculations** (02:10 UTC) - Calculates daily portfolio values
- **Price Alert Monitoring** (Every 30 minutes) - Checks and sends alerts

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb cs2skindb

# Or using psql
psql -U postgres -c "CREATE DATABASE cs2skindb;"
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npx prisma migrate dev --name init
npx prisma generate

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Setup environment variables  
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/v1/health

---

## 🔧 Configuration

### Backend Environment Variables (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cs2skindb"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-key"

# Email Service (for alerts)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Background Agent Configuration
UPDATE_ALL_SKINS=true
PRICE_UPDATE_BATCH_SIZE=1000
PRICE_UPDATE_GLOBAL_DELAY_MS=40
PRICE_UPDATE_RETRIES=2
RUN_SCHEDULER=true

# Steam API (optional for enhanced data)
STEAM_WEB_API_KEY="your-steam-api-key"
```

### Frontend Environment Variables (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

---

## 🤖 Background Agent

The background agent handles automated tasks to keep data fresh and users informed:

### Cron Jobs Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| **Price Updates** | Daily 02:00 UTC | Updates all skin prices from Steam API |
| **Portfolio History** | Daily 02:10 UTC | Calculates and stores daily portfolio values |
| **Price Alerts** | Every 30 minutes | Checks watchlist alerts and sends notifications |

### Price Update Process
1. **Batch Processing** - Processes skins in configurable batches (default: 1000)
2. **Multi-Source Data** - Primary: steamwebapi.com, Fallback: Steam Community Market
3. **Comprehensive Updates** - Current prices, historical data, market statistics
4. **Rate Limiting** - Configurable delays to respect API limits
5. **Error Handling** - Retry logic with exponential backoff

### Monitoring & Health Checks
```bash
# Check recent price updates
GET /api/v1/health/cron-status

# Manual price update (testing)
cd backend && node scripts/updateSkinPrices.js

# Check portfolio calculations
cd backend && node scripts/checkPortfolioHistory.js
```

---

## 📊 Database Schema

### Core Models

**Users**
- Authentication and profile management
- Premium tier support (prepared)

**Skins** 
- Steam market data with comprehensive pricing information
- Historical price tracking with 30+ data fields

**Watchlist**
- User-specific skin monitoring
- Configurable price alerts

**Portfolio**
- Investment tracking with purchase history
- Automated value calculations

**PriceHistory**
- Daily price snapshots for trending analysis
- Portfolio value history

---

## 🛡️ Security & Privacy

- **Password Security** - bcrypt hashing with salt rounds
- **JWT Authentication** - Stateless session management
- **Input Validation** - Comprehensive request sanitization
- **Rate Limiting** - API abuse prevention
- **GDPR Compliance** - Privacy by design principles
- **No Steam Credentials** - OAuth-only integration (planned)

---

## 📈 API Documentation

### Authentication
```http
POST /api/v1/users/register
POST /api/v1/users/login
```

### Skin Management
```http
GET /api/v1/skins/search?q={query}
GET /api/v1/skins/:id
GET /api/v1/skins/:id/price-history
```

### Watchlist
```http
GET /api/v1/watchlist
POST /api/v1/watchlist
DELETE /api/v1/watchlist/:id
PUT /api/v1/watchlist/:id/alert
```

### Portfolio
```http
GET /api/v1/portfolio
POST /api/v1/portfolio
DELETE /api/v1/portfolio/:id
GET /api/v1/portfolio/history
```

---

## 🚧 Development

### Project Structure
```
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   ├── routes/          # API routes
│   │   ├── cron/           # Background jobs
│   │   └── prisma/         # Database client
│   ├── scripts/            # Utility scripts
│   └── prisma/             # Database schema
├── frontend/
│   └── src/
│       ├── app/            # Next.js pages
│       ├── components/     # React components
│       ├── lib/           # Utilities
│       └── context/       # State management
```

### Development Scripts
```bash
# Backend
npm run dev          # Start development server
npm run start        # Start production server

# Frontend  
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Database GUI
npx prisma migrate dev  # Run migrations
```

---

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- [x] User authentication and management
- [x] Skin search and watchlist functionality
- [x] Portfolio tracking with price history
- [x] Background agent for automated updates
- [x] Email alert system

### Phase 2: Enhanced Features 🚧
- [ ] Steam OpenID integration
- [ ] Inventory import and tracking
- [ ] Advanced charting and analytics
- [ ] Mobile responsive improvements

### Phase 3: Premium Features 📋
- [ ] Extended watchlist (50+ items)
- [ ] Multiple price alerts per user
- [ ] Portfolio comparison tools
- [ ] CSV/Excel export functionality
- [ ] Multi-marketplace price comparison

### Phase 4: Advanced Analytics 🔮
- [ ] Predictive price modeling
- [ ] Market trend analysis
- [ ] Arbitrage opportunity detection
- [ ] Investment performance metrics

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cs2-skin-tracker/issues)
- **Documentation**: This README and inline code comments
- **Health Monitoring**: `/api/v1/health` endpoints for system status

---

*Built with ❤️ for the CS2 trading community*