import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { ApiHelper } from './helpers/api';

test.describe('Feature-Specific E2E Tests', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ page }) => {
    // Block all Clerk CDN requests that hang page load
    await page.route('**/clerk.accounts.dev/**', route => route.abort());
    await page.route('**/clerk.browser.js**', route => route.abort());
    await page.route('**/clerk.skintrackr.io/**', route => route.abort());
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page);
  });

  test.describe('Portfolio Features', () => {

    test.skip('should display portfolio chart correctly — requires real Clerk session; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();

      await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="chart-canvas"]')).toBeVisible();
    });

    test.skip('should show portfolio health score for premium users — requires real Clerk session; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();

      await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="portfolio-health-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="health-score-value"]')).toBeVisible();
    });

    test.skip('should show market intelligence for premium users — requires real Clerk session; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();

      await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="market-intelligence"]')).toBeVisible();
      await expect(page.locator('[data-testid="price-predictions"]')).toBeVisible();
    });

    test.skip('should hide premium features for free users — requires real Clerk session; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();

      await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="portfolio-health-score"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="market-intelligence"]')).not.toBeVisible();

      await expect(page.locator('text=Upgrade to Premium')).toBeVisible();
    });
  });

  test.describe('Skins Features', () => {

    test('should search and filter skins', async ({ page }) => {
      await apiHelper.mockSkinsApi();

      await page.goto('/skins', { waitUntil: 'domcontentloaded' });

      // Wait for grid to load
      await expect(page.locator('[data-testid="skin-grid"]')).toBeVisible({ timeout: 10000 });

      // Search functionality
      await page.fill('[data-testid="skin-search-input"]', 'AK-47');
      await page.press('[data-testid="skin-search-input"]', 'Enter');

      // Results should be visible
      await expect(page.locator('[data-testid="skin-card"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display skin details correctly', async ({ page }) => {
      await apiHelper.mockSkinsApi();

      await page.goto('/skins', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-testid="skin-card"]').first().click();

      // Skin detail page should load
      await expect(page.locator('[data-testid="skin-detail"]')).toBeVisible({ timeout: 10000 });
    });

    test.skip('should show market stats for skins — market-stats and volume-data data-testids not yet added to skin detail page', async ({ page }) => {
      await apiHelper.mockSkinsApi();

      await page.goto('/skins', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-testid="skin-card"]').first().click();

      await expect(page.locator('[data-testid="market-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="volume-data"]')).toBeVisible();
    });
  });

  test.describe('Watchlist Features', () => {

    test.skip('should add skin to watchlist — requires real Clerk session; add-to-watchlist button only renders when signed in', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockSkinsApi();

      await page.goto('/skins', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-testid="skin-card"]').first().click();

      await page.click('[data-testid="add-to-watchlist"]');

      await expect(page.locator('text=Added to watchlist')).toBeVisible();
    });

    test.skip('should display watchlist correctly — requires real Clerk session; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();

      await page.goto('/watchlist', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="watchlist-table"]')).toBeVisible();
    });

    test.skip('should remove skin from watchlist — requires real Clerk session; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('user', 'free');
      await apiHelper.mockPortfolioApi();

      await page.goto('/watchlist', { waitUntil: 'domcontentloaded' });

      await page.click('[data-testid="remove-from-watchlist"]:first-child');

      await expect(page.locator('text=Removed from watchlist')).toBeVisible();
    });
  });

  test.describe('Admin Features', () => {

    test.skip('should display admin metrics — requires real Clerk session with admin role; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockAdminApi();

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="admin-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-skins"]')).toBeVisible();
    });

    test.skip('should show build information — requires real Clerk session with admin role; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockAdminApi();

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="build-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="build-version"]')).toBeVisible();
    });

    test.skip('should handle admin API errors gracefully — requires real Clerk session with admin role; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await authHelper.mockAuthenticatedUser('admin', 'premium');
      await apiHelper.mockApiError('**/api/admin/**', 500);

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('text=Failed to load admin data')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {

    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await apiHelper.mockSkinsApi();

      await page.goto('/skins', { waitUntil: 'domcontentloaded' });

      // Mobile layout should work
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="skin-grid"]')).toBeVisible({ timeout: 10000 });
    });

    test.skip('should work on tablet devices — requires authenticated portfolio; localStorage mock incompatible with Clerk SDK', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await authHelper.mockAuthenticatedUser('user', 'premium');
      await apiHelper.mockPortfolioApi();

      await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {

    test('should load pages quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/skins', { waitUntil: 'domcontentloaded' });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets', async ({ page }) => {
      // Mock large dataset
      const largeSkinsArray = Array.from({ length: 100 }, (_, i) => ({
        id: `skin-${i}`,
        name: `Skin ${i}`,
        price: Math.random() * 1000,
        rarity: 'Classified'
      }));

      await apiHelper.mockSkinsApi(largeSkinsArray);

      await page.goto('/skins', { waitUntil: 'domcontentloaded' });

      // Should handle dataset without issues
      await expect(page.locator('[data-testid="skin-grid"]')).toBeVisible({ timeout: 10000 });
    });
  });
});
