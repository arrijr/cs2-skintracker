// {/* Enhanced Market Statistics Card */}
interface MarketStats {
  priceChange24h?: number;
  priceChange7d?: number;
  volatility?: number;
  volume24h?: number;
  marketCap?: number;
}

interface MarketStatsCardProps {
  stats: MarketStats;
}

export default function MarketStatsCard({ stats }: MarketStatsCardProps) {
  if (!stats) return null;

  return (
    <div className="w-full bg-neutral-800 rounded-xl shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-emerald-400">📊 Market Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.priceChange24h !== undefined && (
          <div className="text-center">
            <div className="text-sm text-gray-400">24h Change</div>
            <div className={`text-lg font-bold ${stats.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.priceChange24h >= 0 ? '+' : ''}{stats.priceChange24h.toFixed(2)}%
            </div>
          </div>
        )}
        
        {stats.priceChange7d !== undefined && (
          <div className="text-center">
            <div className="text-sm text-gray-400">7d Change</div>
            <div className={`text-lg font-bold ${stats.priceChange7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.priceChange7d >= 0 ? '+' : ''}{stats.priceChange7d.toFixed(2)}%
            </div>
          </div>
        )}
        
        {stats.volatility !== undefined && (
          <div className="text-center">
            <div className="text-sm text-gray-400">Volatility</div>
            <div className="text-lg font-bold text-blue-400">
              {stats.volatility.toFixed(2)}%
            </div>
          </div>
        )}
        
        {stats.volume24h !== undefined && (
          <div className="text-center">
            <div className="text-sm text-gray-400">24h Volume</div>
            <div className="text-lg font-bold text-purple-400">
              {stats.volume24h.toLocaleString()}
            </div>
          </div>
        )}
      </div>
      
      {stats.marketCap !== undefined && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-400">Market Cap</div>
          <div className="text-xl font-bold text-yellow-400">
            ${stats.marketCap.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
