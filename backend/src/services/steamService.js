import axios from "axios";

export async function fetchSkinPrice(marketHashName) {
  // Try Steam Web API first (more reliable)
  const apiKey = process.env.STEAM_API_KEY;
  if (apiKey) {
    try {
      const url = `https://www.steamwebapi.com/steam/api/item?key=${apiKey}&game=cs2&market_hash_name=${encodeURIComponent(marketHashName)}`;
      const res = await axios.get(url, { timeout: 10000 });
      
      if (res.data && res.data.success) {
        // Parse price from various possible fields
        const price = res.data.price || res.data.pricemedian || res.data.lowest_price || res.data.priceavg || res.data.pricemin || res.data.median_price;
        if (price) {
          const numeric = parseFloat(String(price).replace(/[^\d.,-]/g, "").replace(",", "."));
          if (Number.isFinite(numeric)) {
            return {
              lowest_price: numeric.toString(),
              median_price: numeric.toString(),
              source: "steamwebapi"
            };
          }
        }
      }
    } catch (err) {
      console.log(`[DEBUG] Steam Web API failed for ${marketHashName}:`, err.message);
    }
  }

  // Fallback: Official Steam Community Market API
  try {
    const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=${encodeURIComponent(marketHashName)}`;
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 
      }
    });
    
    if (res.data && res.data.success && (res.data.lowest_price || res.data.median_price)) {
      return res.data;
    }
  } catch (err) {
    console.log(`[DEBUG] Steam Community API failed for ${marketHashName}:`, err.message);
  }

  return null;
}
