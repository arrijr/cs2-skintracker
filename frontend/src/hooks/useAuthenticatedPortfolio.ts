// /frontend/src/hooks/useAuthenticatedPortfolio.ts (Frontend)
"use client";

import useSWR from 'swr';
import { useAuthenticatedApi } from './useAuthenticatedApi';

interface PortfolioEntry {
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
}

interface PortfolioHistoryEntry {
  date: string;
  value: number;
  invested: number;
  unrealizedPL: number;
}

interface PortfolioKPIs {
  portfolioCount: number;
  portfolioValue: number;
  portfolioChange24h: number;
  portfolioChange7d: number;
  totalInvested: number;
  unrealizedPL: number;
  watchlistCount: number;
  activeAlerts: number;
  lastUpdated?: string;
}

export function useAuthenticatedPortfolio() {
  const { authenticatedFetcher, apiUrl } = useAuthenticatedApi();

  const { data: portfolio, error: portfolioError, isLoading: portfolioLoading, mutate: mutatePortfolio } = useSWR<PortfolioEntry[]>(
    apiUrl('/api/v1/portfolio'),
    authenticatedFetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const { data: kpis, error: kpisError, isLoading: kpisLoading, mutate: mutateKpis } = useSWR<PortfolioKPIs>(
    apiUrl('/api/v1/portfolio/kpis'),
    authenticatedFetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const { data: history, error: historyError, isLoading: historyLoading, mutate: mutateHistory } = useSWR<PortfolioHistoryEntry[]>(
    apiUrl('/api/v1/portfolio/history'),
    authenticatedFetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    portfolio: portfolio || [],
    kpis: kpis || null,
    history: history || [],
    isLoading: portfolioLoading || kpisLoading || historyLoading,
    error: portfolioError || kpisError || historyError,
    mutate: () => {
      mutatePortfolio();
      mutateKpis();
      mutateHistory();
    },
  };
}
