# Vercel Environment Setup

## Required Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

### Production Environment
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_secret
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com/api/v1
```

### Preview Environment
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_preview_key
CLERK_SECRET_KEY=sk_test_your_preview_secret
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com/api/v1
```

## Important Notes

1. **API URL Format**: Always include `/api/v1` at the end
   - ✅ Correct: `https://your-backend-app.onrender.com/api/v1`
   - ❌ Wrong: `https://your-backend-app.onrender.com`

2. **Environment Scopes**: Set both Production AND Preview scopes
   - Feature branches deploy to Preview environment
   - Main branch deploys to Production environment

3. **Clerk Keys**: Use different keys for Production vs Preview
   - Production: `pk_live_...` and `sk_live_...`
   - Preview: `pk_test_...` and `sk_test_...`

## Local Development

Create `.env.local` file:
```bash
cp env.example .env.local
```

Then edit `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_secret
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Troubleshooting

### Frontend hangs on API calls
- Check if `NEXT_PUBLIC_API_URL` includes `/api/v1`
- Verify Render backend is running
- Check browser console for CORS errors

### Clerk authentication fails
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Check if key matches environment (test vs live)
- Ensure key is scoped to correct environment

