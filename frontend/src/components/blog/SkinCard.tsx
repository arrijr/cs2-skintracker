'use client';

// frontend/src/components/blog/SkinCard.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SkinCardProps {
  id: string;
}

interface SkinData {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl?: string;
  weaponType?: string;
  wear?: string;
  rarity?: string;
  isStattrak?: boolean;
  priceLatest?: number;
  sold7d?: number;
}

export function SkinCard({ id }: SkinCardProps) {
  const [skin, setSkin] = useState<SkinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkin = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/skins/${id}`);
        
        if (!response.ok) {
          throw new Error('Skin not found');
        }
        
        const skinData = await response.json();
        setSkin(skinData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skin');
      } finally {
        setLoading(false);
      }
    };

    fetchSkin();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 my-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-16 h-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !skin) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 my-4">
        <div className="text-center text-muted-foreground">
          <p>Skin not found (ID: {id})</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'covert': return 'bg-red-500';
      case 'classified': return 'bg-purple-500';
      case 'restricted': return 'bg-pink-500';
      case 'milspec': return 'bg-blue-500';
      case 'industrial': return 'bg-gray-500';
      case 'consumer': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 my-4 hover:shadow-md transition-shadow">
      <Link href={`/skins/${skin.id}`} className="block">
        <div className="flex items-center space-x-4">
          {/* Skin Image */}
          <div className="relative w-16 h-16 flex-shrink-0">
            {skin.imageUrl ? (
              <Image
                src={skin.imageUrl}
                alt={skin.name}
                fill
                className="object-cover rounded"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No Image</span>
              </div>
            )}
            
            {/* StatTrak Badge */}
            {skin.isStattrak && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">ST</span>
              </div>
            )}
          </div>
          
          {/* Skin Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {skin.name}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              {skin.weaponType && (
                <span className="text-sm text-muted-foreground">
                  {skin.weaponType}
                </span>
              )}
              {skin.wear && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="text-xs">
                    {skin.wear}
                  </Badge>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-lg font-bold text-brand-celadon">
                {formatPrice(skin.priceLatest)}
              </div>
              
              {skin.sold7d && (
                <div className="text-sm text-muted-foreground">
                  {skin.sold7d} sold
                </div>
              )}
            </div>
          </div>
          
          {/* Rarity Badge */}
          {skin.rarity && (
            <div className={`w-2 h-8 rounded ${getRarityColor(skin.rarity)}`} />
          )}
        </div>
      </Link>
    </div>
  );
}
