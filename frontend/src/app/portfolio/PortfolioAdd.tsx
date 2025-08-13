"use client";
import { useState } from "react";
import SkinSearchBar from "../components/SkinSearchBar";
import { useAuth } from "../context/AuthContext";
import { addToWatchlist } from "@/lib/api";

type Props = { onAdded?: () => void };

export default function WatchlistAdd({ onAdded }: Props) {
  const { token } = useAuth();
  const [selectedSkin, setSelectedSkin] = useState<any>(null);
  const [priceAlert, setPriceAlert] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // {/* Add Skin to Watchlist */}
  async function handleAdd() {
    if (!selectedSkin || !token) return;
    setLoading(true);
    setError(null);
    try {
      await addToWatchlist(selectedSkin.id, priceAlert === "" ? undefined : Number(priceAlert));
      setSelectedSkin(null);
      setPriceAlert("");
      onAdded?.();
    } catch (err: any) {
      setError(err?.message || "Error adding to watchlist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center mb-6">
      {/* Add Skin to Watchlist */}
      <SkinSearchBar selectMode="skin" onSelect={setSelectedSkin} />
      <input
        type="number"
        placeholder="Price Alert (optional)"
        value={priceAlert}
        onChange={(e) => setPriceAlert(e.target.value === "" ? "" : Number(e.target.value))}
        className="input-main w-36"
        min={0}
        step={0.01}
      />
      <button onClick={handleAdd} className="btn-main" style={{ minWidth: 64 }} disabled={loading || !selectedSkin}>
        {loading ? "Adding…" : "Add"}
      </button>
      {error && <span className="text-red-500 text-sm ml-2">{error}</span>}
    </div>
  );
}
