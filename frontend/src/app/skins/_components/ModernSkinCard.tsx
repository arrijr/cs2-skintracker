// frontend/src/app/skins/_components/ModernSkinCard.tsx — [Frontend]
// {/* Modern Skin card with shadcn/ui components */}
"use client";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, ShoppingCart } from "lucide-react";
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

export function ModernSkinCard({ skin, onAdded }: { skin: Skin; onAdded?: () => void }) {
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
      console.log("Added to Watchlist");
    } catch {
      console.error("Failed to add to watchlist");
    }
  }

  const price = skin.priceAvg || skin.priceMedian;
  
  // Safe string handling
  const safeName = skin.name || 'Unknown Skin';
  const safeWear = skin.wear || '';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105 group cursor-pointer">
      <Link href={`/skins/${skin.id}`} className="block">
        {/* Image */}
        <div className="aspect-square overflow-hidden relative">
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
            <Badge className="absolute top-2 right-2 bg-orange-600 text-xs px-2 py-1 font-bold">
              ST
            </Badge>
          )}
          {skin.isStar && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 font-bold">
              Special
            </Badge>
          )}
          
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <div className="text-sm font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {safeName}
          </div>
          
          {/* Wear */}
          {safeWear && (
            <div className="text-xs text-muted-foreground mb-2">
              {safeWear}
            </div>
          )}

          {/* Price */}
          {price && (
            <div className="text-lg font-bold text-green-500">
              ${price.toFixed(2)}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
