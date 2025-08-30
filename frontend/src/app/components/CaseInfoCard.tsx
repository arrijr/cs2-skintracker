// /frontend/src/app/components/CaseInfoCard.tsx (Frontend)
"use client";

import { Package, Star, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CaseSkin {
  id: number;
  name: string;
  wear: string;
  rarity: string;
  quality: string;
  isStattrak: boolean;
  priceLatest: number;
  imageUrl: string;
}

interface CaseInfo {
  caseName: string;
  skins: CaseSkin[];
  totalSkins: number;
}

interface CaseInfoCardProps {
  caseInfo: CaseInfo;
}

export default function CaseInfoCard({ caseInfo }: CaseInfoCardProps) {
  if (!caseInfo || !caseInfo.skins || caseInfo.skins.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => `$${price?.toFixed(2) || '0.00'}`;
  
  const getRarityColor = (rarity: string) => {
    const colorMap: Record<string, string> = {
      'Consumer Grade': 'text-gray-400',
      'Industrial Grade': 'text-blue-400',
      'Mil-Spec Grade': 'text-green-400',
      'Restricted': 'text-blue-500',
      'Classified': 'text-purple-400',
      'Covert': 'text-red-400',
      'Contraband': 'text-yellow-400'
    };
    return colorMap[rarity] || 'text-gray-400';
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold">Case Information</h3>
        </div>
        <span className="text-sm text-gray-400">{caseInfo.totalSkins} skins</span>
      </div>

      <div className="mb-4">
        <h4 className="text-md font-medium text-yellow-400 mb-2">
          {caseInfo.caseName}
        </h4>
        <p className="text-sm text-gray-400">
          This skin is part of the {caseInfo.caseName} case collection
        </p>
      </div>

      {/* Case Skins Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {caseInfo.skins.map((skin) => (
          <Link
            key={skin.id}
            href={`/skins/${skin.id}`}
            className="group relative bg-gray-800 rounded-lg p-3 border transition-all hover:border-gray-600 hover:bg-gray-750"
          >
            {/* Skin Image */}
            <div className="relative mb-3">
              <img
                src={skin.imageUrl || "/images/placeholder-skin.png"}
                alt={skin.name}
                className="w-full h-20 object-contain rounded-md bg-gray-700"
              />
              
              {/* Special Indicators */}
              <div className="absolute top-1 right-1 flex gap-1">
                {skin.isStattrak && (
                  <div className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">
                    ST
                  </div>
                )}
              </div>
            </div>

            {/* Skin Info */}
            <div className="space-y-1">
              <div className="text-sm font-medium truncate">{skin.name}</div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${getWearColor(skin.wear)}`}>
                  {skin.wear}
                </span>
                <span className={`font-medium ${getRarityColor(skin.rarity)}`}>
                  {skin.rarity}
                </span>
              </div>

              <div className="text-sm font-semibold text-emerald-400">
                {formatPrice(skin.priceLatest)}
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
          </Link>
        ))}
      </div>

      {/* Case Navigation */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Click on any skin to view its details
          </div>
          <Link
            href={`/skins?case=${encodeURIComponent(caseInfo.caseName)}`}
            className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            View all case skins
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
