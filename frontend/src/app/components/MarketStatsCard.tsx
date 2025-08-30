// /frontend/src/app/components/MarketStatsCard.tsx (Frontend)
"use client";

import { TrendingUp, TrendingDown, DollarSign, BarChart3, Clock, Package } from "lucide-react";

interface MarketStats {
  volume24h: number;
  volume7d: number;
  volume30d: number;
  currentPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  buyOrders: number;
  listings: number;
  lastUpdated: string;
}

interface MarketStatsCardProps {
  stats: MarketStats;
}

export default function MarketStatsCard({ stats }: MarketStatsCardProps) {
  const formatPrice = (price: number) => `$${price?.toFixed(2) || '0.00'}`;
  const formatVolume = (volume: number) => volume?.toLocaleString() || '0';
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const priceChange = stats.currentPrice && stats.medianPrice 
    ? ((stats.currentPrice - stats.medianPrice) / stats.medianPrice) * 100 
    : 0;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold">Market Statistics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volume Statistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">24h Volume</span>
            <span className="font-medium">{formatVolume(stats.volume24h)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">7d Volume</span>
            <span className="font-medium">{formatVolume(stats.volume7d)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">30d Volume</span>
            <span className="font-medium">{formatVolume(stats.volume30d)}</span>
          </div>
        </div>

        {/* Price Statistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Current Price</span>
            <span className="font-medium text-emerald-400">{formatPrice(stats.currentPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Median Price</span>
            <span className="font-medium">{formatPrice(stats.medianPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Price Change</span>
            <span className={`font-medium flex items-center gap-1 ${
              priceChange > 0 ? 'text-emerald-400' : priceChange < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {priceChange > 0 ? <TrendingUp className="w-4 h-4" /> : priceChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Min Price</div>
            <div className="font-medium text-red-400">{formatPrice(stats.minPrice)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Avg Price</div>
            <div className="font-medium">{formatPrice(stats.avgPrice)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Max Price</div>
            <div className="font-medium text-emerald-400">{formatPrice(stats.maxPrice)}</div>
          </div>
        </div>
      </div>

      {/* Market Activity */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">Buy Orders</div>
              <div className="font-medium">{stats.buyOrders}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-xs text-gray-400">Listings</div>
              <div className="font-medium">{stats.listings}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {stats.lastUpdated && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            Last updated: {formatDate(stats.lastUpdated)}
          </div>
        </div>
      )}
    </div>
  );
}
