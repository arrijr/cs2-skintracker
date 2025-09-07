import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { ApiHelper } from './helpers/api';

test.describe('Guard Functionality Tests', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page);
  });

  test.describe('Authentication Guards', () => {
    
    test('should protect portfolio route from unauthenticated users', async ({ page }) => {
      await authHelper.mockUnauthenticatedUser();
      
      await page.goto('/portfolio');
      await authHelper.expectRedirectToSignIn();
    });

    test('should protect admin route from unauthenticated users', async ({ page }) => {
      await authHelper.mockUnauthenticatedUser();
      
      await page.goto('/admin');
      await authHelper.expectRedirectToSignIn();
    });

    test('should protect watchlist route from unauthenticated users', async ({ page }) => {
      await authHelper.mockUnauthenticatedUser();
      
      await page.goto('/watchlist');
      await authHelper.expectRedirectToSignIn();
    });

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
    });
  });

  test.describe('Role-Based Guards', () => {
    
    test('should block regular users from admin routes', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      
      await page.goto('/admin');
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should allow admin users to access admin routes', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockAdminApi();
      
      await page.goto('/admin');
      await expect(page.locator('[data-testid="admin-metrics"]')).toBeVisible();
    });

    test('should show appropriate error for insufficient permissions', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      
      await page.goto('/admin');
      await expect(page.locator('text=Insufficient permissions')).toBeVisible();
    });
  });

  test.describe('Premium Feature Guards', () => {
    
    test('should show premium paywall for free users', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Premium features should show upgrade prompts
      await expect(page.locator('[data-testid="premium-feature-flag"]')).toBeVisible();
      await expect(page.locator('text=Upgrade to Premium')).toBeVisible();
    });

    test('should allow premium users to access premium features', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Premium features should be visible
      await expect(page.locator('[data-testid="portfolio-health-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="market-intelligence"]')).toBeVisible();
    });

    test('should hide premium analytics for free users', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Advanced analytics should be hidden
      await expect(page.locator('[data-testid="smart-alerts"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="transaction-analytics"]')).not.toBeVisible();
    });
  });

  test.describe('Route Protection', () => {
    
    test('should protect API routes with authentication', async ({ page }) => {
      await authHelper.mockUnauthenticatedUser();
      
      // Try to access protected API endpoint
      const response = await page.request.get('/api/portfolio');
      expect(response.status()).toBe(401);
    });

    test('should protect admin API routes with admin role', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      
      // Try to access admin API endpoint
      const response = await page.request.get('/api/admin/overview');
      expect(response.status()).toBe(403);
    });

    test('should allow admin access to admin API routes', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockAdminApi();
      
      // Admin API should be accessible
      const response = await page.request.get('/api/admin/overview');
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Session Management', () => {
    
    test('should handle expired sessions gracefully', async ({ page }) => {
      // Mock expired session
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'expired-token');
      });
      
      await page.goto('/portfolio');
      
      // Should redirect to sign-in
      await authHelper.expectRedirectToSignIn();
    });

    test('should handle invalid tokens gracefully', async ({ page }) => {
      // Mock invalid token
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'invalid-token');
      });
      
      await page.goto('/portfolio');
      
      // Should redirect to sign-in
      await authHelper.expectRedirectToSignIn();
    });

    test('should clear session data on logout', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      
      await page.goto('/portfolio');
      
      // Simulate logout
      await page.click('[data-testid="logout-button"]');
      
      // Should redirect to home and clear session
      await expect(page).toHaveURL('/');
      await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
    });
  });

  test.describe('Error Boundaries', () => {
    
    test('should handle authentication errors gracefully', async ({ page }) => {
      await authHelper.mockUnauthenticatedUser();
      await apiHelper.mockApiError('**/api/auth/verify**', 401);
      
      await page.goto('/portfolio');
      
      // Should show error message
      await expect(page.locator('text=Authentication failed')).toBeVisible();
    });

    test('should handle authorization errors gracefully', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockApiError('**/api/admin/**', 403);
      
      await page.goto('/admin');
      
      // Should show access denied message
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockNetworkFailure();
      
      await page.goto('/portfolio');
      
      // Should show network error message
      await expect(page.locator('text=Network error')).toBeVisible();
    });
  });
});
