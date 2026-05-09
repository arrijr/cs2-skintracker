/**
 * Jest global setup — loaded via setupFiles in jest.config.js
 * Runs before every test file. Sets test env vars so no .env.test file needed.
 */

// Core
process.env.NODE_ENV = 'test';
process.env.PORT = '5001'; // avoid clash with running dev server

// Dev bypass tokens (used by auth.js when NODE_ENV !== 'production')
process.env.DEV_TEST_TOKEN = 'test-pro-token-sprint1';
process.env.DEV_TEST_CLERK_ID = 'test-clerk-pro-user-001';
process.env.DEV_FREE_TOKEN = 'test-free-token-sprint1';
process.env.DEV_FREE_CLERK_ID = 'test-clerk-free-user-001';

// Stripe (fake values — real calls are mocked)
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_jest';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake_secret_for_jest';

// Clerk (fake — verifyToken is mocked in tests that need it)
process.env.CLERK_SECRET_KEY = 'sk_test_fake_clerk_key';

// Allowed origins for CORS tests
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://cs2-skintracker.vercel.app';
process.env.FRONTEND_ORIGIN = 'http://localhost:3000';

// Database — point at real DB in test mode (seed scripts populate it)
// Tests that need DB either use the seeded data or mock prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/cs2tracker_test';
