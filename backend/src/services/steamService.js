import axios from "axios";

export async function fetchSkinPrice(marketHashName) {
  // Try Steam Web API first (more reliable and comprehensive)
  const apiKey = process.env.STEAM_API_KEY;
  if (apiKey) {
    try {
      const url = `https://www.steamwebapi.com/steam/api/item?key=${apiKey}&game=cs2&market_hash_name=${encodeURIComponent(marketHashName)}`;
      const res = await axios.get(url, { timeout: 10000 });
      
      if (res.data && res.data.success) {
        console.log(`[DEBUG] Steam Web API response for ${marketHashName}:`, {
          success: res.data.success,
          hasPrice: !!res.data.pricelatest,
          hasMedian: !!res.data.pricemedian,
          hasAvg: !!res.data.priceavg,
          hasMin: !!res.data.pricemin,
          hasMax: !!res.data.pricemax,
          hasSafe: !!res.data.pricesafe,
          hasWear: !!res.data.wear,
          hasRarity: !!res.data.rarity,
          hasQuality: !!res.data.quality,
          isStattrak: res.data.isstattrack,
          isStar: res.data.isstar,
          itemGroup: res.data.itemgroup,
          itemType: res.data.itemtype,
          soldToday: res.data.soldtoday,
          sold24h: res.data.sold24h,
          sold7d: res.data.sold7d,
          hoursToSold: res.data.hourstosold,
          buyOrderPrice: res.data.buyorderprice,
          offerVolume: res.data.offervolume,
          buyOrderVolume: res.data.buyordervolume,
          itemImage: res.data.itemimage
        });

        // Extract comprehensive price data
        const priceData = {
          // Current prices
          pricelatest: res.data.pricelatest,
          pricelatestsell: res.data.pricelatestsell,
          pricemedian: res.data.pricemedian,
          priceavg: res.data.priceavg,
          pricesafe: res.data.pricesafe,
          pricemin: res.data.pricemin,
          pricemax: res.data.pricemax,
          
          // Historical prices
          pricemedian24h: res.data.pricemedian24h,
          pricemedian7d: res.data.pricemedian7d,
          pricemedian30d: res.data.pricemedian30d,
          pricemedian90d: res.data.pricemedian90d,
          priceavg24h: res.data.priceavg24h,
          priceavg7d: res.data.priceavg7d,
          priceavg30d: res.data.priceavg30d,
          priceavg90d: res.data.priceavg90d,
          
          // Sales data
          soldtoday: res.data.soldtoday,
          sold24h: res.data.sold24h,
          sold7d: res.data.sold7d,
          sold30d: res.data.sold30d,
          sold90d: res.data.sold90d,
          soldtotal: res.data.soldtotal,
          hourstosold: res.data.hourstosold,
          
          // Steam market data
          buyorderprice: res.data.buyorderprice,
          buyordermedian: res.data.buyordermedian,
          buyorderavg: res.data.buyorderavg,
          buyordervolume: res.data.buyordervolume,
          offervolume: res.data.offervolume,
          
          // Item details
          wear: res.data.wear,
          itemgroup: res.data.itemgroup,
          itemtype: res.data.itemtype,
          itemname: res.data.itemname,
          rarity: res.data.rarity,
          quality: res.data.quality,
          isstattrack: res.data.isstattrack === 1,
          isstar: res.data.isstar === 1,
          itemimage: res.data.itemimage,
          
          // Metadata
          priceupdatedat: res.data.priceupdatedat,
          unstable: res.data.unstable === 1,
          unstablereason: res.data.unstablereason,
          
          source: "steamwebapi"
        };

        // For backward compatibility, also provide the old format
        const price = res.data.pricelatest || res.data.pricemedian || res.data.priceavg || res.data.pricesafe;
        if (price) {
          const numeric = parseFloat(String(price).replace(/[^\d.,-]/g, "").replace(",", "."));
          if (Number.isFinite(numeric)) {
            return {
              ...priceData,
              lowest_price: numeric.toString(),
              median_price: numeric.toString()
            };
          }
        }

        return priceData;
      }
    } catch (err) {
      console.log(`[DEBUG] Steam Web API failed for ${marketHashName}:`, err.message);
    }
  }

  // Fallback: Official Steam Community Market API (limited data)
  try {
    const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=${encodeURIComponent(marketHashName)}`;
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 
      }
    });
    
    if (res.data && res.data.success && (res.data.lowest_price || res.data.median_price)) {
      console.log(`[DEBUG] Steam Community API fallback for ${marketHashName}:`, res.data);
      return {
        ...res.data,
        source: "steamcommunity",
        // Limited data available from fallback
        pricelatest: res.data.lowest_price,
        pricemedian: res.data.median_price,
        priceavg: res.data.median_price,
        isstattrack: false, // Can't determine from fallback
        isstar: false, // Can't determine from fallback
        wear: null,
        rarity: null,
        quality: null
      };
    }
  } catch (err) {
    console.log(`[DEBUG] Steam Community API failed for ${marketHashName}:`, err.message);
  }

  return null;
}
