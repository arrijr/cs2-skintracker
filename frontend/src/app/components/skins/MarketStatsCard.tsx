// {/* Enhanced Market Statistics Card */}
import { formatUSD, safeToFixed, numberOrNull } from "@/lib/num";
import { Tip } from "../ui/Tooltip";

interface MarketStats {
  volume24h?: number | null;
  volume7d?: number | null;
  volume30d?: number | null;
  currentPrice?: number | string | null;
  medianPrice?: number | string | null;
  lowestPrice?: number | string | null;
  maxPrice?: number | string | null;
  avgPrice?: number | string | null;
  buyOrders?: number | null;
  listings?: number | null;
  lastUpdated?: string | null;
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
         {stats.volume24h !== null && (
           <div className="text-center">
             <Tip label="Estimated trades on Steam during last 24h">
               <div className="text-sm text-gray-400">24h Volume</div>
             </Tip>
             <div className="text-lg font-bold text-purple-400">
               {stats.volume24h?.toLocaleString() || "—"}
             </div>
           </div>
         )}
         
         {stats.volume7d !== null && (
           <div className="text-center">
             <Tip label="Estimated trades on Steam during last 7 days">
               <div className="text-sm text-gray-400">7d Volume</div>
             </Tip>
             <div className="text-lg font-bold text-fuchsia-400">
               {stats.volume7d?.toLocaleString() || "—"}
             </div>
           </div>
         )}
        
        {stats.lowestPrice !== null && (
          <div className="text-center">
            <div className="text-sm text-gray-400">Lowest Price</div>
            <div className="text-lg font-bold text-green-400">
              {formatUSD(stats.lowestPrice)}
            </div>
          </div>
        )}
        
        {stats.medianPrice !== null && (
          <div className="text-center">
            <div className="text-sm text-gray-400">Median Price</div>
            <div className="text-lg font-bold text-yellow-400">
              {formatUSD(stats.medianPrice)}
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        {stats.buyOrders !== null && (
          <div className="text-center">
            <div className="text-sm text-gray-400">Buy Orders</div>
            <div className="text-lg font-bold text-emerald-400">
              {stats.buyOrders?.toLocaleString() || "—"}
            </div>
          </div>
        )}
        
                 {stats.listings !== null && (
           <div className="text-center">
             <Tip label="Currently available items on Steam Market">
               <div className="text-sm text-gray-400">Active Listings</div>
             </Tip>
             <div className="text-lg font-bold text-orange-400">
               {stats.listings?.toLocaleString() || "—"}
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
