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

  const fetcher = async (url: string): Promise<PortfolioData> => {
    const token = await getToken({ template: "backend" });
    
    return await fetchJson<PortfolioData>(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };

  const { data, error, isLoading, mutate } = useSWR<PortfolioData>(
    apiUrl('/api/v1/portfolio/history'),
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
