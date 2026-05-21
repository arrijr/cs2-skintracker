'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface PriceDataPoint {
  date: string;
  price: number;
  movingAverage7d?: number;
}

interface SkinPriceHistoryChartProps {
  skinId: number;
  skinName: string;
  days?: 7 | 30 | 90;
  onPriceChange?: (data: { min: number; max: number; avg: number }) => void;
}

export default function SkinPriceHistoryChart({
  skinId,
  skinName,
  days = 30,
  onPriceChange
}: SkinPriceHistoryChartProps) {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, trend: 0 });

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/skins/${skinId}/price-history?days=${days}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const result = await res.json();
        setData(result.data || []);

        // Calculate stats
        if (result.data && result.data.length > 0) {
          const prices = result.data.map((d: PriceDataPoint) => d.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
          const trend = result.data.length > 1
            ? result.data[result.data.length - 1].price - result.data[0].price
            : 0;

          setStats({ min, max, avg, trend });
          onPriceChange?.({ min, max, avg });
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch price history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load price history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [skinId, days, onPriceChange]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{skinName}</CardTitle>
          <CardDescription>Preisgeschichte ({days} Tage)</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-64" />
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{skinName}</CardTitle>
          <CardDescription>Preisgeschichte ({days} Tage)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-gray-500">
          {error || 'Keine Preisdaten verfügbar'}
        </CardContent>
      </Card>
    );
  }

  const isTrendingUp = stats.trend >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{skinName}</CardTitle>
            <CardDescription>Preisgeschichte ({days} Tage)</CardDescription>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 ${isTrendingUp ? 'text-green-600' : 'text-red-600'}`}>
              {isTrendingUp ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-semibold">{stats.trend.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Minimum</p>
            <p className="font-semibold">{stats.min.toFixed(2)}€</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Durchschnitt</p>
            <p className="font-semibold">{stats.avg.toFixed(2)}€</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Maximum</p>
            <p className="font-semibold">{stats.max.toFixed(2)}€</p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#888"
              style={{ fontSize: '12px' }}
              tick={{ fontSize: 12 }}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis
              stroke="#888"
              style={{ fontSize: '12px' }}
              label={{ value: 'Preis (€)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}€`}
              labelFormatter={(label) => `${label}`}
              contentStyle={{ backgroundColor: 'rgb(15 23 42 / 0.95)', border: '1px solid rgb(168 85 247)', color: 'rgb(168 85 247)' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#a855f7"
              dot={false}
              isAnimationActive={false}
              name="Aktueller Preis"
            />
            {data[0].movingAverage7d !== undefined && (
              <Line
                type="monotone"
                dataKey="movingAverage7d"
                stroke="#f59e0b"
                dot={false}
                strokeDasharray="5 5"
                isAnimationActive={false}
                name="7-Tage Durchschnitt"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
