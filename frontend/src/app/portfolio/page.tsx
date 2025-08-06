"use client";
import { useEffect, useState } from "react";
import { getPortfolio, getPortfolioHistory, getWatchlist, removeFromWatchlist } from "../api/api";
import PortfolioChart from "./PortfolioChart";
import PortfolioTable from "./PortfolioTable";
import WatchlistTable from "./WatchlistTable";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

type HistoryEntry = {
  id: number;
  userId: number;
  date: string;
  value: number;
};

type PortfolioSkin = {
  id: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
  skin: {
    name: string;
    imageUrl: string;
    marketPrice: number;
  };
};

type WatchlistEntry = {
  id: number;
  skinId: number;
  marketHashName: string;
  name: string;
  imageUrl: string;
  priceAlert: number | null;
};






export default function PortfolioPage() {
  const { token, user } = useAuth();
  const [history, setHistory] = useState([]);
  const [portfolioSkins, setPortfolioSkins] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortfolioHistory().then(setHistory).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getPortfolio().then(setPortfolioSkins);
  }, []);

  useEffect(() => {
    getWatchlist().then(setWatchlist);
  }, []);

  async function handleRemoveWatchlist(skinId) {
    await removeFromWatchlist(skinId);
    setWatchlist(watchlist.filter((entry) => entry.skinId !== skinId));
  }


    if (token === undefined) {
  // Auth-Status wird noch geladen
  return <div className="text-white p-6">Loading...</div>;
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-950">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Please login to view your portfolio.</h2>
          <p className="mb-4">You need to be signed in to access your personal skin tracker and stats.</p>
          <Link href="/login" className="btn-main">Login</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-white p-6">Loading Portfolio…</div>;

  {/* Require login to view portfolio */}
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-950">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Please login to view your portfolio.</h2>
          <p className="mb-4">You need to be signed in to access your personal skin tracker and stats.</p>
          <Link href="/login" className="btn-main">Login</Link>
        </div>
      </div>
    );
  }








  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-4">
      

      {/* Main */}
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        <section className="card">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Your Portfolio</h1>
          <p className="text-gray-400 text-sm mb-6">
            Overview of your skins, value history & watchlist
          </p>
          <PortfolioChart history={history} />
        </section>

        <section className="card">
          <PortfolioTable skins={portfolioSkins} watchlist={watchlist} />
        </section>

        <section className="card">
          <WatchlistTable watchlist={watchlist} onRemove={handleRemoveWatchlist} />
        </section>
      </main>
    </div>
  );
}