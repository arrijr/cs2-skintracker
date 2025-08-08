import axios from "axios";

export async function fetchSkinPrice(marketHashName) {
  // currency=3 means Euro, appid=730 is CS:GO/CS2
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=${encodeURIComponent(marketHashName)}`;
  try {
    const res = await axios.get(url);
    // The price API returns { lowest_price, median_price, ... }
    return res.data;
  } catch (err) {
    return null; // Return null on error
  }
}
