// /frontend/src/app/components/SkinVariantsCard.tsx (Frontend)
"use client";

import { Star, Zap, Package } from "lucide-react";
import Link from "next/link";

interface SkinVariant {
  id: number;
  name: string;
  wear: string;
  quality: string;
  isStattrak: boolean;
  isStar: boolean;
  priceLatest: number;
  imageUrl: string;
}

interface SkinVariantsCardProps {
  variants: SkinVariant[];
  currentSkinId: number;
}

export default function SkinVariantsCard({ variants, currentSkinId }: SkinVariantsCardProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => `$${price?.toFixed(2) || '0.00'}`;
  const formatWear = (wear: string) => {
    const wearMap: Record<string, string> = {
      'Factory New': 'FN',
      'Minimal Wear': 'MW',
      'Field-Tested': 'FT',
      'Well-Worn': 'WW',
      'Battle-Scarred': 'BS'
    };
    return wearMap[wear] || wear;
  };

  const getWearColor = (wear: string) => {
    const colorMap: Record<string, string> = {
      'Factory New': 'text-emerald-400',
      'Minimal Wear': 'text-blue-400',
      'Field-Tested': 'text-yellow-400',
      'Well-Worn': 'text-orange-400',
      'Battle-Scarred': 'text-red-400'
    };
    return colorMap[wear] || 'text-gray-400';
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold">Skin Variants</h3>
        <span className="text-sm text-gray-400">({variants.length} variants)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {variants.map((variant) => (
          <Link
            key={variant.id}
            href={`/skins/${variant.id}`}
            className={`group relative bg-gray-800 rounded-lg p-3 border transition-all hover:border-gray-600 hover:bg-gray-750 ${
              variant.id === currentSkinId ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* Current Skin Indicator */}
            {variant.id === currentSkinId && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Current
              </div>
            )}

            {/* Variant Image */}
            <div className="relative mb-3">
              <img
                src={variant.imageUrl || "/images/placeholder-skin.png"}
                alt={variant.name}
                className="w-full h-20 object-contain rounded-md bg-gray-700"
              />
              
              {/* Special Indicators */}
              <div className="absolute top-1 right-1 flex gap-1">
                {variant.isStattrak && (
                  <div className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">
                    ST
                  </div>
                )}
                {variant.isStar && (
                  <Star className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            </div>

            {/* Variant Info */}
            <div className="space-y-1">
              <div className="text-sm font-medium truncate">{variant.name}</div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${getWearColor(variant.wear)}`}>
                  {formatWear(variant.wear)}
                </span>
                <span className="text-gray-400">{variant.quality}</span>
              </div>

              <div className="text-sm font-semibold text-emerald-400">
                {formatPrice(variant.priceLatest)}
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-400 text-center">
          Click on any variant to view its details
        </div>
      </div>
    </div>
  );
}
