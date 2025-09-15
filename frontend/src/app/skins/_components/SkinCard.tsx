// frontend/src/app/skins/_components/SkinCard.tsx — [Frontend]
// {/* Skin card with quick "Add to Watchlist" */}
"use client";
import Link from "next/link";
import Image from "next/image";
import { apiUrl, fetchJson } from "@/lib/api";

type Skin = {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl?: string;
  weaponType?: string;
  wear?: string | null;
  rarity?: string | null;
  quality?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  priceAvg?: number | null;
  priceMedian?: number | null;
  offerVolume?: number | null;
  sold24h?: number | null;
};

export function SkinCard({ skin, onAdded }: { skin: Skin; onAdded?: () => void }) {
  async function addToWatchlist(e: React.MouseEvent) {
    e.preventDefault(); // Prevent navigation when clicking the button
    e.stopPropagation(); // Stop event bubbling
    
    try {
      await fetchJson(apiUrl('/api/v1/watchlist'), {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ skinId: skin.id }),
      });
      
      onAdded?.();
      // replace with your toast system
      console.log("Added to Watchlist");
    } catch {
      console.error("Failed to add to watchlist");
    }
  }

  const price = skin.priceAvg || skin.priceMedian;
  const rarityColor = getRarityColor(skin.rarity);
  
  // Safe string handling
  const safeName = skin.name || 'Unknown Skin';
  const safeRarity = skin.rarity || '';
  const safeWear = skin.wear || '';

  return (
    <Link href={`/skins/${skin.id}`} className="block">
      <div className="rounded-2xl bg-gray-800 p-3 hover:bg-gray-700 transition-all duration-200 hover:scale-105 group cursor-pointer">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-xl mb-3 relative">
          <Image
            src={skin.imageUrl || "/images/placeholder-skin.png"}
            alt={skin.name}
            width={200}
            height={200}
            loading="lazy"
            className="w-full h-full object-contain"
          />
          
          {/* Special Indicators */}
          {skin.isStattrak && (
            <div className="absolute top-2 right-2 bg-orange-600 text-xs px-2 py-1 rounded font-bold">
              ST
            </div>
          )}
          {skin.isStar && (
            <div className="absolute top-2 left-2 text-yellow-400 text-2xl">
              ★
            </div>
          )}
        </div>

        {/* Title */}
        <div className="text-sm font-semibold line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
          {safeName}
        </div>
        
        {/* Rarity & Wear */}
        <div className="text-xs text-gray-400 mb-3">
          {safeRarity && (
            <span className={`${rarityColor} mr-2`}>
              {safeRarity}
            </span>
          )}
          {safeWear && (
            <span className="text-gray-500">
              {safeWear}
            </span>
          )}
        </div>

        {/* Price / Actions */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-green-400">
            {price ? `$${price.toFixed(2)}` : "--"}
          </span>
          
          {/* Quick Add to Watchlist */}
          <button 
            onClick={addToWatchlist}
            className="text-xs px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            + Watchlist
          </button>
        </div>
      </div>
    </Link>
  );
}

function getRarityColor(rarity: string | null | undefined): string {
  if (!rarity) return 'text-gray-400';
  
  const colors: Record<string, string> = {
    'Consumer Grade': 'text-gray-400',
    'Industrial Grade': 'text-blue-400',
    'Mil-Spec': 'text-blue-500',
    'Restricted': 'text-purple-400',
    'Classified': 'text-pink-400',
    'Covert': 'text-red-400',
    'Contraband': 'text-yellow-400',
  };
  
  return colors[rarity] || 'text-gray-400';
}
