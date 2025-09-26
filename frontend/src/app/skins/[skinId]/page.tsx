// frontend/src/app/skins/[skinId]/page.tsx — [Frontend]
// {/* Enhanced Skin Detail Page with P1, P2, P3 Features */}
"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SkinImage from "@/components/SkinImage";
import { SimplePriceChart } from "@/components/charts/simple-price-chart";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Heart, Plus, ExternalLink, ArrowLeft, Share2, Download, TrendingUp, TrendingDown, Info, Check, Loader2, Copy, BarChart3, Users, Clock, DollarSign, Home, RefreshCw, HelpCircle, Eye, Shield, Settings } from "lucide-react";
// {/* Central API helpers */}
import {
  getPortfolio,
  getWatchlist,
  apiUrl,
  fetchJson,
} from "@/lib/api";
import { formatUSD, safeToFixed, numberOrNull } from "@/lib/num";
import { useAnalytics } from "@/lib/analytics";
import { CaseSection } from "@/components/CaseSection";
import QuantityBarChart from "@/components/QuantityBarChart";
import OverlayPriceQuantityChart from "@/components/OverlayPriceQuantityChart";

// Chart components are now handled by Shadcn UI Charts

type Skin = {
  id: number;
  name: string;
  marketHashName?: string;
  marketPrice?: number;
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  imageUrl?: string;
  wear?: string;
  rarity?: string;
  quality?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  priceMedian24h?: number;
  priceMedian7d?: number;
  priceMedian30d?: number;
  priceMedian90d?: number;
  priceAvg?: number;
  priceMedian?: number;
};

type PriceHistory = {
  date: string;
  price: number;
};

type Range = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

