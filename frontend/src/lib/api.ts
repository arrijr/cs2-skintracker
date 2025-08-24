// /frontend/src/lib/api.ts
import { apiFetch } from "@/lib/http";

// {/* Skins: Suche */}
export async function searchSkins(query: string) {
  const q = encodeURIComponent(query || "");
  return await apiFetch(`/api/v1/skins/search?query=${q}`);
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
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return await apiFetch(`/api/v1/skins?${searchParams.toString()}`);
}

// {/* Get filter options */}
export async function getFilterOptions() {
  return await apiFetch('/api/v1/skins/filters');
}

// {/* Skins: History */}
export async function getSkinHistory(id: number | string) {
  return await apiFetch(`/api/v1/skins/${id}/history`);
}

// {/* Watchlist: lesen */}
export async function getWatchlist() {
  return await apiFetch(`/api/v1/watchlist`);
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
  return await apiFetch(`/api/v1/portfolio`);
}

// {/* Portfolio: History */}
export async function getPortfolioHistory() {
  return await apiFetch(`/api/v1/portfolio/history`);
}

// {/* Portfolio: löschen */}
export async function deletePortfolioEntry(purchaseId: number) {
  return await apiFetch(`/api/v1/portfolio/${purchaseId}`, { method: "DELETE" });
}

// {/* Auth: Login – speichert Token/User wie dein AuthContext es erwartet */}
export async function login(email: string, password: string) {
  const data = await apiFetch(`/api/v1/users/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (typeof window !== "undefined") {
    localStorage.setItem("token", data?.token);
    localStorage.setItem("user", JSON.stringify(data?.user));
  }
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
