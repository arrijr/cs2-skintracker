"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, TrendingUp, Calendar, Info, Settings } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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

// [COMPONENT] Historical Quantity (Listings) Bar Chart — shows daily active listings (and optional 24h volume)

interface QuantityData {
  date: string;
  activeListings: number;
  soldVolume24h: number | null;
  priceUsd: number | null;
}

interface QuantityBarChartProps {
  skinId: number;
  skinName: string;
  className?: string;
}

type Range = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

const QuantityBarChart: React.FC<QuantityBarChartProps> = ({ 
  skinId, 
  skinName, 
  className = "" 
}) => {
  const [data, setData] = useState<QuantityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('30d');
  const [showVolume, setShowVolume] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [aggregation, setAggregation] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [smoothing, setSmoothing] = useState<boolean>(false);
  const [showPriceOverlay, setShowPriceOverlay] = useState<boolean>(false);

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
          case 's':
            event.preventDefault();
            setSmoothing(!smoothing);
            break;
          case 'p':
            event.preventDefault();
            setShowPriceOverlay(!showPriceOverlay);
            break;
          case 'v':
            event.preventDefault();
            setShowVolume(!showVolume);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [smoothing, showPriceOverlay, showVolume]);

  // Debounced fetch function for performance
  const debouncedFetch = useCallback(
    debounce(async (skinId: number, range: string) => {
      try {
        setLoading(true);
        setError(null);
        
        // Debug: Hardcoded API URL for testing
        const apiBaseUrl = 'https://cs2-skintracker.onrender.com';
        const apiUrl = `${apiBaseUrl}/api/v1/skins/${skinId}/history/quantity?range=${range}`;
        console.log('[QuantityChart] Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
            // No data available - not an error, just empty state
            setData([]);
            setError(null);
            return;
          }
          throw new Error(`Failed to fetch quantity history: ${response.status}`);
        }
        
        const result = await response.json();
        const historyData = result.data || [];
        
        // Check if we have any data
        if (historyData.length === 0) {
          // Try fallback to 90d if current range is empty
          if (range !== '90d' && range !== 'all') {
            console.log(`[QuantityChart] No data for ${range}, trying 90d fallback`);
            const fallbackResponse = await fetch(
              `${apiBaseUrl}/api/v1/skins/${skinId}/history/quantity?range=90d`
            );
            if (fallbackResponse.ok) {
              const fallbackResult = await fallbackResponse.json();
              setData(fallbackResult.data || []);
              setLastUpdated(new Date().toLocaleTimeString());
              return;
            }
          }
        }
        
        console.log('[QuantityChart] Data received:', historyData);
        setData(historyData);
        setLastUpdated(new Date().toLocaleTimeString());
        
      } catch (err) {
        console.error('Error fetching quantity history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]);
      } finally {
        setLoading(false);
      }
    }, 300), // 300ms debounce
    []
  );

  // Fetch quantity history data
  useEffect(() => {
    if (skinId) {
      debouncedFetch(skinId, range);
    }
  }, [skinId, range, debouncedFetch]);

  // Calculate moving average for smoothing
  const calculateMovingAverage = (values: number[], window: number = 3) => {
    if (values.length < window) return values;
    
    const result = [];
    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        result.push(values[i]);
      } else {
        const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(Math.round(sum / window));
      }
    }
    return result;
  };

  // Calculate chart statistics
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const activeListings = data.map(d => d.activeListings);
    const volumes = data.map(d => d.soldVolume24h).filter(v => v !== null) as number[];
    const prices = data.map(d => d.priceUsd).filter(p => p !== null) as number[];

    // Apply smoothing if enabled
    const smoothedListings = smoothing ? calculateMovingAverage(activeListings, 3) : activeListings;
    const smoothedVolumes = smoothing && volumes.length > 0 ? calculateMovingAverage(volumes, 3) : volumes;

    return {
      maxListings: Math.max(...activeListings),
      minListings: Math.min(...activeListings),
      avgListings: Math.round(activeListings.reduce((a, b) => a + b, 0) / activeListings.length),
      maxVolume: volumes.length > 0 ? Math.max(...volumes) : 0,
      minVolume: volumes.length > 0 ? Math.min(...volumes) : 0,
      avgVolume: volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0,
      hasVolume: volumes.length > 0,
      hasPrice: prices.length > 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      smoothedListings,
      smoothedVolumes
    };
  }, [data, smoothing]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get bar height percentage
  const getBarHeight = (value: number, maxValue: number) => {
    if (maxValue === 0) return '0%';
    const percentage = (value / maxValue) * 100;
    const finalHeight = Math.max(percentage, 2); // Minimum 2% height
    return `${finalHeight}%`;
  };

  // Get bar color based on value and outliers
  const getBarColor = (value: number, maxValue: number, avgValue: number) => {
    const percentage = (value / maxValue) * 100;
    const isOutlier = value > avgValue * 1.5; // P95+ outlier detection
    
    // Base color scheme
    let baseColor = 'bg-primary/80'; // Default accent color
    if (percentage >= 80) baseColor = 'bg-green-500/80';
    else if (percentage >= 60) baseColor = 'bg-blue-500/80';
    else if (percentage >= 40) baseColor = 'bg-yellow-500/80';
    else if (percentage >= 20) baseColor = 'bg-orange-500/80';
    else baseColor = 'bg-red-500/80';
    
    // Darker for outliers
    return isOutlier ? baseColor.replace('/80', '') : baseColor;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quantity History
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
            Quantity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load quantity data</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Quantity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No quantity data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Come back tomorrow—fresh snapshots every 24h
            </p>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <Info className="h-3 w-3 inline mr-1" />
                Data freshness: Last snapshot collected daily at 00:00 UTC
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} role="region" aria-label="Quantity History Chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            Quantity History
          </CardTitle>
          
          {/* Quantity Range Toggle — 7D / 30D / 90D / 1Y / ALL / Custom */}
          <div className="flex flex-col gap-3">
            {/* Range and Aggregation - Mobile optimized */}
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
              <ToggleGroupItem value="custom" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                Custom
              </ToggleGroupItem>
            </ToggleGroup>

              {/* Aggregation Toggle */}
              <ToggleGroup 
                type="single" 
                value={aggregation} 
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => value && setAggregation(value)}
                className="bg-muted/50 p-1 rounded-lg flex-wrap justify-center sm:justify-start"
              >
                <ToggleGroupItem value="daily" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Daily
                </ToggleGroupItem>
                <ToggleGroupItem value="weekly" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Weekly
                </ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Monthly
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Custom Date Picker */}
            {range === 'custom' && (
              <div className="flex justify-center sm:justify-start">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          `${format(customDateRange.from, 'MMM dd')} - ${format(customDateRange.to, 'MMM dd')}`
                        ) : (
                          format(customDateRange.from, 'MMM dd')
                        )
                      ) : (
                        'Select dates'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">From</Label>
                        <CalendarComponent
                          mode="single"
                          selected={customDateRange.from}
                          onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                          disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">To</Label>
                        <CalendarComponent
                          mode="single"
                          selected={customDateRange.to}
                          onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                          disabled={(date) => 
                            date > new Date() || 
                            date < new Date('2020-01-01') ||
                            (customDateRange.from && date < customDateRange.from)
                          }
                        />
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          if (customDateRange.from && customDateRange.to) {
                            // Trigger data fetch with custom range
                            console.log('Custom range selected:', customDateRange);
                          }
                        }}
                        disabled={!customDateRange.from || !customDateRange.to}
                      >
                        Apply Range
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Data Type and Display Options - Mobile optimized */}
            <div className="flex flex-col sm:flex-row gap-3">
              {stats?.hasVolume && (
              <ToggleGroup 
                type="single" 
                value={showVolume ? "volume" : "listings"} 
                onValueChange={(value) => setShowVolume(value === "volume")}
                  className="bg-muted/50 p-1 rounded-lg flex-wrap justify-center sm:justify-start"
              >
                <ToggleGroupItem value="listings" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Listings
                </ToggleGroupItem>
                <ToggleGroupItem value="volume" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Volume
                </ToggleGroupItem>
              </ToggleGroup>
            )}

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

              {/* Price Overlay Toggle */}
              {stats?.hasPrice && (
                <ToggleGroup 
                  type="single" 
                  value={showPriceOverlay ? "overlay" : "single"} 
                  onValueChange={(value) => setShowPriceOverlay(value === "overlay")}
                  className="bg-muted/50 p-1 rounded-lg flex-wrap justify-center sm:justify-start"
                >
                  <ToggleGroupItem value="single" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Single
                  </ToggleGroupItem>
                  <ToggleGroupItem value="overlay" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    Price Overlay
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </div>
          </div>
        </div>

        {/* KPI Summary Bar */}
        {stats && (
          <div className="bg-muted/30 rounded-lg p-3 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg (30d)</p>
                <p className="text-lg font-semibold">{stats.avgListings.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Min (30d)</p>
                <p className="text-lg font-semibold text-red-600">{stats.minListings.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Max (30d)</p>
                <p className="text-lg font-semibold text-green-600">{stats.maxListings.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Δ7d</p>
                <p className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                  data.length >= 2 ? 
                    (data[data.length - 1].activeListings > data[data.length - 8]?.activeListings ? 'text-green-600' : 'text-red-600') :
                    'text-muted-foreground'
                }`}>
                  {data.length >= 2 ? (
                    <>
                      {data[data.length - 1].activeListings > data[data.length - 8]?.activeListings ? '↗' : '↘'}
                      {Math.abs(data[data.length - 1].activeListings - (data[data.length - 8]?.activeListings || 0))}
                    </>
                  ) : '—'}
                </p>
              </div>
            </div>
            
            {stats.hasVolume && showVolume && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-3 pt-3 border-t border-muted-foreground/20">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Vol</p>
                  <p className="text-lg font-semibold">{stats.avgVolume.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Min Vol</p>
                  <p className="text-lg font-semibold text-red-600">{stats.minVolume.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Max Vol</p>
                  <p className="text-lg font-semibold text-green-600">{stats.maxVolume.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Data Freshness</p>
                  <p className="text-sm text-muted-foreground">
                    {lastUpdated ? `Updated ${lastUpdated}` : 'Live'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Quantity Bar Chart — Active Listings per day */}
        <div className="space-y-4">
          {/* Chart Area */}
          <div className="relative">
            {/* Average line */}
            {stats && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-muted-foreground/50 z-10"
                style={{ 
                  bottom: `${100 - (stats.avgListings / (stats.maxListings || 1)) * 100}%` 
                }}
              >
                <div className="absolute -top-3 left-2 bg-background px-1 text-xs text-muted-foreground">
                  Avg: {stats.avgListings.toLocaleString()}
                </div>
              </div>
            )}
            
            <div className="h-64 flex items-end justify-between gap-1 px-2 relative">
              {data.length > 0 ? data.map((item, index) => {
                // Use smoothed values if smoothing is enabled
                const rawValue = showVolume ? (item.soldVolume24h || 0) : item.activeListings;
                const smoothedValue = smoothing ? 
                  (showVolume ? stats?.smoothedVolumes?.[index] || rawValue : stats?.smoothedListings?.[index] || rawValue) : 
                  rawValue;
                
                const value = smoothedValue;
                const maxValue = showVolume ? stats?.maxVolume || 1 : stats?.maxListings || 1;
                const avgValue = showVolume ? stats?.avgVolume || 1 : stats?.avgListings || 1;
                const height = getBarHeight(value, maxValue);
                const color = getBarColor(value, maxValue, avgValue);
                
                
                // Check if this is min/max value
                const isMax = value === (showVolume ? stats?.maxVolume : stats?.maxListings);
                const isMin = value === (showVolume ? stats?.minVolume : stats?.minListings);
                
                return (
                  <TooltipProvider key={item.date}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative flex flex-col items-center w-full h-full">
                          {/* Min/Max badges */}
                          {(isMax || isMin) && (
                            <div className={`absolute -top-6 text-xs font-bold px-1 py-0.5 rounded ${
                              isMax ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isMax ? 'MAX' : 'MIN'}
                            </div>
                          )}
                          
                          {/* Main bar */}
                          <div
                            className={`${color} rounded-t-sm transition-all duration-200 hover:opacity-80 cursor-pointer min-w-[8px] w-full`}
                            style={{ height: height }}
                          />
                          
                          {/* Price Overlay - small line at top */}
                          {showPriceOverlay && item.priceUsd && (
                            <div 
                              className="absolute w-full h-0.5 bg-yellow-400 opacity-80"
                              style={{ 
                                bottom: `${100 - (item.priceUsd / (stats?.maxPrice || 1)) * 100}%` 
                              }}
                            />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <p className="font-semibold">{formatDate(item.date)}</p>
                          <p className="text-sm">
                            {showVolume ? 'Volume 24h' : 'Active Listings'}: {value.toLocaleString()}
                            {smoothing && rawValue !== value && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (raw: {rawValue.toLocaleString()})
                              </span>
                            )}
                          </p>
                          {item.priceUsd && (
                            <p className="text-xs text-muted-foreground">
                              Price: ${item.priceUsd.toFixed(2)}
                            </p>
                          )}
                          {smoothing && (
                            <p className="text-xs text-blue-600">
                              3-Day Moving Average
                            </p>
                          )}
                          {isMax && <p className="text-xs text-green-600 font-semibold">Peak Value</p>}
                          {isMin && <p className="text-xs text-red-600 font-semibold">Lowest Value</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }) : (
                <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No data to display</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
              <span>{stats?.maxListings.toLocaleString()}</span>
              <span>{Math.round((stats?.maxListings || 0) * 0.5).toLocaleString()}</span>
              <span>0</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${smoothing ? 'bg-blue-500' : 'bg-primary'}`} />
                <span>
                  {showVolume ? '24h Volume' : 'Active Listings'}
                  {smoothing && ' (3D MA)'}
                </span>
              </div>
              {showPriceOverlay && stats?.hasPrice && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-yellow-400" />
                  <span>Price Overlay</span>
                </div>
              )}
              {stats?.hasVolume && !showPriceOverlay && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-sm" />
                  <span>Price (USD)</span>
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
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+S</kbd> Smoothing</p>
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+P</kbd> Price Overlay</p>
                      <p><kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+V</kbd> Volume</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs">
                <Info className="h-3 w-3" />
                Last updated: {lastUpdated}
              </div>
            )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuantityBarChart;
