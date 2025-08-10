// app/components/WatchlistPage.tsx
"use client";
import { useEffect, useState } from "react";
import { http } from "@/lib/http";
import { useAuth } from "../context/AuthContext";
import WatchlistAdd from "../watchlist/WatchlistAdd";

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
    market_hash_name?: string;
    marketHashName?: string;
  };
};

export default function WatchlistPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await http.get<WatchlistItem[]>("/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
    } catch (e: any) {
      setError("Konnte Watchlist nicht laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function removeItem(skinId: number) {
    if (!token) return;
    try {
      await http.delete(`/watchlist/${skinId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((x) => x.skinId !== skinId));
    } catch {
      alert("Konnte Eintrag nicht entfernen.");
    }
  }

  async function updateAlert(skinId: number, priceAlert: number | null) {
    if (!token) return;
    try {
      await http.patch(
        `/watchlist/${skinId}`,
        { priceAlert },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems((prev) =>
        prev.map((x) => (x.skinId === skinId ? { ...x, priceAlert } : x))
      );
    } catch {
      alert("Konnte Preisalarm nicht aktualisieren.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 text-white">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Watchlist</h1>

      <WatchlistAdd onAdded={load} />

      {loading && <div className="text-center py-8">Lade Watchlist…</div>}
      {error && <div className="text-center text-red-400 py-8">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          Keine Skins auf deiner Watchlist. Füge oben einen hinzu.
        </div>
      )}

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => {
          const img = it.skin.imageUrl || it.skin.image_url;
          const mhn = it.skin.marketHashName || it.skin.market_hash_name;
          return (
            <div key={it.id} className="bg-neutral-900 rounded-xl p-4 flex gap-3 items-center">
              {img && <img src={img} alt={it.skin.name} className="w-16 h-16 object-contain rounded" />}
              <div className="flex-1">
                <div className="font-semibold">{it.skin.name}</div>
                {mhn && <div className="text-xs text-zinc-400">{mhn}</div>}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    className="input-main w-28"
                    placeholder="Alert"
                    min={0}
                    step={0.01}
                    value={it.priceAlert ?? ""}
                    onChange={(e) =>
                      updateAlert(it.skinId, e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                  <button
                    className="btn-main bg-red-600 hover:bg-red-700"
                    onClick={() => removeItem(it.skinId)}
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
