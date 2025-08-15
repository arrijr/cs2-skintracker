// /frontend/src/app/portfolio/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import PortfolioChart from "./PortfolioChart";
import PortfolioTable from "./PortfolioTable";
import WatchlistTable from "./WatchlistTable";
import {
  getPortfolio,
  getPortfolioHistory,
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/api";

// {/* Types used by PortfolioTable */}
type Purchase = {
  id: number;
  skinId: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
};
type SkinLite = {
  id: number;
  name: string;
  marketPrice?: number | null;
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  imageUrl?: string;
};
type PortfolioEntry = {
  skin: SkinLite;
  amount: number;
  avgPrice: number;
  purchases: Purchase[];
};

export default function PortfolioPage() {
  const { token } = useAuth();

  const [history, setHistory] = useState<any[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<PortfolioEntry[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // {/* Require Auth Gate – while context boots */}
  if (token === undefined) {
    return <div className="text-white p-6">Loading…</div>;
  }
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-950">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Please login to view your portfolio.</h2>
          <p className="mb-4">You need to be signed in to access your personal skin tracker and stats.</p>
          <Link className="btn-main" href="/login">Login</Link>
        </div>
      </div>
    );
  }

  // {/* Normalizer: tolerates multiple backend shapes */}
  function normalizePortfolio(raw: any): PortfolioEntry[] {
    if (!raw) return [];

    // Case A: Already aggregated list per skin (preferred)
    if (Array.isArray(raw) && raw.length && (raw[0].skin || raw[0].amount)) {
      return raw.map((row: any) => {
        const skin: SkinLite =
          row.skin ?? {
            id: row.skinId ?? row.id,
            name: row.name ?? "Unknown",
            marketPrice: row.marketPrice ?? null,
            itemimage: row.itemimage,
            itemImage: row.itemImage,
            image_url: row.image_url,
            imageUrl: row.imageUrl,
          };

        const purchases: Purchase[] = Array.isArray(row.purchases)
          ? row.purchases
          : [];

        const avg =
          typeof row.avgPrice === "number"
            ? row.avgPrice
            : (() => {
                // compute avg if only purchases exist
                if (!purchases.length) return 0;
                const total = purchases.reduce(
                  (acc, p) => acc + (Number(p.buyPrice) || 0) * (Number(p.amount) || 0),
                  0
                );
                const units = purchases.reduce(
                  (acc, p) => acc + (Number(p.amount) || 0),
                  0
                );
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
              skin.marketPrice ??
              row.market_price ??
              row.price ??
              null,
            itemimage: skin.itemimage ?? row.itemimage,
            itemImage: skin.itemImage ?? row.itemImage,
            image_url: skin.image_url ?? row.image_url,
            imageUrl: skin.imageUrl ?? row.imageUrl,
          },
          amount,
          avgPrice: avg,
          purchases,
        } as PortfolioEntry;
      });
    }

    // Case B: Flat purchases list → group by skinId
    if (Array.isArray(raw)) {
      const map = new Map<number, PortfolioEntry>();
      for (const p of raw) {
        const sid = Number(p.skinId ?? p.skin_id ?? p.id);
        if (!Number.isFinite(sid)) continue;

        const entry = map.get(sid) ?? {
          skin: {
            id: sid,
            name:
              p.skin?.name ??
              p.name ??
              "Unknown",
            marketPrice:
              p.skin?.marketPrice ?? p.marketPrice ?? null,
            itemimage: p.skin?.itemimage,
            itemImage: p.skin?.itemImage,
            image_url: p.skin?.image_url,
            imageUrl: p.skin?.imageUrl,
          },
          amount: 0,
          avgPrice: 0,
          purchases: [],
        };

        entry.purchases.push({
          id: Number(p.id ?? entry.purchases.length + 1),
          skinId: sid,
          amount: Number(p.amount ?? 1),
          buyPrice: Number(p.buyPrice ?? p.price ?? 0),
          buyDate: String(p.buyDate ?? p.date ?? new Date().toISOString()),
        });

        map.set(sid, entry);
      }

      // compute amount + avg
      for (const [, entry] of map) {
        const total = entry.purchases.reduce(
          (acc, x) => acc + x.amount * x.buyPrice,
          0
        );
        const units = entry.purchases.reduce((a, x) => a + x.amount, 0);
        entry.amount = units;
        entry.avgPrice = units > 0 ? total / units : 0;
      }

      return Array.from(map.values());
    }

    return [];
  }

  // {/* Load portfolio data (history, holdings, watchlist) */}
  useEffect(() => {
    let isCancelled = false;

    async function loadAll() {
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
          // Debug: sieh, was wirklich kommt
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
    return () => { isCancelled = true; };
  }, [token]);

  // {/* Remove from Watchlist */}
  async function handleRemoveWatchlist(skinId: number) {
    try {
      await removeFromWatchlist(skinId);
      setWatchlist((prev) => prev.filter((entry: any) => (entry.skin?.id ?? entry.skinId) !== skinId));
    } catch (e: any) {
      setError(e?.message || "Failed to remove from watchlist");
    }
  }

  // {/* Portfolio total for header (derived from normalized entries) */}
  const portfolioTotal = useMemo(() => {
    return portfolioSkins.reduce((sum, e) => {
      const mp = typeof e.skin.marketPrice === "number" ? e.skin.marketPrice : 0;
      return sum + mp * e.amount;
    }, 0);
  }, [portfolioSkins]);

  if (loading) return <div className="text-white p-6">Loading portfolio…</div>;

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
          <div className="mb-4 font-semibold">
            Total: {portfolioTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
          <PortfolioChart history={history} />
        </section>

        {/* Portfolio Table Section */}
        <section className="card">
          <PortfolioTable skins={portfolioSkins} watchlist={watchlist} />
        </section>

        {/* Watchlist Table Section */}
        <section className="card">
          <WatchlistTable watchlist={watchlist} onRemove={handleRemoveWatchlist} />
        </section>
      </main>
    </div>
  );
}
