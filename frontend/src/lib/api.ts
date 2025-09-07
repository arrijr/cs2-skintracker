// /frontend/src/lib/api.ts
import { apiFetch } from "@/lib/http";

// {/* Skins: Suche */}
export async function searchSkins(query: string) {
  const q = encodeURIComponent(query || "");
  const response = await apiFetch(`/api/v1/skins/search?query=${q}`);
  return response.ok ? response : { skins: [] };
}

// {/* Browse all skins with filters and pagination */}
export async function browseSkins(params: {
  page?: number;
  limit?: number;
  weaponType?: string;
  wear?: string;
  rarity?: string;
  quality?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
}) {
  try {
    console.log('[DEBUG] 🔍 browseSkins called with params:', params);
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    const url = `/api/v1/skins?${searchParams.toString()}`;
    console.log('[DEBUG] 📤 Calling API URL:', url);
    
    const response = await apiFetch(url);
    console.log('[DEBUG] 📥 API response:', response);
    
    return response.ok ? response : { skins: [], total: 0, page: 1, limit: 20 };
  } catch (error) {
    console.error('[DEBUG] 💥 browseSkins error:', error);
    return { ok: false, error: String(error) };
  }
}

// {/* Get filter options */}
export async function getFilterOptions() {
  const response = await apiFetch('/api/v1/skins/filters');
  return response.ok ? response : { weaponTypes: [], wears: [], rarities: [], qualities: [] };
}

// {/* Skins: History */}
export async function getSkinHistory(id: number | string) {
  return await apiFetch(`/api/v1/skins/${id}/history`);
}

// {/* Watchlist: lesen */}
export async function getWatchlist() {
  const response = await apiFetch(`/api/v1/watchlist`);
  console.log('[DEBUG] getWatchlist response:', response);
  return response.ok ? response : [];
}

// {/* Watchlist: hinzufügen */}
export async function addToWatchlist(skinId: number, priceAlert?: number) {
  return await apiFetch(`/api/v1/watchlist`, {
    method: "POST",
    body: JSON.stringify({ skinId, priceAlert }),
  });
}

// {/* Watchlist: entfernen */}
export async function removeFromWatchlist(skinId: number) {
  return await apiFetch(`/api/v1/watchlist/${skinId}`, { method: "DELETE" });
}

// {/* Watchlist: Alert aktualisieren */}
export async function updatePriceAlert(skinId: number, priceAlert: number | null) {
  return await apiFetch(`/api/v1/watchlist/${skinId}`, {
    method: "PATCH",
    body: JSON.stringify({ priceAlert }),
  });
}

// {/* Portfolio: lesen */}
export async function getPortfolio() {
  const response = await apiFetch(`/api/v1/portfolio`);
  console.log('[DEBUG] getPortfolio response:', response);
  return response.ok ? response : [];
}

// {/* Portfolio: History */}
export async function getPortfolioHistory() {
  const response = await apiFetch(`/api/v1/portfolio/history`);
  return response.ok ? response : [];
}

// {/* Portfolio: löschen */}
export async function deletePortfolioEntry(purchaseId: number) {
  return await apiFetch(`/api/v1/portfolio/${purchaseId}`, { method: "DELETE" });
}

// {/* Enhanced Skin Details: Market Stats */}
export async function getSkinMarketStats(skinId: number | string) {
  return await apiFetch(`/api/v1/skins/${skinId}/market-stats`);
}

// {/* Enhanced Skin Details: Variants */}
export async function getSkinVariants(skinId: number | string) {
  return await apiFetch(`/api/v1/skins/${skinId}/variants`);
}

// {/* Enhanced Skin Details: Case Information */}
export async function getSkinCase(skinId: number | string) {
  return await apiFetch(`/api/v1/skins/${skinId}/case`);
}

// {/* Enhanced Skin Details: Full Details */}
export async function getSkinDetails(skinId: number | string) {
  return await apiFetch(`/api/v1/skins/${skinId}/details`);
}

// {/* Auth: Login – legacy function for compatibility */}
export async function login(email: string, password: string) {
  const data = await apiFetch(`/api/v1/users/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  
  // Return the data for legacy compatibility
  return data;
}

// {/* Auth: Signup */}
export async function signup(email: string, password: string) {
  return await apiFetch(`/api/v1/users/register`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// {/* Optional: Kompatibilität – api-Objekt mit denselben Funktionen */}
export const api = {
  searchSkins,
  browseSkins,
  getFilterOptions,
  getSkinHistory,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updatePriceAlert,
  getPortfolio,
  getPortfolioHistory,
  login,
  signup,
};

export async function getSkinCategories() {
  try {
    return await apiFetch('/api/v1/skins/categories');
  } catch (error) {
    console.error("Failed to fetch skin categories:", error);
    return { ok: false, error: "Failed to fetch categories" };
  }
}
