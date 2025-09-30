// frontend/src/lib/analytics.ts — [Frontend]
// {/* P3 - Analytics Service for tracking user interactions without PII */}

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

class AnalyticsService {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production' && typeof window !== 'undefined';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private track(event: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) {
      console.log(`[Analytics] ${event}:`, properties);
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
    this.sendToAnalytics(analyticsEvent);
  }

  private async sendToAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      // In production, send to your analytics service
      // For now, we'll just log to console
      console.log('[Analytics Event]', event);
      
      // Example: Send to your analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  // P3 - Skin Detail Page Events
  trackVariantChange(skinId: number, variantId: number, variantName: string): void {
    this.track('variant_change', {
      skinId,
      variantId,
      variantName,
    });
  }

  trackRangeChange(range: string, previousRange: string): void {
    this.track('range_change', {
      range,
      previousRange,
    });
  }

  trackScaleToggle(scale: string, previousScale: string): void {
    this.track('scale_toggle', {
      scale,
      previousScale,
    });
  }

  trackMovingAverageToggle(ma: string, previousMa: string): void {
    this.track('ma_toggle', {
      movingAverage: ma,
      previousMovingAverage: previousMa,
    });
  }

  trackWatchlistAdd(skinId: number, skinName: string, price: number): void {
    this.track('watchlist_add', {
      skinId,
      skinName,
      price,
    });
  }

  trackPortfolioAdd(skinId: number, skinName: string, price: number): void {
    this.track('portfolio_add', {
      skinId,
      skinName,
      price,
    });
  }

  trackAlertCreate(skinId: number, skinName: string, targetPrice: number): void {
    this.track('alert_create', {
      skinId,
      skinName,
      targetPrice,
    });
  }

  trackCaseMateClick(skinId: number, caseName: string, clickedSkinId: number): void {
    this.track('case_mate_click', {
      skinId,
      caseName,
      clickedSkinId,
    });
  }

  trackRelatedClick(skinId: number, relatedSkinId: number, relatedSkinName: string): void {
    this.track('related_click', {
      skinId,
      relatedSkinId,
      relatedSkinName,
    });
  }

  trackCopyLink(skinId: number, skinName: string): void {
    this.track('copy_link', {
      skinId,
      skinName,
    });
  }

  trackExportData(skinId: number, skinName: string, format: 'csv' | 'json', dataPoints: number): void {
    this.track('export_data', {
      skinId,
      skinName,
      format,
      dataPoints,
    });
  }

  trackPageView(skinId: number, skinName: string, referrer?: string): void {
    this.track('page_view', {
      skinId,
      skinName,
      referrer: referrer || document.referrer,
    });
  }

  trackError(error: string, context: string, skinId?: number): void {
    this.track('error', {
      error,
      context,
      skinId,
    });
  }

  // P3 - Performance Metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.track('performance', {
      metric,
      value,
      unit,
    });
  }

  // P3 - User Engagement
  trackEngagement(action: string, duration?: number): void {
    this.track('engagement', {
      action,
      duration,
    });
  }

  // Get all events (for debugging)
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear events (for testing)
  clearEvents(): void {
    this.events = [];
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// P3 - Hook for easy usage in components
export function useAnalytics() {
  // Ensure analytics is always available
  if (!analytics) {
    console.error('[Analytics] Analytics service not initialized');
    return new AnalyticsService();
  }
  return analytics;
}

export default analytics;
