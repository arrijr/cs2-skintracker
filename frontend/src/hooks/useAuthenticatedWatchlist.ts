// /frontend/src/hooks/useAuthenticatedWatchlist.ts (Frontend)
"use client";

import useSWR from 'swr';
import { useAuthenticatedApi } from './useAuthenticatedApi';

interface WatchlistEntry {
  id: number;
  skinId: number;
  priceAlert?: number;
  skin: {
    id: number;
    name: string;
    marketHashName: string;
    imageUrl: string;
    priceAvg: number | null;
    priceMedian: number | null;
  };
}

export function useAuthenticatedWatchlist() {
  const { authenticatedFetcher, apiUrl } = useAuthenticatedApi();

  const { data: watchlist, error, isLoading, mutate } = useSWR<WatchlistEntry[]>(
    apiUrl('/api/v1/watchlist'),
    authenticatedFetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    watchlist: watchlist || [],
    isLoading,
    error,
    mutate,
  };
}