export default function SkinDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const analytics = useAnalytics();

  const [mounted, setMounted] = useState(false);
  const [skin, setSkin] = useState<Skin | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  const [marketStats, setMarketStats] = useState<any>(null);
  const [relatedSkins, setRelatedSkins] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loadingEnhanced, setLoadingEnhanced] = useState(false);
  
  // P1 - URL Sync States
  const [chartRange, setChartRange] = useState<Range>((searchParams.get("range") as Range) || "30d");
  const [chartScale, setChartScale] = useState(searchParams.get("scale") === "log" ? "log" : "linear");
  const [movingAverage, setMovingAverage] = useState(searchParams.get("ma") || "none");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [overlayMode, setOverlayMode] = useState(searchParams.get("overlay") === "true");

  // Watchlist & Portfolio
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<any[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [alertPrice, setAlertPrice] = useState<number | "">("");
  const [addingAlert, setAddingAlert] = useState(false);

  // P1 - URL Sync with P3 Analytics
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (chartRange !== "30d") params.set("range", chartRange);
    if (chartScale !== "linear") params.set("scale", chartScale);
    if (movingAverage && movingAverage !== "none") params.set("ma", movingAverage);
    if (activeTab !== "overview") params.set("tab", activeTab);
    if (overlayMode) params.set("overlay", "true");
    
    const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newURL, { scroll: false });
  }, [chartRange, chartScale, movingAverage, activeTab, overlayMode, router]);

  // Update URL when overlay mode changes
  useEffect(() => {
    updateURL();
  }, [overlayMode, updateURL]);

  // P3 - Analytics: Track parameter changes
  const [previousParams, setPreviousParams] = useState({
    chartRange: "30d" as Range,
    chartScale: "linear",
    movingAverage: "none",
  });

  useEffect(() => {
    // Track range change
    if (chartRange !== previousParams.chartRange) {
      analytics.trackRangeChange(chartRange, previousParams.chartRange);
    }

    // Track scale toggle
    if (chartScale !== previousParams.chartScale) {
      analytics.trackScaleToggle(chartScale, previousParams.chartScale);
    }

    // Track moving average toggle
    if (movingAverage !== previousParams.movingAverage) {
      analytics.trackMovingAverageToggle(movingAverage, previousParams.movingAverage);
    }

    setPreviousParams({
      chartRange,
      chartScale,
      movingAverage,
    });
  }, [chartRange, chartScale, movingAverage, skin, analytics]);

  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // P1 - Enhanced Data Loading
  useEffect(() => {
    async function loadEnhancedData() {
      if (!skin?.id) return;
      
      setLoadingEnhanced(true);
      try {
        const [caseRes, marketRes, relatedRes, variantsRes] = await Promise.all([
          fetchJson(apiUrl(`/api/v1/skins/${skin.id}/case-info`)),
          fetchJson(apiUrl(`/api/v1/skins/${skin.id}/market-stats`)),
          fetchJson(apiUrl(`/api/v1/skins/${skin.id}/related`)),
          fetchJson(apiUrl(`/api/v1/skins/${skin.id}/variants`))
        ]);
        setCaseInfo(caseRes?.case || null); // New endpoint returns { case: {...} }
        setMarketStats(marketRes || null);
        setRelatedSkins(relatedRes || []);
        setVariants(variantsRes?.variants || []);
      } catch (error) {
        console.error("Failed to load enhanced data:", error);
      } finally {
        setLoadingEnhanced(false);
      }
    }
    
    loadEnhancedData();
  }, [skin?.id]);

  // P1 - Price History with better states
  useEffect(() => {
    async function loadPriceHistory() {
      if (!skin?.id) return;
      
      try {
        const historyData = await fetchJson(apiUrl(`/api/v1/skins/${skin.id}/history`));
        setHistory(historyData || []);
      } catch (error) {
        console.error("Failed to load price history:", error);
        setHistory([]);
      }
    }
    
    loadPriceHistory();
  }, [skin?.id]);

  // Filter history based on selected range
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    
    const now = new Date();
    const filtered = history.filter(item => {
      const itemDate = new Date(item.date);
      const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      
      switch (chartRange) {
        case "24h":
          return daysDiff <= 1;
        case "7d":
          return daysDiff <= 7;
        case "30d":
          return daysDiff <= 30;
        case "90d":
          return daysDiff <= 90;
        case "1y":
          return daysDiff <= 365;
        case "all":
        default:
          return true;
      }
    });
    
    return filtered;
  }, [history, chartRange]);

  // Chart data is now handled by the PriceHistoryChart component

  // P1 - Watchlist & Portfolio Management
  const isInWatchlist = useMemo(() => 
    watchlist.some(item => item.skinId === skin?.id), 
    [watchlist, skin?.id]
  );

  const isInPortfolio = useMemo(() => 
    portfolioSkins.some(item => item.skinId === skin?.id), 
    [portfolioSkins, skin?.id]
  );

  const addToWatchlist = async () => {
    if (!skin?.id || !user) return;
    
    setWatchlistLoading(true);
    try {
      const token = await getToken({ template: "backend" });
      await fetchJson(apiUrl("/api/v1/watchlist"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ skinId: skin.id }),
      });
      
      setWatchlist(prev => [...prev, { skinId: skin.id, skin: skin }]);
      
      // P3 - Analytics: Track watchlist add
      analytics.trackWatchlistAdd(skin.id, skin.name, skin.marketPrice || 0);
      
      toast.success("Added to watchlist");
    } catch (error) {
      // P3 - Analytics: Track error
      analytics.trackError("watchlist_add_failed", "addToWatchlist", skin.id);
      toast.error("Failed to add to watchlist");
    } finally {
      setWatchlistLoading(false);
    }
  };

  const addToPortfolio = async () => {
    if (!skin?.id || !user) return;
    
    setPortfolioLoading(true);
    try {
      const token = await getToken({ template: "backend" });
      await fetchJson(apiUrl("/api/v1/portfolio"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ skinId: skin.id, quantity: 1 }),
      });
      
      setPortfolioSkins(prev => [...prev, { skinId: skin.id, skin: skin, quantity: 1 }]);
      
      // P3 - Analytics: Track portfolio add
      analytics.trackPortfolioAdd(skin.id, skin.name, skin.marketPrice || 0);
      
      toast.success("Added to portfolio");
    } catch (error) {
      // P3 - Analytics: Track error
      analytics.trackError("portfolio_add_failed", "addToPortfolio", skin.id);
      toast.error("Failed to add to portfolio");
    } finally {
      setPortfolioLoading(false);
    }
  };

  // P1 - Price Alert Management with P3 Analytics
  const addPriceAlert = async () => {
    if (!skin?.id || !user || !alertPrice) return;
    
    setAddingAlert(true);
    try {
      const token = await getToken({ template: "backend" });
      await fetchJson(apiUrl("/api/v1/watchlist"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          skinId: skin.id,
          priceAlert: alertPrice
        }),
      });
      
      // P3 - Analytics: Track alert creation
      analytics.trackAlertCreate(skin.id, skin.name, alertPrice);
      
      toast.success(`Price alert set at ${formatUSD(alertPrice)}`);
      setAlertPrice("");
    } catch (error) {
      // P3 - Analytics: Track error
      analytics.trackError("alert_create_failed", "addPriceAlert", skin.id);
      toast.error("Failed to set price alert");
    } finally {
      setAddingAlert(false);
    }
  };

  // P2 - Export Data (CSV/JSON) with P3 Analytics
  const exportData = useCallback((format: 'csv' | 'json' = 'csv') => {
    if (!filteredHistory.length) {
      toast.error("No data to export");
      return;
    }
    
    let content: string;
    let filename: string;
    let mimeType: string;
    
    if (format === 'json') {
      content = JSON.stringify(filteredHistory, null, 2);
      filename = `${skin?.name || 'skin'}-price-history-${chartRange}.json`;
      mimeType = "application/json";
    } else {
      content = [
        "Date,Price",
        ...filteredHistory.map(h => `${h.date},${h.price}`)
      ].join("\n");
      filename = `${skin?.name || 'skin'}-price-history-${chartRange}.csv`;
      mimeType = "text/csv";
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    // P3 - Analytics: Track export
    if (skin) {
      analytics.trackExportData(skin.id, skin.name, format, filteredHistory.length);
    }
    
    toast.success(`Data exported as ${format.toUpperCase()}`);
  }, [filteredHistory, skin, analytics, chartRange]);

  // P2 - Scroll Position Restoration
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('skin-detail-scroll');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('skin-detail-scroll');
    }
  }, []);

  // P2 - Save scroll position before navigation
  const handleBackToResults = useCallback(() => {
    sessionStorage.setItem('skin-detail-scroll', window.scrollY.toString());
    router.back();
  }, [router]);

  // P2 - Copy Link with P3 Analytics
  const copyLink = useCallback(async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    
    // P3 - Analytics: Track copy link
    if (skin) {
      analytics.trackCopyLink(skin.id, skin.name);
    }
    
    toast.success("Link copied to clipboard");
  }, [skin, analytics]);

  // Load skin data with P3 Analytics
  useEffect(() => {
    async function loadSkin() {
      const skinId = window.location.pathname.split('/').pop();
      if (!skinId) return;
      
      setLoading(true);
      try {
        const skinData = await fetchJson(apiUrl(`/api/v1/skins/${skinId}`));
        setSkin(skinData);
        
        // P3 - Analytics: Track page view
        analytics.trackPageView(parseInt(skinId), skinData.name);
      } catch (error) {
        console.error("Failed to load skin:", error);
        // P3 - Analytics: Track error
        analytics.trackError("skin_load_failed", "loadSkin", parseInt(skinId));
        toast.error("Failed to load skin data");
    } finally {
        setLoading(false);
      }
    }
    
    loadSkin();
  }, [analytics]);

  // Load watchlist and portfolio
  useEffect(() => {
    async function loadUserData() {
      if (!user || !isLoaded) return;
      
      try {
        const token = await getToken({ template: "backend" });
        const [watchlistData, portfolioData] = await Promise.all([
          fetchJson(apiUrl("/api/v1/watchlist"), {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetchJson(apiUrl("/api/v1/portfolio"), {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);
        
        setWatchlist(watchlistData || []);
        setPortfolioSkins(portfolioData || []);
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    }
    
    loadUserData();
  }, [user, isLoaded, getToken]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const skinImageUrl = skin?.itemimage || 
    skin?.itemImage || 
    skin?.image_url || 
    skin?.imageUrl || 
    "/images/placeholder-skin.png";

  return (
    <div className="dashboard-bg">
      <TooltipProvider>
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 relative z-10">
        {/* P1 - Skin Header */}
        {/* Skin Header - Preis + 24h/7d-Change, konsistente Badges & Quick-Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToResults}
              className="flex items-center gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to results
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
                  {skinImageUrl && skinImageUrl !== "/images/placeholder-skin.png" ? (
                    <SkinImage
                      src={skinImageUrl}
                      alt={skin.name}
                      fill
                      priority
                      quality={90}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/30 rounded-lg flex items-center justify-center">
                      <Image
                        src={skinImageUrl}
                        alt={skin.name}
                        fill
                        className="object-contain p-4"
                        priority
                        quality={90}
                      />
                    </div>
                  )}
                </div>
              </div>
           
              {/* Skin Info */}
              <div className="flex-1 space-y-4">
                <div>
                  {/* Breadcrumb navigation: Cases > Case > Skin */}
                  <Breadcrumb className="mb-4">
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          Home
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/skins">Skins</BreadcrumbLink>
                      </BreadcrumbItem>
                      {caseInfo && (
                        <>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbLink href={`/cases/${encodeURIComponent(caseInfo.name)}`}>
                              {caseInfo.name}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        </>
                      )}
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium">
                          {skin.name}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  
                  <h1 className="text-3xl font-bold mb-2">{skin.name}</h1>
                  <p className="text-muted-foreground mb-4">{skin.marketHashName}</p>
                  
                  {/* P1 - Badges - farbcodiert und konsistent */}
                  <div className="flex items-center gap-2 mb-4">
                    {/* Rarity Badge - farbcodiert mit abgestufter Palette */}
                    <Badge 
                      variant="outline" 
                      className={`text-sm font-semibold ${
                        skin.rarity === 'Covert' ? 'border-red-500 text-red-500 bg-red-500/10 dark:bg-red-500/10 dark:text-red-500' :
                        skin.rarity === 'Classified' ? 'border-pink-500 text-pink-500 bg-pink-500/10 dark:bg-pink-500/10 dark:text-pink-500' :
                        skin.rarity === 'Restricted' ? 'border-brand-purple-600 text-brand-purple-600 bg-brand-purple-600/10 dark:bg-brand-purple-600/10 dark:text-brand-purple-600' :
                        skin.rarity === 'Mil-Spec' ? 'border-brand-slate-500 text-brand-slate-500 bg-brand-slate-500/10 dark:bg-brand-slate-500/10 dark:text-brand-slate-500' :
                        skin.rarity === 'Industrial' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/10 dark:text-cyan-500' :
                        skin.rarity === 'Consumer' ? 'border-brand-slate-400 text-brand-slate-400 bg-brand-slate-400/10 dark:bg-brand-slate-400/10 dark:text-brand-slate-400' :
                        'border-brand-slate-400 text-brand-slate-400 bg-brand-slate-400/10 dark:bg-brand-slate-400/10 dark:text-brand-slate-400'
                      }`}
                    >
                      {skin.rarity || 'Unknown'}
                    </Badge>
                    
                    {/* Wear Badge */}
                    <Badge variant="secondary" className="text-sm">
                      {skin.wear || 'Unknown'}
                    </Badge>
                    
                    {/* StatTrak Badge - nur wenn aktiv */}
                    {skin.isStattrak && (
                      <Badge variant="default" className="text-sm bg-orange-500 hover:bg-orange-600">
                        StatTrak™
                      </Badge>
                    )}
                    
                    {/* Star Badge */}
                    {skin.isStar && (
                      <Badge variant="outline" className="text-sm">
                        ★
                      </Badge>
                    )}
             </div>
           </div>

                {/* P1 - Price mit 24h/7d-Change */}
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {formatUSD(skin.marketPrice)}
             </div>
                  
                  {/* P2 - Price Deltas mit A11y Tooltips */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">24h:</span>
                      <div className="flex items-center gap-1">
                        {skin.priceMedian24h && skin.marketPrice ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  {skin.marketPrice > skin.priceMedian24h ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" aria-label="Price increased" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" aria-label="Price decreased" />
                                  )}
                                  <span 
                                    className={skin.marketPrice > skin.priceMedian24h ? "text-green-500" : "text-red-500"}
                                    aria-label={`Price change: ${((skin.marketPrice - skin.priceMedian24h) / skin.priceMedian24h * 100).toFixed(1)}%`}
                                  >
                                    {((skin.marketPrice - skin.priceMedian24h) / skin.priceMedian24h * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>24-hour price change from ${formatUSD(skin.priceMedian24h)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground" aria-label="No 24h data available">N/A</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">7d:</span>
                      <div className="flex items-center gap-1">
                        {skin.priceMedian7d && skin.marketPrice ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  {skin.marketPrice > skin.priceMedian7d ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" aria-label="Price increased" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" aria-label="Price decreased" />
                                  )}
                                  <span 
                                    className={skin.marketPrice > skin.priceMedian7d ? "text-green-500" : "text-red-500"}
                                    aria-label={`Price change: ${((skin.marketPrice - skin.priceMedian7d) / skin.priceMedian7d * 100).toFixed(1)}%`}
                                  >
                                    {((skin.marketPrice - skin.priceMedian7d) / skin.priceMedian7d * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>7-day price change from ${formatUSD(skin.priceMedian7d)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground" aria-label="No 7d data available">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* P1 - Quick Actions - immer sichtbar */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={addToWatchlist}
                    disabled={watchlistLoading || isInWatchlist}
                    variant={isInWatchlist ? "secondary" : "default"}
                    size="sm"
                    className="flex items-center gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                    aria-pressed={isInWatchlist}
                  >
                    {watchlistLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isInWatchlist ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                    {isInWatchlist ? "Added ✓" : "Add to Watchlist"}
                  </Button>

                  <Button
                    onClick={addToPortfolio}
                    disabled={portfolioLoading || isInPortfolio}
                    variant={isInPortfolio ? "secondary" : "outline"}
                    size="sm"
                    className="flex items-center gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={isInPortfolio ? "Remove from portfolio" : "Add to portfolio"}
                    aria-pressed={isInPortfolio}
                  >
                    {portfolioLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isInPortfolio ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isInPortfolio ? "Added ✓" : "Add to Portfolio"}
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label="Open skin on Steam Market in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Steam Market
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Skin not found</p>
            </div>
          )}
                </div>


        {/* P1 - Price History */}
        {/* Price History Chart with ToggleGroup and Tooltip */}
        <Card className="mb-12 border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-background to-accent/5 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {overlayMode ? "Price & Quantity Overlay" : "Price History"}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-semibold">{overlayMode ? "Overlay Chart" : "Price History Chart"}</p>
                        <p className="text-sm">{overlayMode ? "Combined price line and quantity bars" : "Historical price data from Steam Market"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Updated every few minutes</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <div className="flex items-center gap-4">
                {/* Overlay Mode Toggle */}
                <ToggleGroup 
                  type="single" 
                  value={overlayMode ? "overlay" : "separate"} 
                  onValueChange={(value) => setOverlayMode(value === "overlay")}
                  className="bg-muted/50 p-1 rounded-lg"
                >
                  <ToggleGroupItem value="separate" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Separate
                  </ToggleGroupItem>
                  <ToggleGroupItem value="overlay" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Overlay
                  </ToggleGroupItem>
                </ToggleGroup>

                <ToggleGroup 
                  type="single" 
                  value={chartRange} 
                  onValueChange={(value: Range) => value && setChartRange(value)}
                  className="bg-muted/50 p-1 rounded-lg"
                >
                  <ToggleGroupItem value="24h" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    24h
                  </ToggleGroupItem>
                  <ToggleGroupItem value="7d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    7d
                  </ToggleGroupItem>
                  <ToggleGroupItem value="30d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    30d
                  </ToggleGroupItem>
                  <ToggleGroupItem value="90d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    90d
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1y" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    1y
                  </ToggleGroupItem>
                  <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    All
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                <Select value={chartScale} onValueChange={setChartScale}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="log">Log</SelectItem>
                  </SelectContent>
                </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chart scale type</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Moving average smoothing</p>
                  </TooltipContent>
                </Tooltip>

                {/* P2 - Share/Export Dropdown */}
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportData('json')}>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                  </div>
                  </div>
                </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {overlayMode ? (
                <OverlayPriceQuantityChart
                  skinId={skin?.id || 0}
                  skinName={skin?.name || ""}
                  className="w-full h-full"
                />
              ) : (
                <SimplePriceChart
                  data={filteredHistory}
                  range={chartRange}
                  scale={chartScale}
                  movingAverage={movingAverage as "7" | "30" | "none"}
                  className="w-full h-full"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quantity History Section — only show in separate mode */}
        {!overlayMode && skin && (
          <QuantityBarChart
            skinId={skin.id}
            skinName={skin.name}
            className="mb-8"
          />
        )}

        {/* P1 - Market Statistics */}
        {/* Market Stats Card — price, orders, listings, volume */}
        {loadingEnhanced ? (
          <Skeleton className="h-32 w-full mb-12" />
        ) : marketStats ? (
          <div className="mb-12">
            <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-background to-accent/5 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Market Statistics
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="font-semibold">Live Market Data</p>
                            <p className="text-sm">Real-time statistics from Steam Market</p>
                            <p className="text-xs text-muted-foreground mt-1">Updated every few minutes</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Live Data</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Row */}
                  <div className="space-y-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-200 cursor-help group">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                                  <DollarSign className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-3xl font-bold text-primary group-hover:scale-105 transition-transform">
                                    {formatUSD(marketStats.medianPrice || 0)}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-medium">Median Price</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">Median Price</p>
                          <p className="text-sm">Median price over the last 30 days</p>
                          <p className="text-xs text-muted-foreground mt-1">Based on Steam Market data</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Card className="border border-green-500/20 bg-gradient-to-r from-green-500/5 to-green-500/10 hover:from-green-500/10 hover:to-green-500/15 transition-all duration-200 cursor-help group">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                                  <TrendingUp className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-3xl font-bold text-green-500 group-hover:scale-105 transition-transform">
                                    {marketStats.buyOrders || 0}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-medium">Buy Orders</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">Buy Orders</p>
                          <p className="text-sm">Current buy orders on the Steam Market</p>
                          <p className="text-xs text-muted-foreground mt-1">People waiting to buy at this price</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  </div>
                  
                  {/* Bottom Row */}
                  <div className="space-y-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Card className="border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-blue-500/10 hover:from-blue-500/10 hover:to-blue-500/15 transition-all duration-200 cursor-help group">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                                  <Users className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-3xl font-bold text-blue-500 group-hover:scale-105 transition-transform">
                                    {marketStats.activeListings || 0}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-medium">Active Listings</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">Active Listings</p>
                          <p className="text-sm">Currently active sell listings on Steam Market</p>
                          <p className="text-xs text-muted-foreground mt-1">Items available for purchase</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Card className="border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-orange-500/10 hover:from-orange-500/10 hover:to-orange-500/15 transition-all duration-200 cursor-help group">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                                  <Clock className="h-6 w-6 text-orange-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-3xl font-bold text-orange-500 group-hover:scale-105 transition-transform">
                                    {marketStats.volume24h || 0}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-medium">Volume 24h</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">Volume 24h</p>
                          <p className="text-sm">Items sold in the last 24 hours</p>
                          <p className="text-xs text-muted-foreground mt-1">Market activity indicator</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}


        {/* Contained in Case — shows the case of this skin + grid of all skins from that case */}
        {skin && <CaseSection skinId={skin.id} />}

        {/* P1 - Related Skins */}
        {/* Related Skins Grid with interactive Cards and Quick Actions */}
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Related Skins
            </h2>
            {loadingEnhanced ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : relatedSkins.length > 0 ? (
              <>
                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedSkins.map((relatedSkin) => (
                  <div key={relatedSkin.id} className="group relative">
                    <Link 
                      href={`/skins/${relatedSkin.id}`}
                          onClick={() => {
                        // P3 - Analytics: Track related skin click
                        if (skin) {
                          analytics.trackRelatedClick(skin.id, relatedSkin.id, relatedSkin.name);
                        }
                      }}
                    >
                      <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] border-2 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20">
                        <CardContent className="p-4">
                          <div className="aspect-square relative mb-3">
                            <SkinImage
                              src={relatedSkin.imageUrl || "/images/placeholder-skin.png"}
                              alt={relatedSkin.name}
                              fill
                              className="group-hover:scale-110 transition-transform duration-300"
                            />
                            {/* Quick Actions Overlay */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Add to watchlist logic
                                          console.log("Add to watchlist:", relatedSkin.id);
                                        }}
                                      >
                                        <Heart className="h-4 w-4" />
                                      </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>Add to Watchlist</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="secondary" 
                                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Add to portfolio logic
                                          console.log("Add to portfolio:", relatedSkin.id);
                                        }}
                                      >
                                        <BarChart3 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add to Portfolio</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
            </div>
                          </div>
                                </div>
                          
                          <h3 className="font-medium text-sm truncate mb-2 group-hover:text-primary transition-colors">
                            {relatedSkin.name}
                          </h3>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-primary font-bold text-lg">
                                {formatUSD(relatedSkin.priceAvg || relatedSkin.priceMedian || relatedSkin.priceLatest)}
                              </p>
                              <div className="flex gap-1">
                                {relatedSkin.isStattrak && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    ST
                                  </Badge>
                                )}
                                {relatedSkin.isStar && (
                                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                    ★
                                  </Badge>
            )}
          </div>
                        </div>
                            
                            {relatedSkin.wear && (
                <div className="flex items-center justify-between">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    relatedSkin.wear === 'Factory New' ? 'border-green-500 text-green-600' :
                                    relatedSkin.wear === 'Minimal Wear' ? 'border-blue-500 text-blue-600' :
                                    relatedSkin.wear === 'Field-Tested' ? 'border-yellow-500 text-yellow-600' :
                                    relatedSkin.wear === 'Well-Worn' ? 'border-orange-500 text-orange-600' :
                                    relatedSkin.wear === 'Battle-Scarred' ? 'border-red-500 text-red-600' :
                                    'border-gray-500 text-gray-600'
                                  }`}
                                >
                                  {relatedSkin.wear}
                                </Badge>
                                
                                {relatedSkin.rarity && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs font-semibold ${
                                      relatedSkin.rarity === 'Covert' ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300' :
                                      relatedSkin.rarity === 'Classified' ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-300' :
                                      relatedSkin.rarity === 'Restricted' ? 'border-pink-500 text-pink-600 bg-pink-50 dark:bg-pink-950 dark:text-pink-300' :
                                      relatedSkin.rarity === 'Mil-Spec' ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300' :
                                      relatedSkin.rarity === 'Industrial' ? 'border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950 dark:text-cyan-300' :
                                      relatedSkin.rarity === 'Consumer' ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-300' :
                                      'border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-300'
                                    }`}
                                  >
                                    {relatedSkin.rarity}
                                  </Badge>
                                    )}
                                  </div>
                                )}
                          </div>
                              </CardContent>
                            </Card>
            </Link>
          </div>
                ))}
              </div>
                
                {/* Mobile Carousel for Skins (Case + Related) */}
                <div className="md:hidden">
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 md:-ml-4">
                {relatedSkins.map((relatedSkin) => (
                        <CarouselItem key={relatedSkin.id} className="pl-2 md:pl-4 basis-1/2">
                          <div className="group relative">
                  <Link 
                    href={`/skins/${relatedSkin.id}`}
                    onClick={() => {
                      // P3 - Analytics: Track related skin click
                      if (skin) {
                        analytics.trackRelatedClick(skin.id, relatedSkin.id, relatedSkin.name);
                      }
                    }}
                  >
                              <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] border-2 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20">
                                <CardContent className="p-3">
                                  <div className="aspect-square relative mb-2">
                          <SkinImage
                            src={relatedSkin.imageUrl || "/images/placeholder-skin.png"}
                            alt={relatedSkin.name}
                            fill
                            className="group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                                  
                                  <h3 className="font-medium text-xs truncate mb-1 group-hover:text-primary transition-colors">
                                    {relatedSkin.name}
                                  </h3>
                                  
                                  <div className="space-y-1">
                        <div className="flex items-center justify-between">
                                      <p className="text-primary font-bold text-sm">
                                        {formatUSD(relatedSkin.priceAvg || relatedSkin.priceMedian || relatedSkin.priceLatest)}
                                      </p>
                          <div className="flex gap-1">
                            {relatedSkin.isStattrak && (
                                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                            ST
                                          </Badge>
                            )}
                            {relatedSkin.isStar && (
                                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                            ★
                                          </Badge>
                            )}
                          </div>
                        </div>
                                    
                        {relatedSkin.wear && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          relatedSkin.wear === 'Factory New' ? 'border-green-500 text-green-600' :
                                          relatedSkin.wear === 'Minimal Wear' ? 'border-blue-500 text-blue-600' :
                                          relatedSkin.wear === 'Field-Tested' ? 'border-yellow-500 text-yellow-600' :
                                          relatedSkin.wear === 'Well-Worn' ? 'border-orange-500 text-orange-600' :
                                          relatedSkin.wear === 'Battle-Scarred' ? 'border-red-500 text-red-600' :
                                          'border-gray-500 text-gray-600'
                                        }`}
                                      >
                                        {relatedSkin.wear}
                                      </Badge>
                                    )}
                                  </div>
                      </CardContent>
                    </Card>
                  </Link>
                          </div>
                        </CarouselItem>
                ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
              </div>
              </>
            ) : (
              <Card className="border-2 border-dashed border-muted-foreground/25 bg-gradient-to-br from-muted/5 to-muted/10">
                <CardContent className="text-center py-16">
                  <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                    <Heart className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Related Skins Found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We couldn't find any related skins for this item. Try exploring different weapon types or collections.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        {/* P1 - Skin Variants Table */}
        {/* Skin Variants - Same skins in different wear conditions */}
        {loadingEnhanced ? (
          <Skeleton className="h-64 w-full mb-12" />
        ) : variants && variants.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Skin Variants
            </h2>
            <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-background to-accent/5 shadow-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-accent/20">
                      <TableHead className="font-semibold text-primary">Wear Condition</TableHead>
                      <TableHead className="font-semibold text-primary">Price</TableHead>
                      <TableHead className="font-semibold text-primary">Change 24h</TableHead>
                      <TableHead className="font-semibold text-primary">Volume</TableHead>
                      <TableHead className="font-semibold text-primary">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant) => (
                      <TableRow key={variant.id} className="hover:bg-accent/5 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`font-semibold ${
                                variant.wear === 'Factory New' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' :
                                variant.wear === 'Minimal Wear' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                                variant.wear === 'Field-Tested' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                                variant.wear === 'Well-Worn' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                                variant.wear === 'Battle-Scarred' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' :
                                'border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
                              }`}
                            >
                              {variant.wear}
                            </Badge>
                            {variant.isStattrak && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                ST
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg text-primary">
                            {formatUSD(variant.priceAvg || variant.priceMedian || variant.priceLatest)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {variant.priceChange24h ? (
                            <div className="flex items-center gap-1">
                              {variant.priceChange24h > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={variant.priceChange24h > 0 ? "text-green-500" : "text-red-500"}>
                                {Math.abs(variant.priceChange24h).toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {variant.volume24h || variant.volume7d || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/skins/${variant.id}`, '_blank')}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => console.log("Add to watchlist:", variant.id)}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* P1 - Price Alerts & Watchlist */}
        {/* Price Alerts & Watchlist - Preisalarm sauber integrieren */}
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
                min="0"
                step="0.01"
              />
              <Button
                onClick={addPriceAlert}
                disabled={addingAlert || !alertPrice || alertPrice <= 0}
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
      </TooltipProvider>
    </div>
  );
}