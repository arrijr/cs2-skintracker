// frontend/src/components/OverlayPriceQuantityChart.tsx — [Frontend]
// {/* Overlay Price + Quantity Chart with dual Y-axes */}
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Info, 
  Settings, 
  HelpCircle,
  Download,
  Copy,
  Share2,
  LineChart,
  BarChart,
  Scale,
  Activity
} from "lucide-react";
import { apiFetch } from "@/lib/http";
import { apiUrl } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { formatUSD, safeToFixed, numberOrNull } from "@/lib/num";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface PriceData {
  date: string;
  price: number;
}

interface QuantityData {
  date: string;
  activeListings: number;
  soldVolume24h: number | null;
  priceUsd: number | null;
}

interface OverlayData {
  date: string;
  price: number | null;
  activeListings: number | null;
  priceDelta?: number | null;
  listingsDelta?: number | null;
}

interface OverlayPriceQuantityChartProps {
  skinId: number;
  skinName: string;
  className?: string;
}

type Range = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

const OverlayPriceQuantityChart: React.FC<OverlayPriceQuantityChartProps> = ({ 
  skinId, 
  skinName, 
  className = "" 
}) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [quantityData, setQuantityData] = useState<QuantityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('30d');
  const [showPrice, setShowPrice] = useState(true);
  const [showListings, setShowListings] = useState(true);
  const [scale, setScale] = useState<'linear' | 'log'>('linear');
  const [smoothing, setSmoothing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setRange('7d');
            break;
          case '2':
            event.preventDefault();
            setRange('30d');
            break;
          case '3':
            event.preventDefault();
            setRange('90d');
            break;
          case '4':
            event.preventDefault();
            setRange('1y');
            break;
          case '5':
            event.preventDefault();
            setRange('all');
            break;
          case 'p':
            event.preventDefault();
            setShowPrice(!showPrice);
            break;
          case 'l':
            event.preventDefault();
            setShowListings(!showListings);
            break;
          case 's':
            event.preventDefault();
            setSmoothing(!smoothing);
            break;
          case 'o':
            event.preventDefault();
            setScale(scale === 'linear' ? 'log' : 'linear');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPrice, showListings, smoothing, scale]);

  // Debounced fetch function for performance
  const debouncedFetch = useCallback(
    debounce(async (skinId: number, range: string) => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both price and quantity data in parallel using apiFetch helper
        const [priceResponse, quantityResponse] = await Promise.all([
          apiFetch(apiUrl(`/api/v1/skins/${skinId}/history/price?range=${range}`)),
          apiFetch(apiUrl(`/api/v1/skins/${skinId}/history/quantity?range=${range}`))
        ]);
        
        const priceResult = await priceResponse.json();
        const quantityResult = await quantityResponse.json();
        
        setPriceData(priceResult.data || []);
        setQuantityData(quantityResult.data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        
      } catch (err) {
        console.error('Error fetching overlay data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setPriceData([]);
        setQuantityData([]);
      } finally {
        setLoading(false);
      }
    }, 250), // 250ms debounce
    []
  );

  // Fetch data
  useEffect(() => {
    if (skinId) {
      debouncedFetch(skinId, range);
    }
  }, [skinId, range, debouncedFetch]);

  // Merge and process data
  const overlayData = useMemo(() => {
    const dataMap = new Map<string, OverlayData>();
    
    // Add price data
    priceData.forEach(item => {
      dataMap.set(item.date, {
        date: item.date,
        price: item.price,
        activeListings: null,
        priceDelta: null,
        listingsDelta: null
      });
    });
    
    // Add quantity data
    quantityData.forEach(item => {
      const existing = dataMap.get(item.date);
      if (existing) {
        existing.activeListings = item.activeListings;
      } else {
        dataMap.set(item.date, {
          date: item.date,
          price: null,
          activeListings: item.activeListings,
          priceDelta: null,
          listingsDelta: null
        });
      }
    });
    
    // Calculate deltas
    const sortedData = Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sortedData.map((item, index) => {
      const prevItem = index > 0 ? sortedData[index - 1] : null;
      
      return {
        ...item,
        priceDelta: prevItem?.price ? 
          ((item.price || 0) - prevItem.price) / prevItem.price * 100 : null,
        listingsDelta: prevItem?.activeListings ? 
          ((item.activeListings || 0) - prevItem.activeListings) / prevItem.activeListings * 100 : null
      };
    });
  }, [priceData, quantityData]);

  // Calculate moving average for smoothing
  const calculateMovingAverage = (values: (number | null)[], window: number = 3) => {
    if (values.length < window) return values;
    
    const result: (number | null)[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        result.push(values[i]);
      } else {
        const windowValues = values.slice(i - window + 1, i + 1).filter(v => v !== null) as number[];
        if (windowValues.length > 0) {
          const sum = windowValues.reduce((a, b) => a + b, 0);
          result.push(Math.round(sum / windowValues.length));
        } else {
          result.push(values[i]);
        }
      }
    }
    return result;
  };

  // Apply smoothing to listings data
  const smoothedData = useMemo(() => {
    if (!smoothing) return overlayData;
    
    const listingsValues = overlayData.map(d => d.activeListings);
    const smoothedListings = calculateMovingAverage(listingsValues, 3);
    
    return overlayData.map((item, index) => ({
      ...item,
      activeListings: smoothedListings[index]
    }));
  }, [overlayData, smoothing]);

  // Calculate statistics
  const stats = useMemo(() => {
    const prices = overlayData.map(d => d.price).filter(p => p !== null) as number[];
    const listings = overlayData.map(d => d.activeListings).filter(l => l !== null) as number[];
    
    return {
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      maxListings: listings.length > 0 ? Math.max(...listings) : 0,
      minListings: listings.length > 0 ? Math.min(...listings) : 0,
      avgListings: listings.length > 0 ? listings.reduce((a, b) => a + b, 0) / listings.length : 0,
      hasPrice: prices.length > 0,
      hasListings: listings.length > 0
    };
  }, [overlayData]);

  // Export functions
  const exportCSV = useCallback(() => {
    const csvContent = [
      'date,price_usd,active_listings',
      ...smoothedData.map(item => 
        `${item.date},${item.price || ''},${item.activeListings || ''}`
      ).join('\n')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skinName.replace(/[^a-zA-Z0-9]/g, '_')}_overlay_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [smoothedData, skinName, range]);

  const exportJSON = useCallback(() => {
    const jsonContent = JSON.stringify(smoothedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skinName.replace(/[^a-zA-Z0-9]/g, '_')}_overlay_${range}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [smoothedData, skinName, range]);

  const copyLink = useCallback(() => {
    const params = new URLSearchParams({
      range,
      scale,
      overlay: 'true',
      price: showPrice.toString(),
      listings: showListings.toString(),
      smooth: smoothing.toString()
    });
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    // You might want to show a toast here
  }, [range, scale, showPrice, showListings, smoothing]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get bar height percentage
  const getBarHeight = (value: number | null, maxValue: number) => {
    if (!value || maxValue === 0) return '0%';
    const percentage = (value / maxValue) * 100;
    const finalHeight = Math.max(percentage, 2); // Minimum 2% height
    return `${finalHeight}%`;
  };

  // Get line position percentage (from bottom)
  const getLinePosition = (value: number | null, maxValue: number) => {
    if (!value || maxValue === 0) return '0%';
    const percentage = (value / maxValue) * 100;
    return `${Math.max(percentage, 2)}%`; // Minimum 2% from bottom
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Price & Quantity Overlay
            </CardTitle>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Price & Quantity Overlay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load overlay data</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (overlayData.length === 0) {
    return (
      <Card className={`${className} border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-background to-accent/5 shadow-xl`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Price & Quantity Overlay
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-semibold">Overlay Chart</p>
                    <p className="text-sm">Combined price line and quantity bars</p>
                    <p className="text-xs text-muted-foreground mt-1">Updated daily at 00:00 UTC</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No overlay data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Come back tomorrow—fresh snapshots every 24h
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-background to-accent/5 shadow-xl`} role="region" aria-label="Price & Quantity Overlay Chart">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            Price & Quantity Overlay
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-semibold">Overlay Chart</p>
                    <p className="text-sm">Combined price line and quantity bars</p>
                    <p className="text-xs text-muted-foreground mt-1">Updated daily at 00:00 UTC</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-1" />
              Link
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 mt-4">
          {/* Range Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <ToggleGroup 
              type="single" 
              value={range} 
              onValueChange={(value: Range) => value && setRange(value)}
              className="bg-muted/50 p-1 rounded-lg flex-wrap justify-center sm:justify-start"
            >
              <ToggleGroupItem value="7d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                7D
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                30D
              </ToggleGroupItem>
              <ToggleGroupItem value="90d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                90D
              </ToggleGroupItem>
              <ToggleGroupItem value="1y" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                1Y
              </ToggleGroupItem>
              <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                ALL
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Display Options */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Series Toggles */}
            <ToggleGroup 
              type="multiple" 
              value={[
                ...(showPrice ? ['price'] : []),
                ...(showListings ? ['listings'] : [])
              ]}
              onValueChange={(values) => {
                setShowPrice(values.includes('price'));
                setShowListings(values.includes('listings'));
              }}
              className="bg-muted/50 p-1 rounded-lg flex-wrap justify-center sm:justify-start"
            >
              <ToggleGroupItem value="price" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <LineChart className="h-4 w-4 mr-1" />
                Price
              </ToggleGroupItem>
              <ToggleGroupItem value="listings" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <BarChart className="h-4 w-4 mr-1" />
                Listings
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Scale Toggle */}
            <ToggleGroup 
              type="single" 
              value={scale} 
              onValueChange={(value: 'linear' | 'log') => value && setScale(value)}
              className="bg-muted/50 p-1 rounded-lg flex-wrap justify-center sm:justify-start"
            >
              <ToggleGroupItem value="linear" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Scale className="h-4 w-4 mr-1" />
                Linear
              </ToggleGroupItem>
              <ToggleGroupItem value="log" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Activity className="h-4 w-4 mr-1" />
                Log
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Smoothing Toggle */}
            <ToggleGroup 
              type="single" 
              value={smoothing ? "smooth" : "raw"} 
              onValueChange={(value) => setSmoothing(value === "smooth")}
              className="bg-muted/50 p-1 rounded-lg flex-wrap justify-center sm:justify-start"
            >
              <ToggleGroupItem value="raw" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Raw
              </ToggleGroupItem>
              <ToggleGroupItem value="smooth" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                3D MA
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* KPI Summary Bar */}
        {stats && (stats.hasPrice || stats.hasListings) && (
          <div className="bg-muted/30 rounded-lg p-3 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {stats.hasPrice && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Avg Price</p>
                    <p className="text-lg font-semibold">{formatUSD(stats.avgPrice)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Price Range</p>
                    <p className="text-sm font-semibold">
                      {formatUSD(stats.minPrice)} - {formatUSD(stats.maxPrice)}
                    </p>
                  </div>
                </>
              )}
              {stats.hasListings && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Avg Listings</p>
                    <p className="text-lg font-semibold">{Math.round(stats.avgListings).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Listings Range</p>
                    <p className="text-sm font-semibold">
                      {stats.minListings.toLocaleString()} - {stats.maxListings.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {lastUpdated && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                <Info className="h-3 w-3" />
                Last updated: {lastUpdated}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Overlay Chart */}
        <div className="space-y-4">
          <div className="relative h-96">
            {/* Y-axis labels for price (left) */}
            {showPrice && stats.hasPrice && (
              <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
                <span>{formatUSD(stats.maxPrice)}</span>
                <span>{formatUSD(stats.avgPrice)}</span>
                <span>{formatUSD(stats.minPrice)}</span>
              </div>
            )}
            
            {/* Y-axis labels for listings (right) */}
            {showListings && stats.hasListings && (
              <div className="absolute -right-8 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
                <span>{stats.maxListings.toLocaleString()}</span>
                <span>{Math.round(stats.avgListings).toLocaleString()}</span>
                <span>{stats.minListings.toLocaleString()}</span>
              </div>
            )}
            
            {/* Chart Area */}
            <div className="h-full flex items-end justify-between gap-1 px-2 relative">
              {smoothedData.map((item, index) => (
                <TooltipProvider key={item.date}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative flex flex-col items-center w-full h-full justify-end group">
                        {/* Listings Bar (background) */}
                        {showListings && item.activeListings && (
                          <div
                            className="bg-accent/60 rounded-t-sm transition-all duration-200 hover:opacity-80 cursor-pointer min-w-[8px] w-full"
                            style={{ 
                              height: getBarHeight(item.activeListings, stats.maxListings)
                            }}
                          />
                        )}
                        
                        {/* Price Line (overlay on top) */}
                        {showPrice && item.price && (
                          <div
                            className="absolute w-full h-0.5 bg-primary rounded-full z-10"
                            style={{ 
                              bottom: getLinePosition(item.price, stats.maxPrice)
                            }}
                          />
                        )}
                        
                        {/* Price Dot (for better visibility) */}
                        {showPrice && item.price && (
                          <div
                            className="absolute w-2 h-2 bg-primary rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ 
                              bottom: `calc(${getLinePosition(item.price, stats.maxPrice)} - 4px)`,
                              left: '50%',
                              transform: 'translateX(-50%)'
                            }}
                          />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-semibold">{formatDate(item.date)}</p>
                        {item.price && (
                          <p className="text-sm">
                            Price: <span className="font-bold text-primary">{formatUSD(item.price)}</span>
                            {item.priceDelta && (
                              <span className={`ml-2 text-xs ${item.priceDelta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {item.priceDelta > 0 ? '↗' : '↘'} {Math.abs(item.priceDelta).toFixed(1)}%
                              </span>
                            )}
                          </p>
                        )}
                        {item.activeListings && (
                          <p className="text-sm">
                            Listings: <span className="font-bold text-accent">{item.activeListings.toLocaleString()}</span>
                            {item.listingsDelta && (
                              <span className={`ml-2 text-xs ${item.listingsDelta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {item.listingsDelta > 0 ? '↗' : '↘'} {Math.abs(item.listingsDelta).toFixed(1)}%
                              </span>
                            )}
                          </p>
                        )}
                        {smoothing && (
                          <p className="text-xs text-blue-600">
                            3-Day Moving Average
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
              {smoothedData.map((item, index) => (
                <div key={item.date} className="text-center">
                  <div className="text-xs opacity-70">
                    {format(new Date(item.date), 'MMM dd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {showPrice && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-primary" />
                  <span>Price (USD)</span>
                </div>
              )}
              {showListings && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent/80 rounded-sm" />
                  <span>Active Listings</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {smoothing && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <TrendingUp className="h-3 w-3" />
                  Smoothed
                </div>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                      <Info className="h-3 w-3" />
                      Shortcuts
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+1-5</kbd> Range</p>
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+P</kbd> Price</p>
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+L</kbd> Listings</p>
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+S</kbd> Smoothing</p>
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+O</kbd> Scale</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverlayPriceQuantityChart;
