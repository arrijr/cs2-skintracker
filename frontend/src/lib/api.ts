import { http } from "@/lib/http";

export const api = {
  // {/* Search Skins */}
  searchSkins: (q: string) =>
    http.get("/api/v1/skins/search", { params: { q } }).then(r => r.data),

  // {/* Get Skin History */}
  getSkinHistory: (id: number | string) =>
    http.get(`/api/v1/skins/${id}/history`).then(r => r.data),

  // {/* Get Watchlist */}
  getWatchlist: () =>
    http.get("/api/v1/watchlist").then(r => r.data),

  // {/* Get Portfolio */}
  getPortfolio: () =>
    http.get("/api/v1/portfolio").then(r => r.data),
};
