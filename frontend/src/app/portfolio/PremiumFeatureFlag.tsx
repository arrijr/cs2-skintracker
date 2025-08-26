"use client";
import { useState, useEffect } from "react";
import { Crown, Lock, CheckCircle } from "lucide-react";

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
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Feature flags for different premium features
  const FEATURE_FLAGS = {
    'performance-dashboard': process.env.NEXT_PUBLIC_PORTFOLIO_PERFORMANCE_DASHBOARD === 'true',
    'advanced-charts': process.env.NEXT_PUBLIC_PORTFOLIO_ADVANCED_CHARTS === 'true',
    'smart-alerts': process.env.NEXT_PUBLIC_PORTFOLIO_SMART_ALERTS === 'true',
    'transaction-analytics': process.env.NEXT_PUBLIC_PORTFOLIO_TRANSACTION_ANALYTICS === 'true',
    'portfolio-health': process.env.NEXT_PUBLIC_PORTFOLIO_HEALTH_SCORE === 'true',
    'market-intelligence': process.env.NEXT_PUBLIC_PORTFOLIO_MARKET_INTELLIGENCE === 'true',
  };

  // Check if feature is enabled via environment variable
  const isFeatureEnabled = FEATURE_FLAGS[feature as keyof typeof FEATURE_FLAGS] || false;

  useEffect(() => {
    // TODO: Check user subscription status from API
    // For now, simulate premium check
    const checkPremiumStatus = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // TODO: Replace with actual API call
        // const response = await fetch('/api/v1/user/subscription');
        // const data = await response.json();
        // setIsPremium(data.isPremium);
        
        // Temporary: Set based on localStorage for testing
        const testPremium = localStorage.getItem('portfolio-test-premium') === 'true';
        setIsPremium(testPremium);
      } catch (error) {
        console.error('Failed to check premium status:', error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  // If feature is disabled via environment variable, show fallback
  if (!isFeatureEnabled) {
    return fallback || (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2">Feature Disabled</h4>
          <p className="text-sm text-gray-400">
            {feature} is currently disabled. Enable with environment variable.
          </p>
        </div>
      </div>
    );
  }

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md animate-pulse">
        <div className="h-6 bg-gray-800 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
          <div className="h-4 bg-gray-800 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  // If premium user, show feature
  if (isPremium) {
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs px-2 py-1 rounded-full font-medium">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        </div>
        {children}
      </div>
    );
  }

  // If not premium, show upgrade prompt
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md">
      <div className="text-center py-8">
        <Lock className="w-16 h-16 mx-auto mb-4 text-amber-400" />
        <h4 className="text-xl font-medium mb-2">Premium Feature</h4>
        <p className="text-sm text-gray-400 mb-6">
          This feature requires a premium subscription.
        </p>
        
        {showUpgrade && (
          <div className="space-y-3">
            <button 
              onClick={() => {
                // TODO: Redirect to upgrade page or open modal
                console.log('Upgrade clicked for feature:', feature);
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-6 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-all"
            >
              <Crown className="inline w-4 h-4 mr-2" />
              Upgrade to Premium
            </button>
            
            <button 
              onClick={() => {
                // Temporary: Enable premium for testing
                localStorage.setItem('portfolio-test-premium', 'true');
                window.location.reload();
              }}
              className="block mx-auto text-xs text-gray-500 hover:text-gray-400 underline"
            >
              Test Premium Mode
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
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs px-2 py-1 rounded-full font-medium ${className}`}>
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
    icon: '📊',
    category: 'Analytics'
  },
  {
    id: 'advanced-charts',
    name: 'Advanced Charts',
    description: 'Candlesticks, Volume, Correlation Matrix',
    icon: '📈',
    category: 'Charts'
  },
  {
    id: 'smart-alerts',
    name: 'Smart Alerts',
    description: 'Technical Indicators, Portfolio Rebalancing',
    icon: '🔔',
    category: 'Trading'
  },
  {
    id: 'transaction-analytics',
    name: 'Transaction Analytics',
    description: 'Realized P/L, Tax Reporting, Cost Basis',
    icon: '💰',
    category: 'Analytics'
  },
  {
    id: 'portfolio-health',
    name: 'Portfolio Health Score',
    description: 'Diversification, Risk, Liquidity Analysis',
    icon: '🏥',
    category: 'Risk'
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    description: 'Price Predictions, Market Cycles, News',
    icon: '🧠',
    category: 'Intelligence'
  }
];
