// frontend/src/app/skins/[skinId]/page.tsx — [Frontend]
// {/* Enhanced Skin Detail Page with P1, P2, P3 Features */}
"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Heart, Plus, ExternalLink, ArrowLeft, Share2, Download, TrendingUp, TrendingDown, Info, Check, Loader2 } from "lucide-react";
// {/* Central API helpers */}
import {
  getPortfolio,
  getWatchlist,
  apiUrl,
  fetchJson,
} from "@/lib/api";
import { formatUSD, safeToFixed, numberOrNull } from "@/lib/num";
import MarketStatsCard from "../../components/skins/MarketStatsCard";
import SkinVariantsCard from "../../components/skins/SkinVariantsCard";
import CaseInfoCard from "../../components/skins/CaseInfoCard";
import PriceDeltaBadge from "../../components/skins/PriceDeltaBadge";
import ChartRangeTabs, { Range } from "../../components/skins/ChartRangeTabs";
import TagBadges from "../../components/skins/TagBadges";

// Chart.js Registration
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Skin = {
  id: number;
  name: string;
  marketHashName?: string;
  marketPrice?: number;
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  imageUrl?: string;
  isStattrak?: boolean;
  isSouvenir?: boolean;
  isStar?: boolean;
  wear?: string;
  rarity?: string;
  weaponType?: string;
  collection?: string;
};

type PriceHistory = { date: string; price: number };

