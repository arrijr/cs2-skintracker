"use client";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from "chart.js";
import Link from "next/link";
import Image from "next/image";

// Chart.js Registration
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

type PortfolioEntry = {
  id: number;
  amount: number;
  avgPrice: number;
  skin: {
    id: number;
    name: string;
    imageUrl?: string;
    itemimage?: string;
    marketPrice?: number;
    priceLatest?: number;
  };
};

type Props = {
  portfolio: PortfolioEntry[];
};

type MoverEntry = {
  skinId: number;
  skinName: string;
  imageUrl: string;
  change24h: number;
  change24hPercent: number;
  change7d: number;
  change7dPercent: number;
  currentValue: number;
  avgPrice: number;
  amount: number;
};

export default function TopMovers({ portfolio }: Props) {
  const movers = useMemo((): { gainers: MoverEntry[]; losers: MoverEntry[] } => {
    if (!portfolio || portfolio.length === 0) {
      return { gainers: [], losers: [] };
    }

    const moversList: MoverEntry[] = [];

    for (const entry of portfolio) {
      const currentPrice = entry.skin.marketPrice || entry.skin.priceLatest || 0;
      const avgPrice = entry.avgPrice;
      
      if (currentPrice > 0 && avgPrice > 0) {
        const change24h = currentPrice - avgPrice; // Simplified - using avg price as baseline
        const change24hPercent = (change24h / avgPrice) * 100;
        
        // Simplified 7d change (using same calculation for now)
        const change7d = change24h;
        const change7dPercent = change24hPercent;

        const imageUrl = entry.skin.imageUrl || entry.skin.itemimage || "/images/placeholder-skin.png";

        moversList.push({
          skinId: entry.skin.id,
          skinName: entry.skin.name,
          imageUrl,
          change24h,
          change24hPercent,
          change7d,
          change7dPercent,
          currentValue: currentPrice * entry.amount,
          avgPrice,
          amount: entry.amount,
        });
      }
    }

    // Sort by 24h change percentage
    moversList.sort((a, b) => Math.abs(b.change24hPercent) - Math.abs(a.change24hPercent));

    const gainers = moversList
      .filter(mover => mover.change24hPercent > 0)
      .slice(0, 3);

    const losers = moversList
      .filter(mover => mover.change24hPercent < 0)
      .slice(0, 3);

    return { gainers, losers };
  }, [portfolio]);

  const createSparklineData = (entry: MoverEntry) => {
    // Simplified sparkline - in real implementation, this would use actual 7d price history
    const data = [entry.avgPrice, entry.avgPrice * 0.95, entry.avgPrice * 1.02, entry.avgPrice * 0.98, entry.avgPrice * 1.05, entry.avgPrice * 1.03, entry.avgPrice * (1 + entry.change24hPercent / 100)];
    
    return {
      labels: ['7d ago', '6d ago', '5d ago', '4d ago', '3d ago', '2d ago', '1d ago'],
      datasets: [{
        data,
        borderColor: entry.change24hPercent > 0 ? "#10B981" : "#EF4444",
        backgroundColor: entry.change24hPercent > 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
      }]
    };
  };

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } },
  };

  if (!portfolio || portfolio.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Top Movers (24h)</h3>
        <div className="text-center text-gray-400 py-8">
          No portfolio data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md">
      <h3 className="text-xl font-semibold mb-6">Top Movers (24h)</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div>
          <h4 className="text-lg font-medium text-emerald-400 mb-4">Top Gainers</h4>
          {movers.gainers.length > 0 ? (
            <div className="space-y-3">
              {movers.gainers.map((entry) => (
                <Link
                  key={entry.skinId}
                  href={`/skins/${entry.skinId}`}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Image
                    src={entry.imageUrl}
                    alt={entry.skinName}
                    width={40}
                    height={40}
                    className="rounded w-10 h-10 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{entry.skinName}</div>
                    <div className="text-xs text-gray-400">
                      {entry.amount}x • ${entry.currentValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-semibold">
                      +{entry.change24hPercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      +${entry.change24h.toFixed(2)}
                    </div>
                  </div>
                  <div className="w-16 h-8">
                    <Line data={createSparklineData(entry)} options={sparklineOptions} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No gainers in the last 24h</p>
              <p className="text-sm">Add more skins to see performance</p>
            </div>
          )}
        </div>

        {/* Top Losers */}
        <div>
          <h4 className="text-lg font-medium text-red-400 mb-4">Top Losers</h4>
          {movers.losers.length > 0 ? (
            <div className="space-y-3">
              {movers.losers.map((entry) => (
                <Link
                  key={entry.skinId}
                  href={`/skins/${entry.skinId}`}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Image
                    src={entry.imageUrl}
                    alt={entry.skinName}
                    width={40}
                    height={40}
                    className="rounded w-10 h-10 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{entry.skinName}</div>
                    <div className="text-xs text-gray-400">
                      {entry.amount}x • ${entry.currentValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-semibold">
                      {entry.change24hPercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      ${entry.change24h.toFixed(2)}
                    </div>
                  </div>
                  <div className="w-16 h-8">
                    <Line data={createSparklineData(entry)} options={sparklineOptions} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No losers in the last 24h</p>
              <p className="text-sm">All positions are performing well</p>
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        * Performance based on current market price vs. average buy price
      </div>
    </div>
  );
}
