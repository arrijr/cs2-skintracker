const axios = require('axios');

async function fetchSkinPrice(marketHashName) {
  // currency=3 steht für Euro, appid=730 ist CS:GO/CS2
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=${encodeURIComponent(marketHashName)}`;
  try {
    const res = await axios.get(url);
    // Preis-API liefert { lowest_price, median_price, ... }
    return res.data;
  } catch (err) {
    return null; // Im Fehlerfall null zurückgeben
  }
}

module.exports = { fetchSkinPrice };
