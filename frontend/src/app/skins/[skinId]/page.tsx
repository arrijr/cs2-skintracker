"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { useUser, useAuth } from "@clerk/nextjs";
// {/* Central API helpers */}
import {
  getPortfolio,
  getWatchlist,
  apiUrl,
  fetchJson,
} from "@/lib/api";
import { formatUSD, safeToFixed, numberOrNull } from "@/lib/num";
import PurchaseAccordion from "../../components/PurchaseAccordion";
import SkinPortfolioCard from "../../components/SkinPortfolioCard";
import MarketStatsCard from "../../components/skins/MarketStatsCard";
import SkinVariantsCard from "../../components/skins/SkinVariantsCard";
import CaseInfoCard from "../../components/skins/CaseInfoCard";
import PriceDeltaBadge from "../../components/skins/PriceDeltaBadge";
import ChartRangeTabs, { Range } from "../../components/skins/ChartRangeTabs";
import Skeleton from "../../components/ui/Skeleton";
import { Tip } from "../../components/ui/Tooltip";
import TagBadges from "../../components/skins/TagBadges";

// Chart.js Registration
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Skin = {
  id: number;
  name: string;
  marketPrice?: number;
  marketHashName?: string;
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  imageUrl?: string;
};

type PriceHistory = { date: string; price: number };

