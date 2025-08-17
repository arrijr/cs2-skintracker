"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRequireAuth } from "../hooks/useRequireAuth";
import PortfolioChart from "./PortfolioChart";
import PortfolioTable from "./PortfolioTable";
import WatchlistTable from "./WatchlistTable";
import { useSearchParams } from "next/navigation";
import { SkeletonChart, SkeletonTable } from "../components/Skeleton";
import { showSuccess, showError } from "@/lib/toast";

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
function normalizePortfolio(rawIn: any) {
  // --- Unwrap common wrappers ------------------------------------------------
  let raw = rawIn;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    raw =
      raw.items ??
      raw.data ??
      raw.result ??
      raw.results ??
      raw.portfolio ??
      raw.entries ??
      raw.list ??
      raw; // fallback
  }

  if (!raw) return [];
  if (!Array.isArray(raw)) raw = [raw];

  // Helper to pick the best available image field
  const pickImage = (s: any) =>
    s?.itemimage ??
    s?.itemImage ??
    s?.image_url ??
    s?.imageUrl ??
    s?.img ??
    s?.icon ??
    null;

  // Helper to pick market price
  const pickMarket = (s: any) =>
    (typeof s?.marketPrice === "number" && s.marketPrice) ??
    (typeof s?.market_price === "number" && s.market_price) ??
    (typeof s?.price === "number" && s.price) ??
    null;

  // Case A: already aggregated per skin (has row.skin OR has amount+avgPrice)
  const looksAggregated =
    raw.length > 0 &&
    (raw[0]?.skin ||
      typeof raw[0]?.amount === "number" ||
      typeof raw[0]?.avgPrice === "number");

  if (looksAggregated) {
    return raw.map((row: any) => {
      // row.skin or row.item or flat fields
      const s = row.skin ?? row.item ?? row;

      const skin = {
        id: Number(s?.id ?? row.skinId ?? row.skin_id ?? row.id),
        name: String(s?.name ?? row.name ?? row.skinName ?? "Unknown"),
        marketPrice: pickMarket(s),
        itemimage: pickImage(s),
        itemImage: s?.itemImage,
        image_url: s?.image_url,
        imageUrl: s?.imageUrl,
      };

      // purchases optional
      const purchases: any[] = Array.isArray(row.purchases) ? row.purchases : [];

      // amount/avgPrice berechnen, falls fehlen
      const amountFromPurchases = purchases.reduce(
        (acc, p) => acc + (Number(p.amount) || 0),
        0
      );
      const totalFromPurchases = purchases.reduce(
        (acc, p) => acc + (Number(p.amount) || 0) * (Number(p.buyPrice ?? p.price) || 0),
        0
      );

      const amount =
        typeof row.amount === "number" ? row.amount : amountFromPurchases;
      const avgPrice =
        typeof row.avgPrice === "number"
          ? row.avgPrice
          : amountFromPurchases > 0
          ? totalFromPurchases / amountFromPurchases
          : 0;

      return { skin, amount, avgPrice, purchases };
    });
  }

  // Case B: purchases list → group by skinId
  const map = new Map<number, any>();
  for (const p of raw) {
    const sid = Number(p.skinId ?? p.skin_id ?? p.id ?? p.itemId);
    if (!Number.isFinite(sid)) continue;

    const s = p.skin ?? p.item ?? {};
    const existing =
      map.get(sid) ??
      ({
        skin: {
          id: sid,
          name: String(s?.name ?? p.skinName ?? p.name ?? "Unknown"),
          marketPrice: pickMarket(s) ?? (typeof p.marketPrice === "number" ? p.marketPrice : null),
          itemimage: pickImage(s),
          itemImage: s?.itemImage,
          image_url: s?.image_url,
          imageUrl: s?.imageUrl,
        },
        amount: 0,
        avgPrice: 0,
        purchases: [],
      } as any);

    existing.purchases.push({
      id: Number(p.id ?? existing.purchases.length + 1),
      skinId: sid,
      amount: Number(p.amount ?? p.qty ?? 1),
      buyPrice: Number(p.buyPrice ?? p.price ?? p.unitPrice ?? 0),
      buyDate: String(p.buyDate ?? p.date ?? new Date().toISOString()),
    });

    map.set(sid, existing);
  }

  for (const [, entry] of map) {
    const total = entry.purchases.reduce(
      (acc: number, x: any) => acc + x.amount * x.buyPrice,
      0
    );
    const units = entry.purchases.reduce((a: number, x: any) => a + x.amount, 0);
    entry.amount = units;
    entry.avgPrice = units > 0 ? total / units : 0;
  }

  return Array.from(map.values());
}

// Component that handles search params and debug display
function DebugSection({ portfolioSkins, history, watchlist }: { 
  portfolioSkins: any[], 
  history: any[], 
  watchlist: any[] 
}) {
  const searchParams = useSearchParams();
  const debug = searchParams?.get("debug") === "1";

  if (!debug) return null;

  return (
    <section className="card">
      <div className="text-xs text-zinc-300 space-y-2">
        <div>raw history len: {Array.isArray(history) ? history.length : 0}</div>
        <div>normalized portfolio len: {Array.isArray(portfolioSkins) ? portfolioSkins.length : 0}</div>
        <div>watchlist len: {Array.isArray(watchlist) ? watchlist.length : 0}</div>
        <pre className="bg-zinc-900/60 p-2 rounded max-h-64 overflow-auto">
          {JSON.stringify(portfolioSkins?.[0], null, 2)}
        </pre>
      </div>
    </section>
  );
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

  // {/* Safe guard: erst nach allen Hooks frühzeitig rendern */}
  if (token === undefined || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-4">
        <main className="max-w-6xl mx-auto flex flex-col gap-8">
          <SkeletonChart />
          <SkeletonTable />
          <SkeletonTable />
        </main>
      </div>
    );
  }

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

        {/* DEBUG: Portfolio-Inspection (sichtbar mit ?debug=1) */}
        <Suspense fallback={null}>
          <DebugSection 
            portfolioSkins={portfolioSkins}
            history={history}
            watchlist={watchlist}
          />
        </Suspense>

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
                showSuccess("Removed from watchlist");
              } catch (e: any) {
                showError(e?.message || "Failed to remove from watchlist");
              }
            }}
            onAlertUpdate={(skinId, priceAlert) => {
              setWatchlist((prev) =>
                prev.map((entry: any) => {
                  const entryId = entry.skin?.id ?? entry.skinId;
                  if (entryId === skinId) {
                    return { ...entry, priceAlert };
                  }
                  return entry;
                })
              );
              showSuccess(priceAlert ? `Price alert set to ${priceAlert.toFixed(2)}` : "Price alert removed");
            }}
          />
        </section>
      </main>
    </div>
  );
}
