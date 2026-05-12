declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function track(event: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, { props });
  }
}

export const events = {
  ctaClicked: (location: string) => track('CTA Clicked', { location }),
  signUpStarted: () => track('Sign Up Started'),
  signUpCompleted: () => track('Sign Up Completed'),
  firstSkinAdded: () => track('First Skin Added'),
  upgradeClicked: (tier: 'lite' | 'pro') => track('Upgrade Clicked', { tier }),
  checkoutCompleted: (tier: 'lite' | 'pro') => track('Checkout Completed', { tier }),
} as const;

// Compatibility shim for existing callers using the old class-based API.
// Methods are no-ops; Plausible captures page views + custom events via `events.*`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noop = (..._args: any[]) => {};

const legacyAnalytics = {
  trackPageView: noop,
  trackVariantChange: noop,
  trackRangeChange: noop,
  trackScaleToggle: noop,
  trackMovingAverageToggle: noop,
  trackWatchlistAdd: noop,
  trackPortfolioAdd: noop,
  trackAlertCreate: noop,
  trackCaseMateClick: noop,
  trackRelatedClick: noop,
  trackCopyLink: noop,
  trackExportData: noop,
  trackError: noop,
  trackPerformance: noop,
  trackEngagement: noop,
};

export function useAnalytics() {
  return legacyAnalytics;
}
