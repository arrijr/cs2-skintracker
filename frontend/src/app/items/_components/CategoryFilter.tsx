"use client";
import { Button } from "@/components/ui/button";
import type { MarketItemCategory } from "@/hooks/useMarketItems";

const CATEGORIES: Array<{ value: MarketItemCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'sticker', label: 'Stickers' },
  { value: 'agent', label: 'Agents' },
  { value: 'patch', label: 'Patches' },
  { value: 'graffiti', label: 'Graffiti' },
  { value: 'music_kit', label: 'Music Kits' },
  { value: 'collectible', label: 'Collectibles' },
  { value: 'key', label: 'Keys' },
];

interface CategoryFilterProps {
  active: MarketItemCategory | null;
  onChange: (next: MarketItemCategory | null) => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const isActive = (c.value === 'all' && active === null) || c.value === active;
        return (
          <Button
            key={c.value}
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => onChange(c.value === 'all' ? null : c.value as MarketItemCategory)}
            className={
              isActive
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600'
                : 'border-slate-700/50 text-slate-300 hover:border-slate-600 hover:text-white bg-slate-900/50'
            }
          >
            {c.label}
          </Button>
        );
      })}
    </div>
  );
}
