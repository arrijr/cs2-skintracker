// /frontend/src/hooks/usePortfolioData.ts (Frontend)
import useSWR from 'swr';
import { apiFetch } from '@/lib/http';

interface PortfolioHistoryEntry {
  date: string;
  value: number;
  invested: number;
}

interface PortfolioData {
  portfolio: Array<{
    id: number;
    skinId: number;
    amount: number;
    buyPrice: number;
    buyDate: string;
    currentPrice: number;
    currentValue: number;
    unrealizedPL: number;
    skin: {
      id: number;
      name: string;
      marketHashName: string;
      imageUrl: string;
    };
  }>;
  history: PortfolioHistoryEntry[];
  kpis: {
    portfolioCount: number;
    portfolioValue: number;
    portfolioChange24h: number;
    portfolioChange7d: number;
    totalInvested: number;
    unrealizedPL: number;
    watchlistCount: number;
    activeAlerts: number;
    lastUpdated?: string;
  };
}

const fetcher = async (url: string): Promise<PortfolioData> => {
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch portfolio data');
  }
  return response;
};

export function usePortfolioData() {
  const { data, error, isLoading, mutate } = useSWR<PortfolioData>(
    '/api/v1/portfolio/history',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    // Derived data for easier access
    portfolio: data?.portfolio || [],
    history: data?.history || [],
    kpis: data?.kpis || null,
  };
}

export function usePortfolioHistory() {
  const { data, error, isLoading, mutate } = useSWR<PortfolioHistoryEntry[]>(
    '/api/v1/portfolio/history',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute for history
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    history: data || [],
    error,
    isLoading,
    mutate,
  };
}
