"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
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
type WatchlistEntry = {
  id: number;
  skinId: number;
  name: string;
  marketHashName?: string;
  imageUrl?: string;
  priceAlert: number | null;
};

export default function PortfolioPage() {
  const { token } = useAuth();

  const [history, setHistory] = useState<any[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  {/* Require Auth Gate – block while auth is initializing */}
  if (token === undefined) {
    return <div className="text-white p-6">Loading…</div>;
  }

  {/* Require Auth Gate – redirect suggestion */}
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-950">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">
            Please login to view your portfolio.
          </h2>
        <p className="mb-4">
          You need to be signed in to access your personal skin tracker and stats.
        </p>
          <Link href="/login" className="btn-main">Login</Link>
        </div>
      </div>
    );
  }

  {/* Load portfolio data (history, holdings, watchlist) */}
  useEffect(() => {
    let isCancelled = false;

    async function loadAll() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const [h, p, w] = await Promise.all([
          getPortfolioHistory(),
          getPortfolio(),
          getWatchlist(),
        ]);
        if (!isCancelled) {
          setHistory(h || []);
          setPortfolioSkins(p || []);
          setWatchlist(w || []);
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

  {/* Remove from Watchlist */}
  async function handleRemoveWatchlist(skinId: number) {
    try {
      await removeFromWatchlist(skinId);
      setWatchlist(prev => prev.filter(entry => entry.skinId !== skinId));
    } catch (e: any) {
      setError(e?.message || "Failed to remove from watchlist");
    }
  }

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
          <PortfolioChart history={history} />
        </section>

        {/* Portfolio Table Section */}
        <section className="card">
          <PortfolioTable skins={portfolioSkins} watchlist={watchlist} />
        </section>

        {/* Watchlist Table Section */}
        <section className="card">
          <WatchlistTable
            watchlist={watchlist}
            onRemove={handleRemoveWatchlist}
          />
        </section>
      </main>
    </div>
  );
}
