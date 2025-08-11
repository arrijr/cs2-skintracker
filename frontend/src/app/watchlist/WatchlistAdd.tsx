"use client";
import { useState } from "react";
import SkinSearchBar from "../skins/SkinSearchBar";
import { http } from "@/lib/http";
import { useAuth } from "../context/AuthContext";

type Props = { onAdded?: () => void };

export default function WatchlistAdd({ onAdded }: Props) {
  const { token } = useAuth();
  const [newSkin, setNewSkin] = useState<any>(null);
  const [priceAlert, setPriceAlert] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  async function handleAdd() {
    if (!newSkin || !token) return;
    setLoading(true);
    setError(null);
    try {
      await http.post(
        "/watchlist",
        { skinId: newSkin.id, priceAlert: priceAlert === "" ? undefined : Number(priceAlert) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewSkin(null);
      setPriceAlert("");
      onAdded?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error adding to watchlist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center mb-6">
      <SkinSearchBar onSelect={setNewSkin} />
      <input
        type="number"
        placeholder="Price Alert (optional)"
        value={priceAlert}
        onChange={(e) => setPriceAlert(e.target.value === "" ? "" : Number(e.target.value))}
        className="input-main w-36"
        min={0}
        step={0.01}
      />
      <button onClick={handleAdd} className="btn-main" style={{ minWidth: 64 }} disabled={loading || !newSkin}>
        {loading ? "Adding…" : "Add"}
      </button>
      {error && <span className="text-red-500 text-sm ml-2">{error}</span>}
    </div>
  );
}
