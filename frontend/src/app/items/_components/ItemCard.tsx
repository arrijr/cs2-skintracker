"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketItem } from "@/hooks/useMarketItems";

const CATEGORY_LABELS: Record<MarketItem['category'], string> = {
  sticker: 'Sticker',
  agent: 'Agent',
  patch: 'Patch',
  graffiti: 'Graffiti',
  music_kit: 'Music Kit',
  collectible: 'Collectible',
  key: 'Key',
};

const CATEGORY_COLORS: Record<MarketItem['category'], string> = {
  sticker: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  agent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  patch: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  graffiti: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  music_kit: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  collectible: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  key: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

interface ItemCardProps {
  item: MarketItem;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`}>
      <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50 hover:border-slate-600 transition-colors h-full">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="aspect-square bg-slate-800/40 rounded-md flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <span className="text-slate-500 text-xs">No image</span>
            )}
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className={`${CATEGORY_COLORS[item.category]} text-xs whitespace-nowrap`}>
              {CATEGORY_LABELS[item.category]}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-white line-clamp-2">{item.name}</h3>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">
              {item.priceLatest != null ? `€${item.priceLatest.toFixed(2)}` : '—'}
            </span>
            <span className="text-slate-500">
              {item.volume24h != null && item.volume24h > 0 ? `Vol ${item.volume24h}` : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
