import axios from "axios";

export async function getPortfolioHistory(token: string) {
  const res = await axios.get("/api/v1/portfolio/history", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}