export default function SkinDetailPage({ params }: { params: { skinId: string } }) {
  // *** ALLE STATES GANZ OBEN ***
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const skinId = String(params.skinId ?? params.id ?? "");

  const [mounted, setMounted] = useState(false);
  const [skin, setSkin] = useState<Skin | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // P1 - URL Sync States
  const [variant, setVariant] = useState(searchParams.get("variant") || "");
  const [chartRange, setChartRange] = useState<Range>((searchParams.get("range") as Range) || "30d");
  const [chartScale, setChartScale] = useState(searchParams.get("scale") === "log" ? "log" : "linear");
  const [movingAverage, setMovingAverage] = useState(searchParams.get("ma") || "none");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // Watchlist & Portfolio
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // Price Alerts
  const [alertPrice, setAlertPrice] = useState<number | "">("");
  const [addingAlert, setAddingAlert] = useState(false);

  // Enhanced Skin Details
  const [loadingEnhanced, setLoadingEnhanced] = useState(true);
  const [marketStats, setMarketStats] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  const [relatedSkins, setRelatedSkins] = useState<any[]>([]);

  // *** ALLE useEffect HOOKS OBEN ***
  useEffect(() => {
    setMounted(true);
  }, []);

  // P1 - URL Sync
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (variant) params.set("variant", variant);
    if (chartRange !== "30d") params.set("range", chartRange);
    if (chartScale !== "linear") params.set("scale", chartScale);
    if (movingAverage && movingAverage !== "none") params.set("ma", movingAverage);
    if (activeTab !== "overview") params.set("tab", activeTab);
    
    const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newURL, { scroll: false });
  }, [variant, chartRange, chartScale, movingAverage, activeTab, router]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Load skin data
  useEffect(() => {
    if (!skinId) return;
    let cancelled = false;

    const loadSkinData = async () => {
      setLoading(true);
      try {
        const [skinData, historyData] = await Promise.all([
          fetchJson(apiUrl(`/api/v1/skins/${skinId}`)),
          fetchJson(apiUrl(`/api/v1/skins/${skinId}/history?range=${chartRange}`))
        ]);
        
        if (!cancelled) {
          setSkin(skinData);
          setHistory(historyData || []);
        }
      } catch (error) {
        console.error("Error loading skin data:", error);
        if (!cancelled) {
          setSkin(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSkinData();
    return () => { cancelled = true; };
  }, [skinId, chartRange]);

  // Load enhanced data
  useEffect(() => {
    if (!skin) return;

    const loadEnhancedData = async () => {
      setLoadingEnhanced(true);
      try {
        const [statsData, variantsData, caseData, relatedData] = await Promise.all([
          fetchJson(apiUrl(`/api/v1/skins/${skinId}/market-stats`)).catch(() => null),
          fetchJson(apiUrl(`/api/v1/skins/${skinId}/variants`)).catch(() => []),
          fetchJson(apiUrl(`/api/v1/skins/${skinId}/case`)).catch(() => null),
          fetchJson(apiUrl(`/api/v1/skins/${skinId}/related`)).catch(() => [])
        ]);

        setMarketStats(statsData);
        setVariants(variantsData);
            setCaseInfo(caseData);
        setRelatedSkins(relatedData);
      } catch (error) {
        console.error("Error loading enhanced data:", error);
        } finally {
            setLoadingEnhanced(false);
      }
    };

    loadEnhancedData();
  }, [skin, skinId]);

  // Check watchlist/portfolio status
  useEffect(() => {
    if (!user || !skin) return;

    const checkStatus = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const [watchlistData, portfolioData] = await Promise.all([
          fetchJson(apiUrl("/api/v1/watchlist"), {
            headers: { "Authorization": `Bearer ${token}` }
          }).catch(() => []),
          fetchJson(apiUrl("/api/v1/portfolio"), {
            headers: { "Authorization": `Bearer ${token}` }
          }).catch(() => [])
        ]);

        setIsInWatchlist(watchlistData.some((item: any) => item.skinId === skin.id));
        setIsInPortfolio(portfolioData.some((item: any) => item.skinId === skin.id));
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    checkStatus();
  }, [user, skin, getToken]);

  // P1 - Watchlist Functions
  const addToWatchlist = async () => {
    if (!user || !skin) {
      toast.error("Please sign in to add to watchlist");
      return;
    }

    setWatchlistLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token available");

      await fetchJson(apiUrl("/api/v1/watchlist"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skinId: skin.id }),
      });

      setIsInWatchlist(true);
      toast.success(`${skin.name} added to watchlist!`);
    } catch (error) {
      console.error("Watchlist error:", error);
      toast.error("Failed to add to watchlist");
    } finally {
      setWatchlistLoading(false);
    }
  };

  // P1 - Portfolio Functions
  const addToPortfolio = async () => {
    if (!user || !skin) {
      toast.error("Please sign in to add to portfolio");
      return;
    }

    setPortfolioLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token available");

      await fetchJson(apiUrl("/api/v1/portfolio"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skinId: skin.id,
          amount: 1,
          buyPrice: skin.marketPrice || 0,
          buyDate: new Date().toISOString().slice(0, 10),
        }),
      });

      setIsInPortfolio(true);
      toast.success(`${skin.name} added to portfolio!`);
    } catch (error) {
      console.error("Portfolio error:", error);
      toast.error("Failed to add to portfolio");
    } finally {
      setPortfolioLoading(false);
    }
  };

  // P1 - Price Alert Functions
  const addPriceAlert = async () => {
    if (!user || !skin || !alertPrice) {
      toast.error("Please enter a valid alert price");
      return;
    }

    setAddingAlert(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token available");
      
      await fetchJson(apiUrl("/api/v1/alerts"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skinId: skin.id,
          alertPrice: Number(alertPrice),
        }),
      });

      toast.success(`Price alert set at $${alertPrice}`);
      setAlertPrice("");
    } catch (error) {
      console.error("Alert error:", error);
      toast.error("Failed to set price alert");
    } finally {
      setAddingAlert(false);
    }
  };

  // P1 - Share Functions
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  // P3 - Export Functions
  const exportData = async () => {
    if (!history.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const csvContent = [
        "Date,Price",
        ...history.map(h => `${h.date},${h.price}`)
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${skin?.name || "skin"}-price-history.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  // Chart data with moving averages
  const chartData = useMemo((): ChartData<"line"> => {
    if (!history.length) return { labels: [], datasets: [] };

    const labels = history.map(h => new Date(h.date).toLocaleDateString());
    const prices = history.map(h => h.price);

    const datasets = [
      {
        label: "Price",
        data: prices,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      },
    ];

    // Add moving averages if enabled
    if (movingAverage === "7") {
      const ma7 = calculateMovingAverage(prices, 7);
      datasets.push({
        label: "MA 7",
        data: ma7,
        borderColor: "#f59e0b",
        backgroundColor: "transparent",
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        tension: 0.1,
      });
    }

    if (movingAverage === "30") {
      const ma30 = calculateMovingAverage(prices, 30);
      datasets.push({
        label: "MA 30",
        data: ma30,
        borderColor: "#8b5cf6",
        backgroundColor: "transparent",
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        tension: 0.1,
      });
    }

    return { labels, datasets };
  }, [history, movingAverage]);

  // Helper function to calculate moving average
  const calculateMovingAverage = (data: number[], period: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const average = slice.reduce((sum, val) => sum + val, 0) / period;
        result.push(average);
      }
    }
    return result;
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      y: {
        type: chartScale === "log" ? "logarithmic" : "linear",
        display: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
          callback: (value) => `$${Number(value).toFixed(2)}`,
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* P1 - Skin Header */}
        {/* Skin Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-64 h-64 mx-auto md:mx-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          ) : skin ? (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Skin Image */}
              <div className="flex-shrink-0">
                <div className="relative w-64 h-64 mx-auto md:mx-0">
                  <Image
            src={
              skin.itemimage ||
              skin.itemImage ||
              skin.image_url ||
              skin.imageUrl ||
              "/images/placeholder-skin.png"
            }
            alt={skin.name}
                    fill
                    className="object-contain rounded-xl bg-muted"
                    priority
                    quality={90}
                  />
                </div>
           </div>
           
              {/* Skin Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{skin.name}</h1>
                  <p className="text-muted-foreground mb-4">{skin.marketHashName}</p>
                  
                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4">
           <TagBadges 
             isStattrak={skin.isStattrak} 
             isSouvenir={skin.isSouvenir} 
             isStar={skin.isStar} 
           />
                    {skin.wear && (
                      <Badge variant="outline">{skin.wear}</Badge>
                    )}
                    {skin.rarity && (
                      <Badge variant="secondary">{skin.rarity}</Badge>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">
                    {formatUSD(skin.marketPrice)}
                  </div>
             <PriceDeltaBadge 
               current={skin.marketPrice} 
               yesterday={history?.[history.length-2]?.price ?? null} 
             />
           </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={addToWatchlist}
                    disabled={watchlistLoading || isInWatchlist}
                    variant={isInWatchlist ? "default" : "outline"}
                    size="sm"
                  >
                    {watchlistLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isInWatchlist ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                    {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                  </Button>

                  <Button
                    onClick={addToPortfolio}
                    disabled={portfolioLoading || isInPortfolio}
                    variant={isInPortfolio ? "default" : "outline"}
                    size="sm"
                  >
                    {portfolioLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isInPortfolio ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isInPortfolio ? "In Portfolio" : "Add to Portfolio"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://steamcommunity.com/market/listings/730/${skin.marketHashName}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Steam Market
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-destructive mb-2">Skin not found</h2>
              <p className="text-muted-foreground">The skin you're looking for doesn't exist.</p>
             </div>
          )}
           </div>

        {/* Mobile Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:hidden z-50">
          <div className="flex gap-2">
            <Button
              onClick={addToWatchlist}
              disabled={watchlistLoading || isInWatchlist}
              variant={isInWatchlist ? "default" : "outline"}
              className="flex-1"
            >
              {watchlistLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isInWatchlist ? (
                <Check className="h-4 w-4" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={addToPortfolio}
              disabled={portfolioLoading || isInPortfolio}
              variant={isInPortfolio ? "default" : "outline"}
              className="flex-1"
            >
              {portfolioLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isInPortfolio ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Price History - Moved out of tabs */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Price History</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={chartRange} onValueChange={(value: Range) => setChartRange(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="7d">7d</SelectItem>
                    <SelectItem value="30d">30d</SelectItem>
                    <SelectItem value="90d">90d</SelectItem>
                    <SelectItem value="1y">1y</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={chartScale} onValueChange={setChartScale}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="log">Log</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={movingAverage} onValueChange={setMovingAverage}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="MA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="7">MA 7</SelectItem>
                    <SelectItem value="30">MA 30</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {history.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No price data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* P1 - Market Statistics */}
        {/* Market Statistics */}
        {loadingEnhanced ? (
          <Skeleton className="h-32 w-full mb-8" />
        ) : marketStats ? (
          <div className="mb-8">
            <MarketStatsCard stats={marketStats} />
          </div>
        ) : null}

        {/* P1 - Skin Variants */}
        {/* Skin Variants */}
        {loadingEnhanced ? (
          <Skeleton className="h-64 w-full mb-8" />
        ) : variants.length > 0 ? (
          <div className="mb-8">
            <SkinVariantsCard 
              variants={variants} 
              currentSkinId={skin?.id || 0}
              onVariantSelect={(variantId) => {
                setVariant(variantId.toString());
                // Navigate to variant
                router.push(`/skins/${variantId}`);
              }}
            />
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No variants available</p>
            </CardContent>
          </Card>
        )}

        {/* P1 - Case Information */}
        {/* Case Information */}
        {loadingEnhanced ? (
          <Skeleton className="h-48 w-full mb-8" />
        ) : caseInfo ? (
          <div className="mb-8">
            <CaseInfoCard caseInfo={caseInfo} />
          </div>
        ) : null}

        {/* P2 - Related Skins */}
        {/* Related Skins */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Related Skins</h2>
          {loadingEnhanced ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : relatedSkins.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedSkins.map((relatedSkin) => (
                <Link key={relatedSkin.id} href={`/skins/${relatedSkin.id}`}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                    <CardContent className="p-4">
                      <div className="aspect-square relative mb-2">
                        <Image
                          src={relatedSkin.imageUrl || "/images/placeholder-skin.png"}
                          alt={relatedSkin.name}
                          fill
                          className="object-contain rounded group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-medium text-sm truncate mb-1">{relatedSkin.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-bold">{formatUSD(relatedSkin.priceAvg || relatedSkin.marketPrice)}</p>
                        <div className="flex gap-1">
                          {relatedSkin.isStattrak && (
                            <Badge variant="secondary" className="text-xs">ST</Badge>
                          )}
                          {relatedSkin.isSouvenir && (
                            <Badge variant="outline" className="text-xs">SV</Badge>
                          )}
                        </div>
                      </div>
                      {relatedSkin.wear && (
                        <p className="text-xs text-muted-foreground mt-1">{relatedSkin.wear}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No related skins found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* P1 - Price Alerts & Watchlist */}
        {/* Price Alerts & Watchlist */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Price Alerts & Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Alert price"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value ? Number(e.target.value) : "")}
                className="flex-1"
              />
              <Button
                onClick={addPriceAlert}
                disabled={addingAlert || !alertPrice}
              >
                {addingAlert ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Set Alert"
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Get notified when the price reaches your target.
            </p>
          </CardContent>
        </Card>
    </div>
  </div>
);
}