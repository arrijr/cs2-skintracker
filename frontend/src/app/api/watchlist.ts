import axios from "axios";

export async function getWatchlist(token: string) {
    console.log("JWT-Token:", token);
  const res = await axios.get("/api/v1/watchlist", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function addToWatchlist(token: string, skinId: number, priceAlert?: number) {
  const res = await axios.post(
    "/api/v1/watchlist",
    { skinId, priceAlert },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function removeFromWatchlist(token: string, skinId: number) {
  const res = await axios.delete(`/api/v1/watchlist/${skinId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updatePriceAlert(token: string, skinId: number, priceAlert: number) {
  const res = await axios.patch(
    `/api/v1/watchlist/${skinId}`,
    { priceAlert },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
