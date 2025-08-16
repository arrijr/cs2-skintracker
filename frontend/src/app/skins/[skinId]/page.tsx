"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import { useAuth } from "../../context/AuthContext";


// {/* API layer */}
import {
  addToWatchlist as apiAddToWatchlist,
  getWatchlist,
  getPortfolio,
} from "@/lib/api";
import { apiFetch } from "@/lib/http"; // for skin detail/history
import PurchaseAccordion from "../../components/PurchaseAccordion";
import SkinPortfolioCard from "../../components/SkinPortfolioCard";


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
  const { token } = useAuth();

  // {/* derive skinId */}
  const routeParams = useParams<{ skinid?: string; skinId?: string; id?: string }>();
  const skinId = String(routeParams?.skinid ?? routeParams?.skinId ?? routeParams?.id ?? "");
  console.log("[SkinDetail] routeParams:", routeParams, "→ skinId:", skinId);

  const [mounted, setMounted] = useState(false);
  const [skin, setSkin] = useState<Skin | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  
  // {/* Watchlist UI state */}
  const [alert, setAlert] = useState<number | "">("");  // Preis-Alert Eingabe
  const [adding, setAdding] = useState(false);          // <-- FEHLTE (Fix)
  const [watchlistMsg, setWatchlistMsg] = useState(""); // Feedback/Fehlertext
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // Portfolio
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [amount, setAmount] = useState(1);
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [useMarketPrice, setUseMarketPrice] = useState(false);
  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [portfolioMsg, setPortfolioMsg] = useState("");

  // Filter/Sort für Portfolio
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");


  if (!skinId) {
    console.warn("Invalid skinId param");
  }

  // {/* Data load effect */}
  useEffect(() => {
    if (!skinId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Basis-Daten: Skin + History parallel laden
        const [s, h] = await Promise.all([
          apiFetch(`/api/v1/skins/${skinId}`),
          apiFetch(`/api/v1/skins/${skinId}/history`).catch(() => []),
        ]);

        if (!cancelled) {
          setSkin(s || null);
          setHistory(Array.isArray(h) ? h : []);
        }

        // Auth-Daten nur laden, wenn eingeloggt
        if (token) {
          const [w, p] = await Promise.all([getWatchlist(), getPortfolio()]);
          if (!cancelled) {
            setWatchlist(Array.isArray(w) ? w : []);
            setPortfolioSkins(Array.isArray(p) ? p : []);
          }
        }
      } catch (err) {
        // optional: setError(String(err));
        console.error("skin detail load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skinId, token]);

  // {/* mounted guard */}
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;
  if (loading) return <div className="text-white py-8">Loading…</div>;
  if (!skin) return <div className="text-red-400 py-8">Skin not found!</div>;

  // {/* Derived */}
  const img = skin.itemimage || skin.itemImage || skin.image_url || skin.imageUrl || "/images/placeholder-skin.png";
  const marketPrice = skin.marketPrice ?? null;

  // Portfolio-Käufe für diesen Skin
  const portfolioPurchasesForSkin = portfolioSkins.filter(
    (p) => p.skinId === skin?.id
  );

  const totalAmount = portfolioPurchasesForSkin.reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalValue = portfolioPurchasesForSkin.reduce((sum: number, p: any) => sum + (p.amount * p.buyPrice), 0);
  const avgPrice = totalAmount > 0 ? totalValue / totalAmount : 0;
  const performance =
    skin?.marketPrice && avgPrice ? ((skin.marketPrice - avgPrice) / avgPrice) * 100 : null;

  // {/* Chart data */}
  const chartData = {
    labels: history.map((h) => h.date),
    datasets: [
      {
        label: "Price ($)",
        data: history.map((h) => h.price),
        borderColor: "rgb(59,130,246)",
        tension: 0.2,
        fill: false,
      },
    ],
  };

  // Filtered Portfolio (optional)
  const filteredPortfolio = portfolioSkins
    .filter((p: any) => p.skin?.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      if (sort === "performance") return (b.performance || 0) - (a.performance || 0);
      if (sort === "amount") return (b.amount || 0) - (a.amount || 0);
      return new Date(b.buyDate).getTime() - new Date(a.buyDate).getTime(); // recent
    });

  // {/* Handler: Add to Watchlist */}
  async function handleAddToWatchlist() {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!skin?.id) {
      setWatchlistMsg("Invalid skin.");
      return;
    }

    setAdding(true);
    setWatchlistMsg("");

    try {
      // alert === "" -> optional (Backend darf null/undefined akzeptieren)
      const payloadAlert = alert === "" ? undefined : Number(alert);
      await apiAddToWatchlist(Number(skin.id), payloadAlert);

      setWatchlistMsg("Added to watchlist!");
      // Watchlist lokal nachziehen
      const w = await getWatchlist().catch(() => []);
      setWatchlist(Array.isArray(w) ? w : []);
    } catch (e: any) {
      setWatchlistMsg(e?.message || "Failed to add to watchlist.");
    } finally {
      setAdding(false);
    }
  }

  // {/* Handler: Add to Portfolio */}
  const addToPortfolio = async () => {
    if (!token) return router.push("/login");
    setAddingPortfolio(true);
    setPortfolioMsg("");

    try {

      await apiFetch("/api/v1/portfolio", {
        method: "POST",
        body: JSON.stringify({
          skinId: skin!.id,

      await apiFetch(`/api/v1/portfolio`, {
        method: "POST",
        body: JSON.stringify({
          skinId: Number(skin!.id),

          amount: Number(amount),
          buyPrice: Number(useMarketPrice ? skin!.marketPrice : buyPrice),
          buyDate,
        }),
      });

      setPortfolioMsg("Added to portfolio!");

      // Refetch portfolio to show new item
      getPortfolio().then((p) => setPortfolioSkins(Array.isArray(p) ? p : []));
      setTimeout(() => {
        setShowPortfolioModal(false);
      }, 1200);
    } catch (e: any) {
      setPortfolioMsg(e.message || "Could not add skin.");

      // optional: lokale Daten neu laden
      const p = await getPortfolio().catch(() => []);
      setPortfolioSkins(Array.isArray(p) ? p : []);

      setTimeout(() => {
        setShowPortfolioModal(false);
        setPortfolioMsg("");
        setAmount(1);
        setBuyPrice("");
        setBuyDate("");
        setUseMarketPrice(false);
      }, 800);
    } catch (e: any) {
      setPortfolioMsg(e?.message || "Could not add skin.");

    } finally {
      setAddingPortfolio(false);
    }
  };

  // {/* Steam market hash resolver */}
  const marketHashName =
    (skin as any)?.marketHashName ??
    (skin as any)?.market_hash_name ??
    skin?.name ??
    "";

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
          <div className="mb-4 text-lg font-semibold text-emerald-400">
            Current Price: {skin.marketPrice} $
          </div>

          {/* Chart */}
          <div className="w-full bg-neutral-800 rounded-xl shadow-md p-4 mb-6">
            <Line data={chartData} />
          </div>

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
                onClick={handleAddToWatchlist}
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

          {/* Portfolio Filter */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select
              className="input-main"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Recent buy</option>
              <option value="performance">Best performance</option>
              <option value="amount">Most owned</option>
            </select>
          </div>

          {/* Portfolio Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPortfolio.map((item: any) => (
              <SkinPortfolioCard key={item.skinId} item={item} />
            ))}
          </div>

          {/* Purchase Accordion */}
          <PurchaseAccordion
            purchases={portfolioPurchasesForSkin}
            total={totalAmount}
            avgPrice={avgPrice}
            performance={performance}
          />

          {/* Steam-Link & Navigation */}
          <div className="mt-6 text-center space-y-2">
            {marketHashName ? (
              <a
                href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(marketHashName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                View on Steam Market
              </a>
            ) : (
              <div className="text-neutral-500 text-sm">No Steam listing key available.</div>
            )}

            <div>
              <Link href="/skins" className="text-neutral-400 hover:underline">
                ← Back to all skins
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);
}
