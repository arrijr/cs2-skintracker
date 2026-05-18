# Architecture Decisions - CS2 Skin Tracker

Why we chose each technology and the trade-offs involved.

---

## Backend: Node.js + Express

**Decision**: Use Node.js with Express for the REST API  
**Alternatives Considered**: Python (Flask/FastAPI), Go, Rust  

**Why**:
- **JavaScript ecosystem** — React frontend + Node backend share language, easier code sharing
- **Express simplicity** — Minimal boilerplate, middleware pattern fits our needs
- **npm modules** — Rich ecosystem (Prisma, Stripe SDK, Clerk SDK, dotenv, etc.)
- **Deployment ease** — Vercel, Railway, Heroku all support Node seamlessly
- **Team familiarity** — Easier to onboard (JS is the web lingua franca)

**Trade-offs**:
- Slower than Go/Rust for compute-heavy tasks (not our bottleneck)
- Single-threaded by nature (handled by clustering/load balancing)
- Requires discipline to avoid callback hell (mitigated by async/await)

**How We Mitigate**:
- Use modern async/await, not callbacks
- Add TypeScript for type safety (optional but recommended in future)
- Monitor performance via GitHub Actions + error tracking

---

## Database: PostgreSQL + Prisma ORM

**Decision**: PostgreSQL for persistence, Prisma for ORM  
**Alternatives Considered**: MongoDB, MySQL, SQLite, raw SQL  

**Why**:
- **PostgreSQL strengths** — ACID compliance, JSON support, excellent for structured data (prices, users, API keys)
- **Prisma benefits** — Type-safe queries, automatic migrations, seed support, introspection
- **Relational fit** — Our domain is highly relational (skins → prices → users → API keys → webhooks)
- **JSON fields** — Can store metadata (skin condition, float values) in JSON columns without schema bloat
- **Scaling path** — Easy to add read replicas, connection pooling (pgBouncer) later

**Trade-offs**:
- PostgreSQL is heavier than SQLite for local dev (but we use Docker)
- Prisma adds a layer of abstraction (but generates clean migrations)
- Scaling up requires database tuning (connection pooling, indexes)

**How We Mitigate**:
- Prisma migrations tracked in git for reproducibility
- Seed script ensures consistent dev data
- Index strategy planned in sprint 2 (price lookups, user queries)

---

## Authentication: Clerk

**Decision**: Use Clerk for user authentication and JWT tokens  
**Alternatives Considered**: Auth0, Firebase Auth, Supabase Auth, custom JWT  

**Why**:
- **Zero password management** — No password resets, hashing, or breach risk
- **Social login** — Users can sign in with Google, GitHub (reduces friction)
- **JWT tokens** — API keys use JWT for stateless auth (scales horizontally)
- **SDK quality** — React component for sign-in, middleware for Express
- **Pricing** — Generous free tier (5k MAU), scales with users
- **Security** — JWKS endpoint for token verification, built-in rate limiting

**Trade-offs**:
- Third-party dependency (Clerk outage = auth outage)
- Vendor lock-in (migration requires rebuilding auth layer)
- Additional API call for token verification (minor, cached via JWKS)

**How We Mitigate**:
- Use Clerk's SDK properly (no custom JWT generation)
- Store CLERK_SECRET_KEY securely in .env (never in code)
- Plan for worst case: maintain fallback auth method for critical APIs
- Monitor Clerk status page before production launch

---

## Payments: Stripe

**Decision**: Use Stripe for subscription billing (Pro/Enterprise tiers)  
**Alternatives Considered**: Paddle, Lemonsqueezy, PayPal Billing, custom  

**Why**:
- **Industry standard** — Stripe is the default for SaaS (reduces user friction)
- **Webhook reliability** — Signed webhooks for subscription events (accurate billing)
- **Flexibility** — Support one-time charges, subscriptions, metered billing
- **Testing** — Test mode with fake card numbers (stripe/test token flow)
- **Dashboard** — Inspect transactions, refunds, subscription health
- **Compliance** — PCI compliance handled by Stripe (we never touch card data)

**Trade-offs**:
- 2.9% + $0.30 per transaction (necessary cost of payment processing)
- Webhook signature verification adds complexity (but required for security)
- Manual reconciliation needed if webhook delivery fails

**How We Mitigate**:
- Stripe webhook endpoint secured with signature verification
- Idempotent subscription creation (retry-safe)
- Implement webhook retry logic (exponential backoff)
- Monitor Stripe API status before production

---

## Rate Limiting: Token Bucket (GitHub Actions Daily Runs)

**Decision**: Use GitHub Actions scheduled tasks for daily price updates + token bucket for API rate limiting  
**Alternatives Considered**: Redis for rate limiting, database-backed queues, external scheduler  

**Why**:
- **Free infrastructure** — GitHub Actions is free for public repos (no additional service)
- **Simple logic** — Token bucket (rate limiting) fits in memory during request handling
- **Stateless** — Each request checks remaining tokens; tokens refresh daily
- **Predictable** — Scheduled runs mean we can batch price fetches efficiently

**Trade-offs**:
- In-memory token bucket resets on server restart (acceptable for MVP)
- GitHub Actions can have delay/reliability issues (acceptable for background tasks)
- No distributed rate limiting across multiple server instances (plan for later)

**How We Mitigate**:
- Implement graceful degradation (if GitHub Actions fails, manual override possible)
- Use Redis/persistent store in Sprint 3 if we scale horizontally
- Log rate limit violations for monitoring

---

## Documentation: Obsidian + Markdown

**Decision**: Use Obsidian vault with Markdown files for project documentation  
**Alternatives Considered**: Notion, Confluence, GitHub Wiki, linear docs  

