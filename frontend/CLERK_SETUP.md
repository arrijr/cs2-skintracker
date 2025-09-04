# Clerk Authentication Setup

## 1. Create Clerk Account
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose "Next.js" as your framework

## 2. Get API Keys
1. In your Clerk Dashboard, go to "API Keys"
2. Copy the "Publishable key" and "Secret key"

## 3. Environment Variables
Create a `.env.local` file in the frontend directory:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Existing API Configuration
NEXT_PUBLIC_API_URL=https://cs2-skintracker.onrender.com
```

## 4. Configure Clerk Dashboard
1. Go to "Authentication" → "Email, Phone, Username"
2. Enable "Email address" as a sign-in method
3. Go to "User & Authentication" → "Email, Phone, Username"
4. Configure your preferred sign-up methods

## 5. Admin Configuration
To make a user admin, you can:
1. Use the email `test@test.de` (hardcoded in ClerkNavBar.tsx)
2. Or modify the admin check logic in `ClerkNavBar.tsx`

## 6. Features Included
- ✅ Sign In/Sign Up pages
- ✅ User profile management
- ✅ Admin role detection
- ✅ Protected routes
- ✅ UserButton component
- ✅ Dark theme styling

## 7. Migration from Custom Auth
The old custom auth system is still in place but can be removed once Clerk is fully configured and tested.

## 8. Backend Integration
You'll need to update the backend to work with Clerk's JWT tokens instead of custom tokens.
