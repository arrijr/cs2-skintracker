// frontend/src/hooks/useSearch.ts — [Frontend]
// {/* Search hooks using centralized API utilities */}

import useSWR from "swr";
import { apiUrl, swrFetcher } from "@/lib/api";

export function useSkinSearch(query: string) {
  const q = (query ?? "").trim();
  const key = q ? apiUrl(`/api/v1/skins/search?q=${encodeURIComponent(q)}`) : null;
  return useSWR(key, swrFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}

export function usePresets() {
  const key = apiUrl(`/api/v1/skins/presets`);
  return useSWR(key, swrFetcher, {
    revalidateOnFocus: false,
  });
}
