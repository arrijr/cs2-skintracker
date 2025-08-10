import { http } from "./http";

export const api = {
  // {/* Search Skins */}
  searchSkins: (q: string) =>
    http.get(`/api/v1/skins/search`, { params: { q } }).then(r => r.data),

  // {/* Get Skin History */}
  getSkinHistory: (id: number | string) =>
    http.get(`/api/v1/skins/${id}/history`).then(r => r.data),

  // {/* Get Watchlist */}
  getWatchlist: () =>
    http.get(`/api/v1/watchlist`).then(r => r.data),

  // {/* Get Portfolio */}
  getPortfolio: () =>
    http.get(`/api/v1/portfolio`).then(r => r.data),

  // {/* Add to Watchlist */}
  addToWatchlist: (skinId: number, priceAlert?: number) =>
    http.post(`/api/v1/watchlist`, { skinId, priceAlert }).then(r => r.data),
};