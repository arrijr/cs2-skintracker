// /frontend/src/app/cases/[id]/page.tsx — [Frontend]
// {/* Case Detail Page - Comprehensive case information and analytics */}
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  AlertTriangle,
  Info,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatUSD, safeToFixed } from "@/lib/num";
import { AppShell } from "@/components/layout/AppShell";
import Breadcrumbs from "@/components/Breadcrumbs";
import CaseSupplyChart from "@/components/charts/CaseSupplyChart";
import CasePriceChart from "@/components/charts/CasePriceChart";

interface Case {
  id: number;
  name: string;
  imageUrl?: string;
  description?: string;
  releaseDate?: string;
  discontinuedDate?: string;
  isDiscontinued: boolean;
  price?: number;
  marketCap?: number;
  remaining?: number;
  dropped?: number;
  unboxed?: number;
  timeToExtinction?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  lastUpdated: string;
  // Real SteamWebAPI.com data
  steamData?: {
    offerVolume?: number;
    soldToday?: number;
    sold7d?: number;
    sold30d?: number;
    sold90d?: number;
    soldTotal?: number;
    priceLatest?: number;
    priceMedian?: number;
    priceChange24h?: number;
    priceChange7d?: number;
    priceChange30d?: number;
  };
  // Aggregated statistics from contained skins
  aggregatedStats?: {
    totalOfferVolume: number;
    totalSold7d: number;
    totalSold30d: number;
    totalSold90d: number;
    averageSold7d: number;
    averageSold30d: number;
    averageSold90d: number;
  };
  caseSkins: Array<{
    id: number;
    rarity: string;
    dropChance?: number;
    isSpecial: boolean;
    skin: {
      id: number;
      name: string;
      imageUrl?: string;
      rarity?: string;
      priceLatest?: number;
      priceMedian?: number;
      // Real SteamWebAPI.com data
      offerVolume?: number;
      soldToday?: number;
      sold7d?: number;
      sold30d?: number;
      sold90d?: number;
      soldTotal?: number;
    };
  }>;
  caseSupply: Array<{
    id: number;
    date: string;
    remaining: number;
    dropped: number;
    unboxed: number;
    price?: number;
    marketCap?: number;
  }>;
  casePriceHistory: Array<{
    id: number;
    date: string;
    price: number;
    marketCap?: number;
    remaining?: number;
  }>;
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceTimeRange, setPriceTimeRange] = useState<'30d' | '1y' | 'all'>('all');

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/v1/cases/${caseId}`);
        setCaseData(data);
      } catch (err) {
        setError('Failed to load case data');
        console.error('Error fetching case:', err);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };


  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'consumer':
        return 'bg-gray-500';
      case 'industrial':
        return 'bg-blue-500';
      case 'mil-spec':
        return 'bg-purple-500';
      case 'restricted':
        return 'bg-pink-500';
      case 'classified':
        return 'bg-red-500';
      case 'covert':
        return 'bg-orange-500';
      case 'exceedingly rare':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <AppShell eyebrow="Catalog" title="Case" description="Loading…" maxWidth="7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-800/40 border border-slate-700/30" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error || !caseData) {
    return (
      <AppShell eyebrow="Catalog" title="Case not found" maxWidth="7xl">
        <Card className="border-red-500/40 bg-red-500/5 rounded-2xl">
          <CardContent className="p-6 text-center">
            <div className="text-red-300 mb-2">Error loading case</div>
            <div className="text-slate-400">{error || 'Case not found'}</div>
            <Button asChild className="mt-4">
              <Link href="/cases">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cases
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Catalog"
      title={caseData.name}
      description="Case statistics and skin pool"
      maxWidth="7xl"
    >
      <div>
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Cases", href: "/cases" },
            { label: caseData.name }
          ]} 
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/cases">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
          
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
              {caseData.imageUrl ? (
                <img 
                  src={caseData.imageUrl} 
                  alt={caseData.name}
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <Package className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{caseData.name}</h1>
              {caseData.description && (
                <p className="text-lg text-gray-400 mb-4">{caseData.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {caseData.isDiscontinued ? (
                  <Badge variant="destructive">Discontinued</Badge>
                ) : (
                  <Badge variant="default">Active</Badge>
                )}
                {caseData.releaseDate && (
                  <Badge variant="outline">
                    Released: {new Date(caseData.releaseDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics - Real SteamWebAPI.com Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Price</p>
                  <p className="text-2xl font-bold text-white">
                    {caseData.steamData?.priceLatest ? formatUSD(caseData.steamData.priceLatest) : 
                     caseData.price ? formatUSD(caseData.price) : 'N/A'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              {(caseData.steamData?.priceChange24h ?? caseData.priceChange24h) !== undefined && (
                <div className={`flex items-center gap-1 mt-2 ${getPriceChangeColor(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0)}`}>
                  {getPriceChangeIcon(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0)}
                  <span className="text-sm">
                    {(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0) > 0 ? '+' : ''}{safeToFixed(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0, 2)}% (24h)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Available Listings</p>
                  <p className="text-2xl font-bold text-white">
                    {caseData.steamData?.offerVolume ? formatNumber(caseData.steamData.offerVolume) : 'N/A'}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Steam Market Listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Sold (7d)</p>
                  <p className="text-2xl font-bold text-white">
                    {caseData.steamData?.sold7d ? formatNumber(caseData.steamData.sold7d) : 'N/A'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Real Steam Sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Sold (30d)</p>
                  <p className="text-2xl font-bold text-white">
                    {caseData.steamData?.sold30d ? formatNumber(caseData.steamData.sold30d) : 'N/A'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Monthly Activity</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="supply">Sales History</TabsTrigger>
            <TabsTrigger value="prices">Price History</TabsTrigger>
            <TabsTrigger value="skins">Contained Skins</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real Market Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Market Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available Listings:</span>
                    <span className="font-medium">
                      {caseData.steamData?.offerVolume ? formatNumber(caseData.steamData.offerVolume) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sold Today:</span>
                    <span className="font-medium">
                      {caseData.steamData?.soldToday ? formatNumber(caseData.steamData.soldToday) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sold (7d):</span>
                    <span className="font-medium">
                      {caseData.steamData?.sold7d ? formatNumber(caseData.steamData.sold7d) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sold (30d):</span>
                    <span className="font-medium">
                      {caseData.steamData?.sold30d ? formatNumber(caseData.steamData.sold30d) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sold (90d):</span>
                    <span className="font-medium">
                      {caseData.steamData?.sold90d ? formatNumber(caseData.steamData.sold90d) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Sold:</span>
                    <span className="font-medium">
                      {caseData.steamData?.soldTotal ? formatNumber(caseData.steamData.soldTotal) : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Price Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Price Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="font-medium text-green-400">
                      {caseData.steamData?.priceLatest ? formatUSD(caseData.steamData.priceLatest) : 
                       caseData.price ? formatUSD(caseData.price) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Median Price:</span>
                    <span className="font-medium">
                      {caseData.steamData?.priceMedian ? formatUSD(caseData.steamData.priceMedian) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Change:</span>
                    <div className={`flex items-center gap-1 ${getPriceChangeColor(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0)}`}>
                      {getPriceChangeIcon(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0)}
                      <span className="font-medium">
                        {(caseData.steamData?.priceChange24h ?? caseData.priceChange24h) !== undefined 
                          ? `${(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0) > 0 ? '+' : ''}${safeToFixed(caseData.steamData?.priceChange24h ?? caseData.priceChange24h ?? 0, 2)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">7d Change:</span>
                    <div className={`flex items-center gap-1 ${getPriceChangeColor(caseData.steamData?.priceChange7d ?? caseData.priceChange7d ?? 0)}`}>
                      {getPriceChangeIcon(caseData.steamData?.priceChange7d ?? caseData.priceChange7d ?? 0)}
                      <span className="font-medium">
                        {(caseData.steamData?.priceChange7d ?? caseData.priceChange7d) !== undefined 
                          ? `${(caseData.steamData?.priceChange7d ?? caseData.priceChange7d ?? 0) > 0 ? '+' : ''}${safeToFixed(caseData.steamData?.priceChange7d ?? caseData.priceChange7d ?? 0, 2)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">30d Change:</span>
                    <div className={`flex items-center gap-1 ${getPriceChangeColor(caseData.steamData?.priceChange30d ?? caseData.priceChange30d ?? 0)}`}>
                      {getPriceChangeIcon(caseData.steamData?.priceChange30d ?? caseData.priceChange30d ?? 0)}
                      <span className="font-medium">
                        {(caseData.steamData?.priceChange30d ?? caseData.priceChange30d) !== undefined 
                          ? `${(caseData.steamData?.priceChange30d ?? caseData.priceChange30d ?? 0) > 0 ? '+' : ''}${safeToFixed(caseData.steamData?.priceChange30d ?? caseData.priceChange30d ?? 0, 2)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </TabsContent>

          <TabsContent value="supply" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <CaseSupplyChart data={caseData.caseSupply} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Price History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPriceTimeRange('30d')}
                      className={`px-3 py-1 rounded text-sm ${
                        priceTimeRange === '30d' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      30d
                    </button>
                    <button
                      onClick={() => setPriceTimeRange('1y')}
                      className={`px-3 py-1 rounded text-sm ${
                        priceTimeRange === '1y' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      1y
                    </button>
                    <button
                      onClick={() => setPriceTimeRange('all')}
                      className={`px-3 py-1 rounded text-sm ${
                        priceTimeRange === 'all' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>
                <CasePriceChart data={caseData.casePriceHistory} timeRange={priceTimeRange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contained Skins ({caseData.caseSkins.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.caseSkins.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {caseData.caseSkins.map((caseSkin) => (
                      <Link 
                        key={caseSkin.id} 
                        href={`/skins/${caseSkin.skin.id}`}
                        className="block p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                            {caseSkin.skin.imageUrl ? (
                              <img 
                                src={caseSkin.skin.imageUrl} 
                                alt={caseSkin.skin.name}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{caseSkin.skin.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                className={`text-xs ${getRarityColor(caseSkin.rarity)}`}
                              >
                                {caseSkin.rarity}
                              </Badge>
                              {caseSkin.isSpecial && (
                                <Badge variant="outline" className="text-xs">
                                  Special
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                {caseSkin.skin.priceLatest && (
                                  <p className="text-sm text-green-400 font-medium">
                                    {formatUSD(caseSkin.skin.priceLatest)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                {caseSkin.skin.offerVolume && (
                                  <p className="text-xs text-blue-400">
                                    {formatNumber(caseSkin.skin.offerVolume)} listings
                                  </p>
                                )}
                                {caseSkin.skin.sold7d && (
                                  <p className="text-xs text-purple-400">
                                    {formatNumber(caseSkin.skin.sold7d)} sold (7d)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Skins Data</h3>
                    <p className="text-gray-400">
                      Skin information for this case is not available yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}