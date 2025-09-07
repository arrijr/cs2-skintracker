import { Page, Route } from '@playwright/test';

export class ApiHelper {
  constructor(private page: Page) {}

  /**
   * Mock API responses for testing
   */
  async mockApiResponse(url: string, response: any, status: number = 200) {
    await this.page.route(url, async (route: Route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Mock API error responses
   */
  async mockApiError(url: string, status: number = 500, message: string = 'Internal Server Error') {
    await this.page.route(url, async (route: Route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: message })
      });
    });
  }

  /**
   * Mock network failure
   */
  async mockNetworkFailure() {
    await this.page.route('**/api/**', route => route.abort());
  }

  /**
   * Mock slow API responses
   */
  async mockSlowApiResponse(url: string, response: any, delay: number = 2000) {
    await this.page.route(url, async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Mock skins API response
   */
  async mockSkinsApi(skins: any[] = []) {
    const defaultSkins = [
      {
        id: 'ak47-redline',
        name: 'AK-47 | Redline',
        price: 15.50,
        image: '/images/ak47-redline.jpg',
        rarity: 'Classified',
        weapon: 'AK-47'
      },
      {
        id: 'awp-dragon-lore',
        name: 'AWP | Dragon Lore',
        price: 2500.00,
        image: '/images/awp-dragon-lore.jpg',
        rarity: 'Covert',
        weapon: 'AWP'
      }
    ];

    await this.mockApiResponse('**/api/skins**', {
      skins: skins.length > 0 ? skins : defaultSkins,
      total: skins.length > 0 ? skins.length : defaultSkins.length
    });
  }

  /**
   * Mock portfolio API response
   */
  async mockPortfolioApi(portfolio: any = {}) {
    const defaultPortfolio = {
      totalValue: 1000.00,
      totalInvested: 800.00,
      totalReturn: 200.00,
      totalReturnPercent: 25.00,
      positions: [
        {
          id: 'ak47-redline',
          name: 'AK-47 | Redline',
          quantity: 1,
          currentPrice: 15.50,
          investedPrice: 12.00,
          currentValue: 15.50,
          return: 3.50,
          returnPercent: 29.17
        }
      ]
    };

    await this.mockApiResponse('**/api/portfolio**', {
      ...defaultPortfolio,
      ...portfolio
    });
  }

  /**
   * Mock admin API response
   */
  async mockAdminApi(metrics: any = {}) {
    const defaultMetrics = {
      totalUsers: 150,
      totalSkins: 5000,
      totalValue: 50000.00,
      activeUsers: 75,
      premiumUsers: 25
    };

    await this.mockApiResponse('**/api/admin/overview**', {
      ...defaultMetrics,
      ...metrics
    });
  }
}
