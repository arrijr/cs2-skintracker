// /frontend/src/lib/api.ts
import { apiFetch } from "@/lib/http";

// {/* Skins: Suche */}
export async function searchSkins(query: string) {
  const q = encodeURIComponent(query || "");
  return await apiFetch(`/api/v1/skins/search?query=${q}`);
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
