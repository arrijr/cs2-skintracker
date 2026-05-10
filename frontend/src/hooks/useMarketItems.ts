"use client";
import { useCallback, useEffect, useRef, useState } from 'react';

export type MarketItemCategory = 'sticker' | 'agent' | 'patch' | 'graffiti' | 'music_kit' | 'collectible' | 'key';
export type SortKey = 'name' | 'price' | 'volume';
export type SortOrder = 'asc' | 'desc';

export interface MarketItem {
  id: number;
  category: MarketItemCategory;
  name: string;
  marketHashName: string;
  imageUrl: string | null;
  rarity: string | null;
  collection: string | null;
  priceLatest: number | null;
  priceMedian: number | null;
  volume24h: number | null;
  priceUpdatedAt: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UseMarketItemsParams {
  category?: MarketItemCategory;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  order?: SortOrder;
}

export interface UseMarketItemsResult {
  items: MarketItem[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMarketItems(params: UseMarketItemsParams): UseMarketItemsResult {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [items, setItems] = useState<MarketItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(() => {
    const search = new URLSearchParams();
    if (params.category) search.set('category', params.category);
    if (params.q) search.set('q', params.q);
    if (params.page && params.page > 1) search.set('page', String(params.page));
    if (params.pageSize && params.pageSize !== 24) search.set('pageSize', String(params.pageSize));
    if (params.sort && params.sort !== 'name') search.set('sort', params.sort);
    if (params.order && params.order !== 'asc') search.set('order', params.order);
    return `${apiUrl}/api/v1/market-items${search.toString() ? '?' + search.toString() : ''}`;
  }, [apiUrl, params.category, params.q, params.page, params.pageSize, params.sort, params.order]);

  const fetchItems = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    try {
      const res = await fetch(buildUrl(), { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
      setError(null);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    fetchItems();
    return () => controllerRef.current?.abort();
  }, [fetchItems]);

  return { items, pagination, isLoading, error, refresh: fetchItems };
}