export default function SkinDetailPage({ params }: { params: { skinId: string } }) {
  // *** ALLE STATES GANZ OBEN ***
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const skinId = String(params.skinId ?? params.id ?? "");

  const [mounted, setMounted] = useState(false);
  const [skin, setSkin] = useState<Skin | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [alert, setAlert] = useState<number | "">("");
  const [addingAlert, setAddingAlert] = useState(false);
  const [msg, setMsg] = useState("");

  // Portfolio
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [amount, setAmount] = useState(1);
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [useMarketPrice, setUseMarketPrice] = useState(false);
  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [portfolioMsg, setPortfolioMsg] = useState("");

  // Enhanced Skin Details
  const [loadingEnhanced, setLoadingEnhanced] = useState(true);
  const [marketStats, setMarketStats] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  
  // Chart Range
  const [chartRange, setChartRange] = useState<Range>("30d");

  // *** ALLE useEffect HOOKS OBEN ***
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!skinId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        console.log(`[DEBUG] Loading skin ${skinId}...`);
        const [s, h] = await Promise.all([
          fetchJson(apiUrl(`/api/v1/skins/${skinId}`)),
          fetchJson(apiUrl(`/api/v1/skins/${skinId}/history`)).catch(() => []),
        ]);
        console.log(`[DEBUG] API response - skin:`, s);
        console.log(`[DEBUG] API response - history:`, h);
        
        if (!cancelled) {
          setSkin(s);
          setHistory(Array.isArray(h) ? h : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (isLoaded && user) {
        getWatchlist().then((w) => !cancelled && setWatchlist(Array.isArray(w) ? w : []));
        getPortfolio().then((p) => !cancelled && setPortfolioSkins(Array.isArray(p) ? p : []));
      }

      // Load enhanced skin details
      if (!cancelled) {
        try {
          console.log('[DEBUG] 🔍 Loading enhanced skin details...');
          
          // Test API calls directly
          console.log('[DEBUG] 📡 Testing API endpoints...');
          
          // Test market stats
          try {
            const stats = await fetchJson(apiUrl(`/api/v1/skins/${skinId}/market-stats`));
            console.log('[DEBUG] 📊 Market stats data:', stats);
            setMarketStats(stats);
          } catch (err) {
            console.error('[DEBUG] ❌ Market stats error:', err);
          }

          // Test variants
          try {
            const variantsData = await fetchJson(apiUrl(`/api/v1/skins/${skinId}/variants`));
            console.log('[DEBUG] 🔄 Variants data:', variantsData);
            setVariants(variantsData?.variants || []);
          } catch (err) {
            console.error('[DEBUG] ❌ Variants error:', err);
          }

          // Test case info
          try {
            const caseData = await fetchJson(apiUrl(`/api/v1/skins/${skinId}/case`));
            console.log('[DEBUG] 📦 Case info data:', caseData);
            setCaseInfo(caseData);
          } catch (err) {
            console.error('[DEBUG] ❌ Case info error:', err);
          }

          console.log('[DEBUG] ✅ Enhanced data loading attempts completed');
        } catch (err) {
          console.error('[DEBUG] 💥 Enhanced details loading failed:', err);
        } finally {
          if (!cancelled) {
            setLoadingEnhanced(false);
            console.log('[DEBUG] 🏁 Enhanced loading finished');
          }
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [skinId, isLoaded, user]);

  if (!mounted) return null;
  if (loading) return <div className="text-white py-8">Loading…</div>;
  if (!skin) return <div className="text-red-400 py-8">Skin not found!</div>;

  // {/* Derived */}
  const img = skin.itemimage || skin.itemImage || skin.image_url || skin.imageUrl || "/images/placeholder-skin.png";
  const marketPrice = skin.marketPrice ?? null;
  
  console.log(`[DEBUG] Skin object:`, skin);
  console.log(`[DEBUG] marketPrice value:`, marketPrice);
  console.log(`[DEBUG] marketPrice type:`, typeof marketPrice);

  // Portfolio-Käufe für diesen Skin
  const portfolioPurchasesForSkin = portfolioSkins.filter(
    (p) => p.skinId === skin?.id
  );

  const totalAmount = portfolioPurchasesForSkin.reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalValue = portfolioPurchasesForSkin.reduce((sum: number, p: any) => sum + (p.amount * p.buyPrice), 0);
  const avgPrice = totalAmount > 0 ? totalValue / totalAmount : 0;
  const performance =
    skin?.marketPrice && avgPrice ? ((skin.marketPrice - avgPrice) / avgPrice) * 100 : null;

  // {/* Chart data with range filtering */}
  const getDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };
  
  const filteredHistory = history?.filter(h => {
    const daysAgo = chartRange === "7d" ? 7 : chartRange === "30d" ? 30 : 90;
    return h.date >= getDaysAgo(daysAgo);
  }) || [];
  
  const chartData = {
    labels: filteredHistory.map((h) => h.date) || [],
    datasets: [
      {
        label: "Price ($)",
        data: filteredHistory.map((h) => numberOrNull(h.price))
          .filter((n): n is number => n !== null) || [],
        borderColor: "rgb(59,130,246)",
        tension: 0.2,
        fill: false,
      },
    ],
  };

  console.log(`[DEBUG] History data:`, history);
  console.log(`[DEBUG] Chart data:`, chartData);

  // {/* Add to Watchlist */}
  async function addToWatchlist() {
    if (!user) return router.push("/sign-in");
    setAddingAlert(true);
    setMsg("");
    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      await fetchJson(apiUrl(`/api/v1/watchlist`), {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          skinId: skin.id,
          priceAlert: alert === "" ? null : Number(alert),
        }),
      });
      setMsg("Added to watchlist!");
      
      // Refetch watchlist with JWT token
      const watchlistToken = await getToken({ template: "backend" });
      fetchJson(apiUrl("/api/v1/watchlist"), {
        headers: {
          ...(watchlistToken && { Authorization: `Bearer ${watchlistToken}` }),
        },
      }).then((w) => setWatchlist(Array.isArray(w) ? w : []));
    } catch (e: any) {
      setMsg(e.message || "Could not add skin.");
    } finally {
      setAddingAlert(false);
    }
  }

  // Handler: Add to Portfolio
  const addToPortfolio = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    setAddingPortfolio(true);
    setPortfolioMsg("");

    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      await fetchJson(apiUrl("/api/v1/portfolio"), {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          skinId: skin!.id,
          amount: Number(amount),
          buyPrice: Number(useMarketPrice ? skin!.marketPrice : buyPrice),
          buyDate,
        }),
      });
      setPortfolioMsg("Added to portfolio!");
      // Refetch portfolio to show new item with JWT token
      const portfolioToken = await getToken({ template: "backend" });
      fetchJson(apiUrl("/api/v1/portfolio"), {
        headers: {
          ...(portfolioToken && { Authorization: `Bearer ${portfolioToken}` }),
        },
      }).then((p) => setPortfolioSkins(Array.isArray(p) ? p : []));
      setTimeout(() => {
        setShowPortfolioModal(false);
      }, 1200);
    } catch (e: any) {
      setPortfolioMsg(e.message || "Could not add skin.");
    } finally {
      setAddingPortfolio(false);
    }
  };

  return (
  //Chart DIV
  <div className="min-h-screen bg-gray-950 text-white p-4">
    <div className="card max-w-xl mx-auto mt-10 flex flex-col items-center">

      {/* Loading/Error */}
      {loading && <div className="text-white py-8">Loading...</div>}
      {!loading && !skin && <div className="text-red-400 py-8">Skin not found!</div>}

      {/* Content */}
      {skin && (
        <>
          <img
            src={
              skin.itemimage ||
              skin.itemImage ||
              skin.image_url ||
              skin.imageUrl ||
              "/images/placeholder-skin.png"
            }
            alt={skin.name}
            className="w-36 h-36 md:w-48 md:h-48 object-contain rounded-xl mb-4 shadow-lg bg-neutral-800"
          />
                     <h1 className="text-2xl md:text-3xl font-extrabold mb-2 text-center">
             {skin.name}
           </h1>
           <div className="text-gray-400 mb-2 text-sm text-center">
             {skin.marketHashName}
           </div>
           
           {/* Tag Badges */}
           <TagBadges 
             isStattrak={skin.isStattrak} 
             isSouvenir={skin.isSouvenir} 
             isStar={skin.isStar} 
           />
           
           <div className="mb-4 text-lg font-semibold text-emerald-400 flex items-center gap-2 justify-center">
             <span>Current Price: {formatUSD(skin.marketPrice)}</span>
             {/* Price delta vs. yesterday */}
             <PriceDeltaBadge 
               current={skin.marketPrice} 
               yesterday={history?.[history.length-2]?.price ?? null} 
             />
           </div>

                     {/* Chart */}
           <div className="w-full bg-neutral-800 rounded-xl shadow-md p-4 mb-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-blue-400">Price History</h3>
               <ChartRangeTabs value={chartRange} onChange={setChartRange} />
             </div>
             <Line data={chartData} />
           </div>

                     {/* Enhanced Skin Details */}
           {loadingEnhanced ? (
             <div className="space-y-4">
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-48 w-full" />
               <Skeleton className="h-64 w-full" />
             </div>
           ) : (
             <>
               {marketStats && <MarketStatsCard stats={marketStats} />}
               {variants && variants.length > 0 && (
                 <SkinVariantsCard variants={variants} currentSkinId={skin?.id || 0} />
               )}
               {caseInfo && <CaseInfoCard caseInfo={caseInfo} />}
             </>
           )}

          {/* Add Skin to Portfolio */}
          <button
            className="btn-main bg-red-600 hover:bg-red-700 mt-4"
            onClick={() => setShowPortfolioModal(true)}
          >
            + Add to Portfolio
          </button>

          {showPortfolioModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
              <div className="bg-zinc-900 rounded-2xl shadow-xl p-6 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-zinc-400 hover:text-white"
                  onClick={() => setShowPortfolioModal(false)}
                >
                  ×
                </button>
                <h2 className="text-xl font-bold mb-4">{skin.name}</h2>

                {/* Menge */}
                <div className="mb-2">
                  <label className="block text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="input-main w-full"
                  />
                  <div className="text-xs text-zinc-400">How many units did you buy?</div>
                </div>

                {/* Preis */}
                <div className="mb-2">
                  <label className="block text-sm font-medium">Unit Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={useMarketPrice ? skin.marketPrice ?? "" : buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    disabled={useMarketPrice}
                    className="input-main w-full"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={useMarketPrice}
                      onChange={() => setUseMarketPrice(!useMarketPrice)}
                      id="useMarketPrice"
                    />
                    <label htmlFor="useMarketPrice" className="text-xs text-zinc-400">
                      Use market price
                    </label>
                  </div>
                  <div className="text-xs text-zinc-400">
                    The market price will be used if checked.
                  </div>
                </div>

                {/* Kaufdatum */}
                <div className="mb-2">
                  <label className="block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={buyDate}
                    onChange={(e) => setBuyDate(e.target.value)}
                    className="input-main w-full"
                  />
                </div>

                {/* Aktionen */}
                <button
                  className="btn-main mt-4 w-full"
                  onClick={addToPortfolio}
                  disabled={addingPortfolio}
                >
                  Add Product
                </button>
                {portfolioMsg && (
                  <div className="mt-2 text-sm text-emerald-400">{portfolioMsg}</div>
                )}
              </div>
            </div>
          )}

          {portfolioMsg && (
            <div className="mt-2 text-sm text-emerald-400">{portfolioMsg}</div>
          )}

          {/* Watchlist-Button & Alert */}
          <div className="mb-4 p-4 bg-neutral-800 rounded-xl w-full">
            <div className="mb-2 font-semibold">Add to Watchlist with Price Alert</div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="number"
                placeholder="Alert price (optional)"
                value={alert}
                onChange={(e) => setAlert(e.target.value === "" ? "" : Number(e.target.value))}
                className="input-main w-full sm:w-32"
                min={0}
                step={0.01}
              />
              <button
                onClick={addToWatchlist}
                className="btn-main w-full sm:w-auto"
                disabled={addingAlert}
              >
                Add to Watchlist
              </button>
            </div>
            {msg && (
              <div className="mt-2 text-sm text-yellow-400">{msg}</div>
            )}
            {watchlist.some((item) => item.skinId === skin.id) && (
              <div className="mb-2 text-green-400 text-sm font-semibold">
                Already on your Watchlist!
              </div>
            )}
          </div>

          {/* Purchase Accordion - Shows portfolio data for THIS skin only */}
          {portfolioPurchasesForSkin.length > 0 && (
            <PurchaseAccordion
              purchases={portfolioPurchasesForSkin}
              total={totalAmount}
              avgPrice={avgPrice}
              performance={performance}
            />
          )}

          {/* Steam-Link & Navigation */}
          <a
            href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(
              skin?.marketHashName || ""
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline mt-2"
          >
            View on Steam Market
          </a>
          <div className="mt-6 text-center">
            <Link href="/skins" className="text-neutral-400 hover:underline">
              ← Back to all skins
            </Link>
          </div>
        </>
      )}
    </div>
  </div>
);
}
