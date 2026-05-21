"use client";
import { useState, useEffect } from "react";
import { Crown, Lock, CheckCircle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

type Props = {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
};

export default function PremiumFeatureFlag({ 
  children, 
  feature, 
  fallback, 
  showUpgrade = true 
}: Props) {
  const { isPremium, loading } = useUserRole();

  // Feature flags for different premium features
  // Enable all features for premium users, regardless of env vars
  const FEATURE_FLAGS = {
    'performance-dashboard': isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_PERFORMANCE_DASHBOARD === 'true',
    'advanced-charts': isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_ADVANCED_CHARTS === 'true',
    'smart-alerts': isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_SMART_ALERTS === 'true',
    'transaction-analytics': isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_TRANSACTION_ANALYTICS === 'true',
    'portfolio-health': isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_HEALTH_SCORE === 'true',
    'market-intelligence': isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_MARKET_INTELLIGENCE === 'true',
  };

  // For premium users, always enable features regardless of env vars
  const isFeatureEnabled = isPremium || FEATURE_FLAGS[feature as keyof typeof FEATURE_FLAGS] || false;

  // Use Clerk premium status from useUserRole hook

  // If feature is disabled via environment variable, show fallback
  if (!isFeatureEnabled) {
    return fallback || (
      <div className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl rounded-xl p-6 shadow-md" data-testid="premium-feature">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">ðŸ”’</div>
          <h4 className="text-lg font-medium mb-2 text-white">Feature Disabled</h4>
          <p className="text-sm text-slate-400">
            {isPremium
              ? `${feature} is currently disabled. Enable with environment variable.`
              : `This premium feature requires a subscription.`
            }
          </p>
          {!isPremium && (
            <button
              onClick={() => window.open('/profile', '_blank')}
              className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              <Crown className="inline w-4 h-4 mr-2" />
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    );
  }

  // If loading, show skeleton
  if (loading) {
    return (
      <div className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl rounded-xl p-6 shadow-md animate-pulse">
        <div className="h-6 bg-slate-800/60 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-800/60 rounded"></div>
          <div className="h-4 bg-slate-800/60 rounded w-5/6"></div>
          <div className="h-4 bg-slate-800/60 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  // If premium user, show feature
  if (isPremium) {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            <Crown className="w-3 h-3" />
            Premium Active
          </div>
        </div>
        {children}
      </div>
    );
  }

  // If not premium, show upgrade prompt
  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl rounded-xl p-6 shadow-md" data-testid="premium-feature-flag">
      <div className="text-center py-8">
        <Lock className="w-16 h-16 mx-auto mb-4 text-purple-400" />
        <h4 className="text-xl font-medium mb-2 text-white">Premium Feature</h4>
        <p className="text-sm text-slate-400 mb-6">
          This feature requires a premium subscription.
        </p>

        {showUpgrade && (
          <div className="space-y-3">
            <button
              onClick={() => {
                // TODO: Redirect to upgrade page or open modal
                console.log('Upgrade clicked for feature:', feature);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              <Crown className="inline w-4 h-4 mr-2" />
              Upgrade to Premium
            </button>

            <button
              onClick={() => {
                // Redirect to Clerk dashboard for premium upgrade
                window.open('/profile', '_blank');
              }}
              className="block mx-auto text-xs text-slate-400 hover:text-slate-400 underline"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for checking premium status
export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 300));
        const testPremium = localStorage.getItem('portfolio-test-premium') === 'true';
        setIsPremium(testPremium);
      } catch (error) {
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { isPremium, isLoading };
}

// Premium badge component
export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium ${className}`}>
      <Crown className="w-3 h-3" />
      Premium
    </div>
  );
}

// Feature list for upgrade page
export const PREMIUM_FEATURES = [
  {
    id: 'performance-dashboard',
    name: 'Performance Dashboard',
    description: 'Sharpe Ratio, Beta, Alpha, Max Drawdown',
    icon: 'ðŸ“Š',
    category: 'Analytics'
  },
  {
    id: 'advanced-charts',
    name: 'Advanced Charts',
    description: 'Candlesticks, Volume, Correlation Matrix',
    icon: 'ðŸ“ˆ',
    category: 'Charts'
  },
  {
    id: 'smart-alerts',
    name: 'Smart Alerts',
    description: 'Technical Indicators, Portfolio Rebalancing',
    icon: 'ðŸ””',
    category: 'Trading'
  },
  {
    id: 'transaction-analytics',
    name: 'Transaction Analytics',
    description: 'Realized P/L, Tax Reporting, Cost Basis',
    icon: 'ðŸ’°',
    category: 'Analytics'
  },
  {
    id: 'portfolio-health',
    name: 'Portfolio Health Score',
    description: 'Diversification, Risk, Liquidity Analysis',
    icon: 'ðŸ¥',
    category: 'Risk'
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    description: 'Price Predictions, Market Cycles, News',
    icon: 'ðŸ§ ',
    category: 'Intelligence'
  }
];
