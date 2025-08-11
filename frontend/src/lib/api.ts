import { apiFetch } from "@/lib/http";

export const api = {
  // {/* Search Skins */}
  async searchSkins(q: string) {
    const query = encodeURIComponent(q || "");
    return await apiFetch(`/api/v1/skins/search?query=${query}`);
  },

  // {/* Get Skin History */}
  async getSkinHistory(id: number | string) {
    return await apiFetch(`/api/v1/skins/${id}/history`);
  },

  // {/* Get Watchlist (raw) */}
  async getWatchlist() {
    // Falls du hier eine Normalisierung brauchst (itemimage → imageUrl),
    // sag Bescheid – ich geb dir eine map()-Variante.
    return await apiFetch(`/api/v1/watchlist`);
  },

  // {/* Get Portfolio (raw from backend controller) */}
  async getPortfolio() {
    return await apiFetch(`/api/v1/portfolio`);
  },
};
