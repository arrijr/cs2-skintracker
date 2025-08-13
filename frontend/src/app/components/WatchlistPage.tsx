"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
// {/* Central API calls */}
import { getWatchlist, updatePriceAlert, removeFromWatchlist } from "@/lib/api";

type WatchlistItem = {
  id: number;
  skinId: number;
  priceAlert?: number | null;
  createdAt: string;
  skin: {
    id: number;
    name: string;
    image_url?: string;
    imageUrl?: string;
    itemimage?: string;
    itemImage?: string;
    market_hash_name?: string;
    marketHashName?: string;
  };
};

export default function WatchlistPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // {/* Helper: API fetch with token + base URL */}
  const apiFetch = useMemo(() => {
    return async (path: string, init?: RequestInit) => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
      const res = await fetch(url, { ...init, headers });
      if (!res.ok) {
        let msg = "Request failed";
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      return res;
    };
  }, [token]);

  // {/* Load Watchlist */}
  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data: WatchlistItem[] = await getWatchlist();
      setItems(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  // {/* Update Price Alert (onBlur or Clear) */}
  async function handleUpdateAlert(skinId: number, value: string) {
    if (!token) return;
    const priceAlert = value === "" ? null : Number(value);
    setUpdatingId(skinId);
    try {
      await updatePriceAlert(skinId, priceAlert);
      setItems(prev => prev.map(it => it.skinId === skinId ? { ...it, priceAlert } : it));
    } catch (err: any) {
      setError(err?.message || "Failed to update alert");
    } finally {
      setUpdatingId(null);
    }
  }

  // {/* Remove Skin from Watchlist */}
  async function handleRemove(skinId: number) {
    if (!token) return;
    setUpdatingId(skinId);
    try {
      await removeFromWatchlist(skinId);
      setItems(prev => prev.filter(it => it.skinId !== skinId));
    } catch (err: any) {
      setError(err?.message || "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  }

  // {/* UI: require login */}
  if (!token) {
    return (
      <div className="text-center text-zinc-300 py-10">
        Please log in to see your watchlist.
      </div>
    );
  }

  // {/* Main render */}
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <span className="text-sm text-zinc-400">Max. 5 items on free plan</span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center text-zinc-400 py-10">Loading…</div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center text-zinc-400 py-10">
          No skins in your watchlist yet.
        </div>
      )}

      {/* Watchlist Items Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((it) => {
            // {/* Image fallback: itemimage -> image_url -> imageUrl -> placeholder */}
            const img =
              it.skin.itemimage ||
              it.skin.itemImage ||
              it.skin.image_url ||
              it.skin.imageUrl ||
              "/placeholder-skin.png";

            const mhn =
              it.skin.market_hash_name || it.skin.marketHashName || it.skin.name;

            return (
              <div
                key={`${it.id}-${it.skinId}`}
                className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                {/* Skin Image */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-800">
                  <Image src={img} alt={it.skin.name} fill className="object-cover" />
                </div>

                {/* Skin Info */}
                <div className="flex-1">
                  {/* Skin Title */}
                  <div className="font-medium">{it.skin.name}</div>
                  <div className="text-xs text-zinc-400">{mhn}</div>

                  {/* Price Alert Editor */}
                  {/* Price Alert Editor */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.01}
                      min={0}
                      placeholder="Price Alert ($)"
                      defaultValue={
                        typeof it.priceAlert === "number" ? it.priceAlert : ""
                      }
                      onBlur={(e) =>
                        handleUpdateAlert(it.skinId, e.currentTarget.value)
                      }
                      className="input-main w-36 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      onClick={() => handleUpdateAlert(it.skinId, "")}
                      className="text-xs rounded-lg border border-zinc-800 px-3 py-2 hover:bg-zinc-800/60 transition"
                      disabled={updatingId === it.skinId}
                      title="Clear alert"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Remove from Watchlist */}
                <div className="flex items-start">
                  <button
                    onClick={() => handleRemove(it.skinId)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20 transition"
                    disabled={updatingId === it.skinId}
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
