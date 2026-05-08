import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Mock authentication state for testing
   */
  async mockAuthenticatedUser(role: 'user' | 'admin' = 'user', tier: 'free' | 'premium' = 'free') {
    await this.page.addInitScript(({ role, tier }) => {
      // Mock Clerk session
      window.localStorage.setItem('clerk-session', 'mock-session-token');
      window.localStorage.setItem('user-role', role);
      window.localStorage.setItem('user-tier', tier);
      
      // Mock user data
      window.localStorage.setItem('user-data', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        role,
        tier
      }));
    }, { role, tier });
  }

  /**
   * Mock unauthenticated state
   */
  async mockUnauthenticatedUser() {
    await this.page.addInitScript(() => {
      window.localStorage.removeItem('clerk-session');
      window.localStorage.removeItem('user-role');
      window.localStorage.removeItem('user-tier');
      window.localStorage.removeItem('user-data');
    });
  }

  /**
   * Navigate to sign-in page
   */
  async goToSignIn() {
    await this.page.goto('/sign-in');
  }

  /**
   * Navigate to sign-up page
   */
  async goToSignUp() {
    await this.page.goto('/sign-up');
  }

  /**
   * Check if user is redirected to sign-in
   * Note: Only checks URL — sign-in page uses Clerk's <SignIn> component
   * which may not render an h1 when Clerk CDN is blocked in tests.
   */
  async expectRedirectToSignIn() {
    await this.page.waitForURL(/.*sign-in/, { timeout: 10000 });
  }

  /**
   * Check if user is redirected to dashboard
   */
  async expectRedirectToDashboard() {
    await this.page.waitForURL(/.*dashboard/);
  }
}
