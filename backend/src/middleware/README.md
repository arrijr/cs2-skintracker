# Backend Middleware

## Clerk Authentication Middleware

### Usage

```javascript
import { clerkAuth, requireAdmin, requirePremium } from './middleware/clerkAuth.js';

// Basic authentication
app.use('/api/v1/portfolio', clerkAuth);

// Admin only routes
app.use('/api/v1/admin', clerkAuth, requireAdmin);

// Premium only routes
app.use('/api/v1/analytics', clerkAuth, requirePremium);

// Optional authentication (user info added if token present)
app.use('/api/v1/public', optionalClerkAuth);
```

### Middleware Functions

- **`clerkAuth`**: Required authentication, adds `req.user` and `req.userId`
- **`optionalClerkAuth`**: Optional authentication, adds user info if token present
- **`requireAdmin`**: Requires admin role (use after `clerkAuth`)
- **`requirePremium`**: Requires premium tier (use after `clerkAuth`)
- **`requireOwnership`**: Checks resource ownership

### Request Object

After authentication, the request object contains:

```javascript
req.user = {
  id: 'user_123',
  email: 'user@example.com',
  role: 'admin' | 'user',
  tier: 'free' | 'premium'
};

req.userId = 'user_123';
```

### Error Responses

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Authentication service error

### Environment Variables

Required in `.env`:
```
CLERK_SECRET_KEY=sk_test_...
```
