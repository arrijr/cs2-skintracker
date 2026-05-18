// /frontend/src/hooks/usePortfolioData.ts (Frontend)
import useSWR from 'swr';
import { useAuth } from '@clerk/nextjs';
import { apiUrl, fetchJson } from '@/lib/api';

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
      rarity?: string;
      weaponType?: string;
      exterior?: string;
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

export function usePortfolioData() {
  const { getToken } = useAuth();

  // Fetcher for portfolio data
  const portfolioFetcher = async (url: string) => {
    const token = await getToken({ template: "backend" });
    return await fetchJson(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };

  // Fetcher for portfolio history
  const historyFetcher = async (url: string) => {
    const token = await getToken({ template: "backend" });
    return await fetchJson(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };

  // Fetcher for portfolio KPIs
  const kpisFetcher = async (url: string) => {
    const token = await getToken({ template: "backend" });
    return await fetchJson(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };

  // Fetch portfolio data
  const { data: portfolioData, error: portfolioError, isLoading: portfolioLoading, mutate: mutatePortfolio } = useSWR(
    apiUrl('/api/v1/portfolio'),
    portfolioFetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Fetch portfolio history
  const { data: historyData, error: historyError, isLoading: historyLoading, mutate: mutateHistory } = useSWR(
    apiUrl('/api/v1/portfolio/history'),
    historyFetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Fetch portfolio KPIs
  const { data: kpisData, error: kpisError, isLoading: kpisLoading, mutate: mutateKpis } = useSWR(
    apiUrl('/api/v1/portfolio/kpis'),
    kpisFetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const isLoading = portfolioLoading || historyLoading || kpisLoading;
  const error = portfolioError || historyError || kpisError;

  return {
    data: {
      portfolio: portfolioData || [],
      history: historyData || [],
      kpis: kpisData || null,
    },
    error,
    isLoading,
    portfolioLoading,
    historyLoading,
    kpisLoading,
    mutate: async () => {
      // Revalidate all three SWR keys in parallel — no full page reload.
      await Promise.all([mutatePortfolio(), mutateHistory(), mutateKpis()]);
    },
    // Derived data for easier access
    portfolio: portfolioData || [],
    history: historyData || [],
    kpis: kpisData || null,
  };
}

export function usePortfolioHistory() {
  const { getToken } = useAuth();

  const fetcher = async (url: string): Promise<PortfolioHistoryEntry[]> => {
    const token = await getToken({ template: "backend" });
    
    return await fetchJson<PortfolioHistoryEntry[]>(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };

  const { data, error, isLoading, mutate } = useSWR<PortfolioHistoryEntry[]>(
    apiUrl('/api/v1/portfolio/history'),
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
