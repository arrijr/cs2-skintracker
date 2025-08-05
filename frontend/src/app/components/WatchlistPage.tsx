"use client";
import { useEffect, useState } from "react";
import { getWatchlist, addToWatchlist, removeFromWatchlist, updatePriceAlert } from "../api/watchlist";
import { useAuth } from "../context/AuthContext";
import SkinSearchBar from "../skins/SkinSearchBar";
import Link from "next/link";

export default function WatchlistPage() {
  const { token } = useAuth();
  const [newSkinId, setNewSkinId] = useState<number | null>(null);
  const [priceAlert, setPriceAlert] = useState<number | null>(null);

  type WatchlistEntry = {
    id: number;
    skinId: number;
    priceAlert?: number;
    // und ggf. weitere Felder, je nach API
  };

  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);


  useEffect(() => {
    if (!token) return;
    getWatchlist(token).then(setWatchlist);
  }, [token]);

  const handleAdd = async () => {
    if (newSkinId) {
      await addToWatchlist(token, newSkinId, priceAlert || undefined);
      setWatchlist(await getWatchlist(token));
      setNewSkinId(null);
      setPriceAlert(null);
    }
  };

  const handleRemove = async (skinId: number) => {
    await removeFromWatchlist(token, skinId);
    setWatchlist(await getWatchlist(token));
  };

  const handleAlertChange = async (skinId: number, alert: number) => {
    await updatePriceAlert(token, skinId, alert);
    setWatchlist(await getWatchlist(token));
  };

  return (
    /* Main Container */
    <div className="card w-full max-w-2xl mx-auto py-10 px-6 flex flex-col gap-8">
      <h2 className="text-2xl font-bold text-center">Your Watchlist</h2>
      <p className="text-gray-400 text-center mb-2">
        All the skins you're watching and their price alerts.
      </p>

      {/* Add Skin to Watchlist */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center mb-6">
        <SkinSearchBar onSelect={setNewSkinId} />
        <input
          type="number"
          placeholder="Price Alert (optional)"
          value={priceAlert ?? ""}
          onChange={(e) => setPriceAlert(Number(e.target.value))}
          className="input-main w-36"
          min={0}
          step={0.01}
        />
        <button
          onClick={handleAdd}
          className="btn-main"
          style={{ minWidth: 64 }}
        >
          Add
        </button>
      </div>

      {/* Watchlist Empty State */}
      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          {/* Optional: Illustration */}
          <svg width="72" height="72" fill="none" viewBox="0 0 24 24" className="mb-4 opacity-70">
            <rect x="4" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12h8M8 16h4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <h2 className="text-2xl font-semibold mb-2">No skins in your watchlist yet</h2>
          <p className="mb-4 text-center max-w-xs">
            Start building your watchlist to get notified about price drops and track your favorite CS2 skins.
          </p>
          {/* Add Skin Button (focuses the search bar) */}
          <button
            className="btn-main"
            onClick={() => {
              // Optional: Fokus auf die Searchbar setzen (z.B. per ref)
              // Oder zu "/skins" navigieren:
              // router.push("/skins")
            }}
          >
            Add Skin
          </button>
        </div>
      ) : (
        // Watchlist Table/Content wenn Einträge vorhanden sind:
        <div>
          {/* Hier kommt deine Watchlist-Tabelle hin! */}
        </div>
      )}
    </div>
  );
}
