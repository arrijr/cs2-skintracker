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
  marketStats?: {
    medianPrice?: number;
    volume24h?: number;
    priceChange24h?: number;
    priceChangePercent24h?: number;
  };
  caseInfo?: {
    name: string;
    id: number;
  };
  variants?: Array<{
    id: number;
    name: string;
    marketPrice?: number;
    imageUrl?: string;
  }>;
  history?: Array<{
    date: string;
    price: number;
    quantity: number;
  }>;
};

export default function SkinDetailPage({ params }: { params: { skinId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const analytics = useAnalytics();

  const [skin, setSkin] = useState<Skin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<number[]>([]);
  const [priceAlert, setPriceAlert] = useState({ enabled: false, targetPrice: 0 });
  const [chartType, setChartType] = useState<'price' | 'quantity' | 'overlay'>('price');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showPriceHistory, setShowPriceHistory] = useState(true);
  const [showQuantityHistory, setShowQuantityHistory] = useState(true);
  const [showOverlayChart, setShowOverlayChart] = useState(false);

  // Load skin data
  useEffect(() => {
    const loadSkin = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchJson(apiUrl(`/skins/${params.skinId}`));
        if (response.success) {
          setSkin(response.data);
        } else if (response.id) {
          // Fallback for old API format
          setSkin(response);
        } else {
          setError(response.error || 'Skin not found');
        }
      } catch (err: any) {
        console.error('Error loading skin:', err);
        if (err.message?.includes('404')) {
          setError('Skin not found. Please check the URL or try a different skin.');
        } else {
          setError('Failed to load skin data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.skinId) {
      loadSkin();
    }
  }, [params.skinId]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken({ template: "backend" });
        const [watchlistData, portfolioData] = await Promise.all([
          getWatchlist(token),
          getPortfolio(token)
        ]);

        if (watchlistData.success) {
          setWatchlist(watchlistData.data.map((item: any) => item.skinId));
        }

        if (portfolioData.success) {
          setPortfolioSkins(portfolioData.data.map((item: any) => item.skinId));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    loadUserData();
  }, [isSignedIn]);

  // Analytics tracking
  useEffect(() => {
    if (skin && analytics) {
      try {
        analytics.trackPageView('skin-detail', {
          skinId: skin.id,
          skinName: skin.name,
          marketPrice: skin.marketPrice
        });
      } catch (err) {
        console.error('Analytics error:', err);
      }
    }
  }, [skin, analytics]);

  // Computed values
  const skinImageUrl = useMemo(() => {
    if (!skin) return '/images/placeholder-skin.png';
    return skin.imageUrl || skin.image_url || skin.itemImage || skin.itemimage || '/images/placeholder-skin.png';
  }, [skin]);

  const isInWatchlist = useMemo(() => {
    return skin ? watchlist.includes(skin.id) : false;
  }, [skin, watchlist]);

  const isInPortfolio = useMemo(() => {
    return skin ? portfolioSkins.includes(skin.id) : false;
  }, [skin, portfolioSkins]);

  const marketStats = skin?.marketStats || {};
  const caseInfo = skin?.caseInfo;
  const variants = skin?.variants || [];
  const history = skin?.history || [];

  // Event handlers
  const handleAddToWatchlist = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ skinId: skin.id })
      });

      if (response.success) {
        setWatchlist(prev => [...prev, skin.id]);
        toast.success('Added to watchlist');
        
        if (analytics) {
          try {
            analytics.trackWatchlistAdd(skin.id, skin.name);
          } catch (err) {
            console.error('Analytics error:', err);
          }
        }
      } else {
        toast.error(response.error || 'Failed to add to watchlist');
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      toast.error('Failed to add to watchlist');
    }
  }, [skin, isSignedIn, analytics]);

  const handleRemoveFromWatchlist = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson(apiUrl(`/watchlist/${skin.id}`), {
        method: 'DELETE'
      });

      if (response.success) {
        setWatchlist(prev => prev.filter(id => id !== skin.id));
        toast.success('Removed from watchlist');
      } else {
        toast.error(response.error || 'Failed to remove from watchlist');
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      toast.error('Failed to remove from watchlist');
    }
  }, [skin, isSignedIn]);

  const handleAddToPortfolio = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({ skinId: skin.id })
      });

      if (response.success) {
        setPortfolioSkins(prev => [...prev, skin.id]);
        toast.success('Added to portfolio');
        
        if (analytics) {
          try {
            analytics.trackPortfolioAdd(skin.id, skin.name);
          } catch (err) {
            console.error('Analytics error:', err);
          }
        }
      } else {
        toast.error(response.error || 'Failed to add to portfolio');
      }
    } catch (err) {
      console.error('Error adding to portfolio:', err);
      toast.error('Failed to add to portfolio');
    }
  }, [skin, isSignedIn, analytics]);

  const handleRemoveFromPortfolio = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson(apiUrl(`/portfolio/${skin.id}`), {
        method: 'DELETE'
      });

      if (response.success) {
        setPortfolioSkins(prev => prev.filter(id => id !== skin.id));
        toast.success('Removed from portfolio');
      } else {
        toast.error(response.error || 'Failed to remove from portfolio');
      }
    } catch (err) {
      console.error('Error removing from portfolio:', err);
      toast.error('Failed to remove from portfolio');
    }
  }, [skin, isSignedIn]);

  const handleCreatePriceAlert = useCallback(async () => {
    if (!skin || !isSignedIn || !priceAlert.enabled) return;

    try {
      const response = await fetchJson('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          skinId: skin.id,
          targetPrice: priceAlert.targetPrice,
          type: 'price_alert'
        })
      });

      if (response.success) {
        toast.success('Price alert created');
        
        if (analytics) {
          try {
            analytics.trackAlertCreate(skin.id, skin.name, priceAlert.targetPrice);
          } catch (err) {
            console.error('Analytics error:', err);
          }
        }
      } else {
        toast.error(response.error || 'Failed to create price alert');
      }
    } catch (err) {
      console.error('Error creating price alert:', err);
      toast.error('Failed to create price alert');
    }
  }, [skin, isSignedIn, priceAlert, analytics]);

  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
      
      if (analytics) {
        try {
          analytics.trackCopyLink(skin?.id, skin?.name);
        } catch (err) {
          console.error('Analytics error:', err);
        }
      }
    }
  }, [skin, analytics]);

  const handleRelatedSkinClick = useCallback((relatedSkin: any) => {
    if (analytics) {
      try {
        analytics.trackRelatedClick(relatedSkin.id, relatedSkin.name);
      } catch (err) {
        console.error('Analytics error:', err);
      }
    }
    router.push(`/skins/${relatedSkin.id}`);
  }, [router, analytics]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
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
      </div>
    );
  }

  if (error || !skin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Skin not found</h1>
          <p className="text-muted-foreground mb-4">{error || 'The requested skin could not be found.'}</p>
          <Button onClick={() => router.push('/skins')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Skins
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Button>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Skin Image - größer und im Fokus */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <div className="relative w-80 h-80 mx-auto lg:mx-0 bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-8 shadow-2xl">
              {skinImageUrl && skinImageUrl !== "/images/placeholder-skin.png" ? (
                <SkinImage
                  src={skinImageUrl}
                  alt={skin.name}
                  fill
                  priority
                  quality={90}
                  className="object-contain p-4"
                />
              ) : (
                <Image
                  src={skinImageUrl}
                  alt={skin.name}
                  fill
                  className="object-contain p-4"
                  priority
                  quality={90}
                />
              )}
            </div>
          </div>
       
          {/* Skin Info - rechts vom Bild */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div>
              {/* Breadcrumb navigation: Cases > Case > Skin */}
              <Breadcrumb className="mb-6">
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
                        <BreadcrumbLink href={`/cases/${encodeURIComponent(caseInfo?.name || '')}`}>
                          {caseInfo?.name || 'Unknown Case'}
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
              
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight">{skin.name}</h1>
                <p className="text-lg text-muted-foreground">{skin.marketHashName}</p>
                
                {/* Price Display */}
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">
                    {skin.marketPrice ? formatUSD(skin.marketPrice) : 'N/A'}
                  </span>
                  {marketStats.priceChangePercent24h && (
                    <Badge 
                      variant={marketStats.priceChangePercent24h >= 0 ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {marketStats.priceChangePercent24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {safeToFixed(marketStats.priceChangePercent24h, 2)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {isSignedIn ? (
                <>
                  {isInWatchlist ? (
                    <Button
                      variant="outline"
                      onClick={handleRemoveFromWatchlist}
                      className="flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      Remove from Watchlist
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddToWatchlist}
                      className="flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      Add to Watchlist
                    </Button>
                  )}
                  
                  {isInPortfolio ? (
                    <Button
                      variant="outline"
                      onClick={handleRemoveFromPortfolio}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Remove from Portfolio
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddToPortfolio}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add to Portfolio
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => router.push('/sign-in')}
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Sign in to track
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open(`https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName || skin.name)}`, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View on Steam Market
              </Button>
            </div>
          </div>
        </div>

        {/* Market Statistics - 3-Spalten-Grid */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Market Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-border bg-card shadow-sm hover:shadow-2xl rounded-xl">
                <div className="text-2xl font-bold text-primary">
                  {marketStats.medianPrice ? formatUSD(marketStats.medianPrice) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Median Price</div>
              </div>
              
              <div className="text-center p-6 border border-border bg-card shadow-sm hover:shadow-2xl rounded-xl">
                <div className="text-2xl font-bold text-primary">
                  {marketStats.priceChange24h ? formatUSD(marketStats.priceChange24h) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">24h Change</div>
              </div>
              
              <div className="text-center p-6 border border-border bg-card shadow-sm hover:shadow-2xl rounded-xl">
                <div className="text-2xl font-bold text-primary">
                  {marketStats.volume24h ? marketStats.volume24h.toLocaleString() : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Volume 24h</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price History Chart */}
        <Card className="mb-12 border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Price History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <SimplePriceChart 
                data={history} 
                range={timeRange}
                scale="linear"
                movingAverage="7"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No price history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantity History Chart */}
        <Card className="mb-12 border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quantity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <QuantityBarChart 
                skinId={skin.id} 
                skinName={skin.name}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No quantity history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Skins */}
        {variants.length > 0 && (
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Related Skins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {variants.map((variant) => (
                  <Card
                    key={variant.id}
                    className="border-2 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20 group-hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                    onClick={() => handleRelatedSkinClick(variant)}
                  >
                    <CardContent className="p-6">
                      <div className="aspect-square relative mb-4 rounded-lg overflow-hidden">
                        {variant.imageUrl ? (
                          <Image
                            src={variant.imageUrl}
                            alt={variant.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2">{variant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {variant.marketPrice ? formatUSD(variant.marketPrice) : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Case Information */}
        {caseInfo && (
          <CaseSection caseName={caseInfo.name} />
        )}
      </div>
    </TooltipProvider>
  );
}
