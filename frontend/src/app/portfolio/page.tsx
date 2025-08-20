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

export default function PortfolioPage() {
  const { token } = useAuth();
  useRequireAuth(); // Redirect if not logged in

  const [history, setHistory] = useState<any[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    // No need for isCancelled check if we get a fresh token dependency
    if (!token) {
      setHistory([]);
      setPortfolioSkins([]);
      setWatchlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [h, p, w] = await Promise.all([
        getPortfolioHistory(),
        getPortfolio(),
        getWatchlist(),
      ]);
      setHistory(h || []);
      setPortfolioSkins(p || []);
      setWatchlist(w || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load portfolio data");
    } finally {
      setLoading(false);
    }
  }

  // Load data on initial mount and when token changes
  useEffect(() => {
    loadAll();
  }, [token]);


  // {/* Remove from Watchlist */}
  async function handleRemoveWatchlist(skinId: number) {
    try {
      await removeFromWatchlist(skinId);
      setWatchlist((prev) => prev.filter((entry: any) => entry.skinId !== skinId));
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
          <PortfolioTable
            skins={portfolioSkins}
            watchlist={watchlist}
            onDataChange={loadAll}
          />
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