**Why**:
- **Local-first** — Files stored locally, never uploaded to cloud
- **Bidirectional links** — Easy to cross-reference ([[docs/01-Sprint1/README]] links back)
- **Git-friendly** — Markdown diffs are readable, version control is native
- **No vendor lock-in** — Just Markdown files, can migrate easily
- **Free** — No subscription, open format
- **Linking** — [[guides/Architecture-Decisions]] syntax powers our knowledge graph

**Trade-offs**:
- No real-time collaboration (one editor at a time)
- Requires discipline to keep docs in sync with code
- No native permission controls (rely on git for access)

**How We Mitigate**:
- Update claude.md after each session (living working memory)
- Link guides from claude.md (single source of truth for navigation)
- Review and update docs as part of sprint retrospective

---

## Frontend: React

**Decision**: Use React for web UI  
**Alternatives Considered**: Vue, Svelte, plain HTML/JS  

**Why**:
- **Component ecosystem** — Rich component libraries (shadcn, MUI, etc.)
- **Developer experience** — Hot reload, dev tools, large community
- **Type safety** — TypeScript support out of the box
- **Native sharing** — Same language as backend (code sharing, type sharing)
- **Performance** — Virtual DOM, lazy loading, code splitting built-in

**Trade-offs**:
- Larger bundle size than alternatives
- Requires build step (webpack, Vite, etc.)
- Learning curve for new developers

**How We Mitigate**:
- Use Vite for fast dev server + production build
- Code splitting and lazy loading from day 1
- Component library (shadcn) for consistent UI

---

## Deployment: Vercel (Backend) + GitHub Pages/Vercel (Frontend)

**Decision**: Deploy backend on Vercel (serverless), frontend on Vercel or static hosting  
**Alternatives Considered**: AWS, Heroku, Railway, self-hosted  

**Why**:
- **Zero ops** — Vercel handles scaling, SSL, CDN automatically
- **GitHub integration** — Deploy on push, automatic previews
- **Serverless** — No server management, pay only for usage
- **Environment variables** — Built-in secrets management
- **Preview deployments** — Every PR gets a live preview URL
- **Logs** — Function logs visible in Vercel dashboard

**Trade-offs**:
- Cold starts on serverless functions (mitigated by Vercel's optimization)
- Vendor lock-in to Vercel ecosystem
- Cost scales with usage (acceptable for MVP)

**How We Mitigate**:
- Monitor cold start times (target <200ms for p95)
- Keep functions small and focused
- Use edge middleware for rate limiting/auth

---

## API Design: RESTful JSON

**Decision**: Use REST API with JSON payloads  
**Alternatives Considered**: GraphQL, gRPC  

**Why**:
- **Simplicity** — Standard HTTP methods (GET, POST, PUT, DELETE)
- **Caching** — HTTP caching works naturally (ETag, Last-Modified, Cache-Control)
- **Tooling** — curl, Postman, any HTTP client works
- **Documentation** — OpenAPI/Swagger is standard for REST
- **Versioning** — URL-based versioning (/v1/, /v2/) is simple and clear

**Trade-offs**:
- Over-fetching possible (JSON responses include fields you don't need)
- Under-fetching possible (need multiple requests for related data)
- More endpoints than GraphQL equivalent

**How We Mitigate**:
- Use HTTP query parameters for filtering (e.g., ?fields=price,volume)
- Cache aggressively (ETag + 304 Not Modified)
- Plan GraphQL layer in future if needed

---

## Security: Secrets in .env, API Keys Hashed in DB

**Decision**: Environment variables for secrets, SHA-256 hashing for API keys  
**Alternatives Considered**: Vault, AWS Secrets Manager, plaintext (WRONG!)  

**Why**:
- **.env** — Standard Node practice, never committed to git
- **Hashing API keys** — If DB is compromised, keys aren't readable
- **No plaintext secrets** — Credentials never logged, never in code
- **Dev/prod separation** — Different .env files for different environments

**Trade-offs**:
- .env file is local only (no auto-backup to cloud)
- Hashing means key rotation requires regeneration
- CI/CD needs to inject secrets safely

**How We Mitigate**:
- .env in .gitignore (never accidentally committed)
- Production .env stored securely in Vercel dashboard (never in git)
- Rotate API keys periodically
- Use Clerk + Stripe SDKs for managing their secrets

---

## Monitoring & Error Tracking: GitHub Actions + Future Sentry

**Decision**: Start with GitHub Actions logs + error tracking, plan Sentry integration  
**Alternatives Considered**: Datadog, New Relic, CloudWatch  

**Why**:
- **GitHub Actions** — Free logs for price update jobs
- **Error tracking** — Simple console.error + structured logging for now
- **Sentry (planned)** — Free tier covers error monitoring, performance tracing

**Trade-offs**:
- Manual debugging required for production issues
- No real-time alerting (yet)
- Logs are not centralized

**How We Mitigate**:
- Implement structured logging early (timestamp, level, context)
- Plan Sentry integration before scaling
- Set up monitoring/alerting checklist in Production-Checklist.md

---

## Decision Log

| Date | Decision | Status | Review Date |
|------|----------|--------|-------------|
| Sprint 1 | PostgreSQL + Prisma | ✅ Confirmed | Q2 2026 |
| Sprint 1 | Clerk for auth | ✅ Confirmed | Q2 2026 |
| Sprint 1 | Stripe for payments | ✅ Confirmed | Q2 2026 |
| Sprint 1 | GitHub Actions for price updates | ✅ Confirmed | Q3 2026 |
| Sprint 2 | Add caching layer? | 🟡 TBD | Q3 2026 |
| Sprint 2 | Add GraphQL? | 🟡 TBD | Q4 2026 |
| Sprint 3 | Add monitoring (Sentry)? | 🟡 TBD | Q3 2026 |

---

See: [[../claude.md|Working Memory]]
