import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { ApiHelper } from './helpers/api';

test.describe('Feature-Specific E2E Tests', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page);
  });

  test.describe('Portfolio Features', () => {
    
    test('should display portfolio chart correctly', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Chart should be visible
      await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
      
      // Chart should have data
      await expect(page.locator('[data-testid="chart-canvas"]')).toBeVisible();
    });

    test('should show portfolio health score for premium users', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Health score should be visible
      await expect(page.locator('[data-testid="portfolio-health-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="health-score-value"]')).toBeVisible();
    });

    test('should show market intelligence for premium users', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Market intelligence should be visible
      await expect(page.locator('[data-testid="market-intelligence"]')).toBeVisible();
      await expect(page.locator('[data-testid="price-predictions"]')).toBeVisible();
    });

    test('should hide premium features for free users', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Premium features should be hidden
      await expect(page.locator('[data-testid="portfolio-health-score"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="market-intelligence"]')).not.toBeVisible();
      
      // Upgrade prompts should be visible
      await expect(page.locator('text=Upgrade to Premium')).toBeVisible();
    });
  });

  test.describe('Skins Features', () => {
    
    test('should search and filter skins', async ({ page }) => {
      await apiHelper.mockSkinsApi();
      
      await page.goto('/skins');
      
      // Search functionality
      await page.fill('[data-testid="skin-search-input"]', 'AK-47');
      await page.press('[data-testid="skin-search-input"]', 'Enter');
      
      // Results should be filtered
      await expect(page.locator('[data-testid="skin-card"]')).toContainText('AK-47');
    });

    test('should display skin details correctly', async ({ page }) => {
      await apiHelper.mockSkinsApi();
      
      await page.goto('/skins');
      await page.click('[data-testid="skin-card"]:first-child');
      
      // Skin detail page should load
      await expect(page.locator('[data-testid="skin-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="skin-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="skin-price"]')).toBeVisible();
    });

    test('should show market stats for skins', async ({ page }) => {
      await apiHelper.mockSkinsApi();
      
      await page.goto('/skins');
      await page.click('[data-testid="skin-card"]:first-child');
      
      // Market stats should be visible
      await expect(page.locator('[data-testid="market-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="volume-data"]')).toBeVisible();
    });
  });

  test.describe('Watchlist Features', () => {
    
    test('should add skin to watchlist', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockSkinsApi();
      
      await page.goto('/skins');
      await page.click('[data-testid="skin-card"]:first-child');
      
      // Add to watchlist
      await page.click('[data-testid="add-to-watchlist"]');
      
      // Should show success message
      await expect(page.locator('text=Added to watchlist')).toBeVisible();
    });

    test('should display watchlist correctly', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/watchlist');
      
      // Watchlist should be visible
      await expect(page.locator('[data-testid="watchlist-table"]')).toBeVisible();
    });

    test('should remove skin from watchlist', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/watchlist');
      
      // Remove from watchlist
      await page.click('[data-testid="remove-from-watchlist"]:first-child');
      
      // Should show confirmation
      await expect(page.locator('text=Removed from watchlist')).toBeVisible();
    });
  });

  test.describe('Admin Features', () => {
    
    test('should display admin metrics', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockAdminApi();
      
      await page.goto('/admin');
      
      // Admin metrics should be visible
      await expect(page.locator('[data-testid="admin-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-skins"]')).toBeVisible();
    });

    test('should show build information', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockAdminApi();
      
      await page.goto('/admin');
      
      // Build info should be visible
      await expect(page.locator('[data-testid="build-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="build-version"]')).toBeVisible();
    });

    test('should handle admin API errors gracefully', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockApiError('**/api/admin/**', 500);
      
      await page.goto('/admin');
      
      // Should show error state
      await expect(page.locator('text=Failed to load admin data')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await apiHelper.mockSkinsApi();
      
      await page.goto('/skins');
      
      // Mobile layout should work
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="skin-grid"]')).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();
      
      await page.goto('/portfolio');
      
      // Tablet layout should work
      await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    
    test('should load pages quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/skins');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large datasets', async ({ page }) => {
      // Mock large dataset
      const largeSkinsArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `skin-${i}`,
        name: `Skin ${i}`,
        price: Math.random() * 1000,
        rarity: 'Classified'
      }));
      
      await apiHelper.mockSkinsApi(largeSkinsArray);
      
      await page.goto('/skins');
      
      // Should handle large dataset without issues
      await expect(page.locator('[data-testid="skin-grid"]')).toBeVisible();
    });
  });
});
