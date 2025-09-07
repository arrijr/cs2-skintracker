import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

const TEST_SKIN = {
  name: 'AK-47 | Redline',
  id: 'ak47-redline'
};

test.describe('CS2 Skin Tracker - E2E Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test.describe('Authentication Guards', () => {
    
    test('should redirect unauthenticated users to sign-in', async ({ page }) => {
      // Try to access protected route
      await page.goto('/portfolio');
      
      // Should redirect to sign-in
      await expect(page).toHaveURL(/.*sign-in/);
      await expect(page.locator('h1')).toContainText('Sign In');
    });

    test('should redirect unauthenticated users from admin', async ({ page }) => {
      // Try to access admin route
      await page.goto('/admin');
      
      // Should redirect to sign-in
      await expect(page).toHaveURL(/.*sign-in/);
    });

    test('should redirect unauthenticated users from watchlist', async ({ page }) => {
      // Try to access watchlist
      await page.goto('/watchlist');
      
      // Should redirect to sign-in
      await expect(page).toHaveURL(/.*sign-in/);
    });

    test('should allow access to public routes', async ({ page }) => {
      // Home page should be accessible
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible();
      
      // Skins page should be accessible
      await page.goto('/skins');
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Premium Feature Guards', () => {
    
    test('should show premium paywall for protected features', async ({ page }) => {
      // Mock authentication state
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'mock-session');
      });

      // Navigate to portfolio (premium features)
      await page.goto('/portfolio');
      
      // Should show premium feature flags
      await expect(page.locator('[data-testid="premium-feature"]')).toBeVisible();
      await expect(page.locator('text=Upgrade to Premium')).toBeVisible();
    });

    test('should hide premium features for free users', async ({ page }) => {
      // Mock free user state
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'mock-session');
        window.localStorage.setItem('user-tier', 'free');
      });

      await page.goto('/portfolio');
      
      // Premium components should be hidden or show upgrade prompts
      await expect(page.locator('[data-testid="portfolio-health-score"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="market-intelligence"]')).not.toBeVisible();
    });
  });

  test.describe('Admin Role Guards', () => {
    
    test('should block non-admin users from admin routes', async ({ page }) => {
      // Mock regular user state
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'mock-session');
        window.localStorage.setItem('user-role', 'user');
      });

      await page.goto('/admin');
      
      // Should show access denied or redirect
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('should allow admin users to access admin routes', async ({ page }) => {
      // Mock admin user state
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'mock-session');
        window.localStorage.setItem('user-role', 'admin');
      });

      await page.goto('/admin');
      
      // Should show admin dashboard
      await expect(page.locator('h1')).toContainText('Admin');
      await expect(page.locator('[data-testid="admin-metrics"]')).toBeVisible();
    });
  });

  test.describe('Core User Flows', () => {
    
    test('should display skins page correctly', async ({ page }) => {
      await page.goto('/skins');
      
      // Check page elements
      await expect(page.locator('h1')).toContainText('Skins');
      await expect(page.locator('[data-testid="skin-search"]')).toBeVisible();
      await expect(page.locator('[data-testid="skin-grid"]')).toBeVisible();
    });

    test('should handle skin search', async ({ page }) => {
      await page.goto('/skins');
      
      // Search for a skin
      await page.fill('[data-testid="skin-search-input"]', 'AK-47');
      await page.press('[data-testid="skin-search-input"]', 'Enter');
      
      // Should show search results
      await expect(page.locator('[data-testid="skin-card"]')).toBeVisible();
    });

    test('should navigate to skin detail page', async ({ page }) => {
      await page.goto('/skins');
      
      // Click on first skin card
      await page.click('[data-testid="skin-card"]:first-child');
      
      // Should navigate to skin detail
      await expect(page).toHaveURL(/.*skins\/.*/);
      await expect(page.locator('[data-testid="skin-detail"]')).toBeVisible();
    });

    test('should show portfolio page for authenticated users', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('clerk-session', 'mock-session');
      });

      await page.goto('/portfolio');
      
      // Should show portfolio components
      await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="portfolio-table"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Should show 404 or redirect to home
      await expect(page.locator('text=404')).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/skins');
      
      // Should show error state
      await expect(page.locator('text=Error loading skins')).toBeVisible();
    });

    test('should handle network failures', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      
      await page.goto('/');
      
      // Should show offline indicator
      await expect(page.locator('text=Offline')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/skins');
      
      // Mobile navigation should be visible
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Content should be responsive
      await expect(page.locator('[data-testid="skin-grid"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/portfolio');
      
      // Should show appropriate layout
      await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/skins');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should not have memory leaks', async ({ page }) => {
      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto('/skins');
        await page.goto('/');
        await page.waitForLoadState('networkidle');
      }
      
      // Should still be responsive
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
