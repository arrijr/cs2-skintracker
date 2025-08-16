"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRequireAuth } from "../hooks/useRequireAuth";
import PortfolioChart from "./PortfolioChart";
import PortfolioTable from "./PortfolioTable";
import WatchlistTable from "./WatchlistTable";

// {/* API helpers (zentral aus /src/lib/api.ts) */}
import {
  getPortfolio,
  getPortfolioHistory,
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/api";

// {/* Types kept minimal; UI components do stricter typing */}
type WatchlistEntry = any;

// {/* Normalizer: akzeptiert verschiedene Backend-Shapes und erzeugt PortfolioTable-kompatible Einträge */}
function normalizePortfolio(raw: any) {
  if (!raw) return [];

  // Case A: already aggregated per skin
  if (Array.isArray(raw) && raw.length && (raw[0].skin || raw[0].amount)) {
    return raw.map((row: any) => {
      const skin =
        row.skin ?? {
          id: row.skinId ?? row.id,
          name: row.name ?? "Unknown",
          marketPrice: row.marketPrice ?? row.market_price ?? row.price ?? null,
          itemimage: row.itemimage,
          itemImage: row.itemImage,
          image_url: row.image_url,
          imageUrl: row.imageUrl,
        };

      const purchases: any[] = Array.isArray(row.purchases) ? row.purchases : [];

      // avgPrice berechnen falls nicht vorhanden
      const avg =
        typeof row.avgPrice === "number"
          ? row.avgPrice
          : (() => {
              if (!purchases.length) return 0;
              const total = purchases.reduce(
                (acc, p) => acc + (Number(p.buyPrice) || 0) * (Number(p.amount) || 0),
                0
              );
              const units = purchases.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
              return units > 0 ? total / units : 0;
            })();

      const amount =
        typeof row.amount === "number"
          ? row.amount
          : purchases.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

      return {
        skin: {
          id: Number(skin.id),
          name: String(skin.name),
          marketPrice:
            typeof skin.marketPrice === "number" ? skin.marketPrice : null,
          itemimage: skin.itemimage,
          itemImage: skin.itemImage,
          image_url: skin.image_url,
          imageUrl: skin.imageUrl,
        },
        amount,
        avgPrice: avg,
        purchases,
      };
    });
  }

  // Case B: purchases list → group by skinId
  if (Array.isArray(raw)) {
    const map = new Map<number, any>();
    for (const p of raw) {
      const sid = Number(p.skinId ?? p.skin_id ?? p.id);
      if (!Number.isFinite(sid)) continue;

      const existing = map.get(sid) ?? {
        skin: {
          id: sid,
          name: p.skin?.name ?? p.name ?? "Unknown",
          marketPrice: p.skin?.marketPrice ?? p.marketPrice ?? null,
          itemimage: p.skin?.itemimage,
          itemImage: p.skin?.itemImage,
          image_url: p.skin?.image_url,
          imageUrl: p.skin?.imageUrl,
        },
        amount: 0,
        avgPrice: 0,
        purchases: [],
      };

      existing.purchases.push({
        id: Number(p.id ?? existing.purchases.length + 1),
        skinId: sid,
        amount: Number(p.amount ?? 1),
        buyPrice: Number(p.buyPrice ?? p.price ?? 0),
        buyDate: String(p.buyDate ?? p.date ?? new Date().toISOString()),
      });

      map.set(sid, existing);
    }

    for (const [, entry] of map) {
      const total = entry.purchases.reduce((acc: number, x: any) => acc + x.amount * x.buyPrice, 0);
      const units = entry.purchases.reduce((a: number, x: any) => a + x.amount, 0);
      entry.amount = units;
      entry.avgPrice = units > 0 ? total / units : 0;
    }

    return Array.from(map.values());
  }

  return [];
}

export default function PortfolioPage() {
  const { token } = useAuth();
  useRequireAuth(); // Redirect if not logged in

  const [history, setHistory] = useState<any[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // {/* Load portfolio data (history, holdings, watchlist) – Hook MUST be called every render */}
  useEffect(() => {
    let isCancelled = false;

    async function loadAll() {
      if (!token) {
        // not logged in yet → just clear and stop
        if (!isCancelled) {
          setHistory([]);
          setPortfolioSkins([]);
          setWatchlist([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [h, p, w] = await Promise.all([
          getPortfolioHistory().catch(() => []),
          getPortfolio().catch(() => []),
          getWatchlist().catch(() => []),
        ]);

        if (!isCancelled) {
          setHistory(Array.isArray(h) ? h : []);
          const norm = normalizePortfolio(p);
          console.log("[Portfolio] raw:", p, "→ normalized:", norm);
          setPortfolioSkins(norm);
          setWatchlist(Array.isArray(w) ? w : []);
        }
      } catch (e: any) {
        if (!isCancelled) setError(e?.message || "Failed to load portfolio data");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  // {/* Remove from Watchlist */}
  async function handleRemoveWatchlist(skinId: number) {
    try {
      await removeFromWatchlist(skinId);
      setWatchlist((prev) =>
        prev.filter((entry: any) => (entry.skin?.id ?? entry.skinId) !== skinId)
      );
    } catch (e: any) {
      setError(e?.message || "Failed to remove from watchlist");
    }
  }

  // While loading auth state or data, show a loading message.
  // The redirect will happen via the hook if auth fails.
  if (token === undefined || loading) {
    return <div className="text-white p-6">Loading portfolio…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-4">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Main */}
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Portfolio Chart Section */}
        <section className="card">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Your Portfolio</h1>
          <p className="text-gray-400 text-sm mb-6">
            Overview of your skins, value history & watchlist
          </p>
          <PortfolioChart history={history} />
        </section>

        {/* Portfolio Table Section */}
        <section className="card">
          <PortfolioTable skins={portfolioSkins} watchlist={watchlist} />
        </section>

        {/* Watchlist */}
        <section className="card">
          <WatchlistTable
            watchlist={watchlist}
            onRemove={async (skinId) => {
              try {
                await removeFromWatchlist(skinId);
                setWatchlist((prev) =>
                  prev.filter((e: any) => (e.skin?.id ?? e.skinId) !== skinId)
                );
              } catch (e: any) {
                setError(e?.message || "Failed to remove from watchlist");
              }
            }}
          />
        </section>
      </main>
    </div>
  );
}
