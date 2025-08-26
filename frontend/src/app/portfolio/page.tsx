"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRequireAuth } from "../hooks/useRequireAuth";
import PortfolioChart from "./PortfolioChart";
import PortfolioTable from "./PortfolioTable";
import WatchlistTable from "./WatchlistTable";
import PortfolioAllocation from "./PortfolioAllocation";
import TopMovers from "./TopMovers";
import InsightCards from "./InsightCards";

// {/* API helpers (zentral aus /src/lib/api.ts) */}
import {
  getPortfolio,
  getPortfolioHistory,
  getWatchlist,
  removeFromWatchlist,
} from "@/lib/api";

// {/* Types kept minimal; UI components do stricter typing */}
type WatchlistEntry = any;

interface PortfolioKPIs {
  portfolioCount: number;
  portfolioValue: number;
  portfolioChange24h: number;
  portfolioChange7d: number;
  totalInvested: number;
  unrealizedPL: number;
  watchlistCount: number;
  activeAlerts: number;
  lastUpdated?: string;
  volatility?: number;
  volatilityMessage?: string;
  maxDrawdown?: number;
  maxDrawdownMessage?: string;
  hasEnoughRiskData?: boolean;
}

export default function PortfolioPage() {
  const { token } = useAuth();
  useRequireAuth(); // Redirect if not logged in

  const [history, setHistory] = useState<any[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [kpiData, setKpiData] = useState<PortfolioKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    // No need for isCancelled check if we get a fresh token dependency
    if (!token) {
      setHistory([]);
      setPortfolioSkins([]);
      setWatchlist([]);
      setKpiData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [h, p, w, kpis] = await Promise.all([
        getPortfolioHistory(),
        getPortfolio(),
        getWatchlist(),
        fetch("/api/v1/portfolio/kpis", {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json())
      ]);
      setHistory(h || []);
      setPortfolioSkins(p || []);
      setWatchlist(w || []);
      setKpiData(kpis);
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
        {/* Header KPIs Section */}
        <section className="card">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Your Portfolio</h1>
          <p className="text-gray-400 text-sm mb-6">
            Overview of your skins, value history & watchlist
          </p>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-yellow-400">
                {kpiData?.portfolioCount || 0}
              </div>
              <div className="text-xs text-gray-400">Portfolio Skins</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-400">
                ${kpiData?.portfolioValue?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-400">Total Value</div>
              <div className="text-xs text-gray-500">
                {kpiData?.portfolioChange24h !== 0 && kpiData && (
                  <span className={kpiData.portfolioChange24h > 0 ? "text-green-400" : "text-red-400"}>
                    {kpiData.portfolioChange24h > 0 ? "+" : ""}{kpiData.portfolioChange24h.toFixed(1)}% 24h
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-400">
                ${kpiData?.totalInvested?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-400">Total Invested</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                ${kpiData?.unrealizedPL?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-400">Unrealized P/L</div>
              <div className="text-xs text-gray-500">
                {kpiData?.portfolioChange7d !== 0 && kpiData && (
                  <span className={kpiData.portfolioChange7d > 0 ? "text-green-400" : "text-red-400"}>
                    {kpiData.portfolioChange7d > 0 ? "+" : ""}{kpiData.portfolioChange7d.toFixed(1)}% 7d
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-400">
                {kpiData?.watchlistCount || 0}
              </div>
              <div className="text-xs text-gray-400">Watchlist</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-amber-400">
                {kpiData?.activeAlerts || 0}
              </div>
              <div className="text-xs text-gray-400">Active Alerts</div>
            </div>
          </div>

          {/* Last Updated */}
          {kpiData?.lastUpdated && (
            <div className="text-center text-sm text-gray-500 mb-4">
              Last updated: {new Date(kpiData.lastUpdated).toLocaleString()}
            </div>
          )}
        </section>

        {/* Portfolio Chart Section */}
        <section className="card">
          <PortfolioChart history={history} />
        </section>

        {/* Portfolio Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioAllocation portfolio={portfolioSkins} />
          <TopMovers portfolio={portfolioSkins} />
        </div>

        {/* Insight Cards (Feature Flag) */}
        <InsightCards portfolio={portfolioSkins} token={token} />

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
