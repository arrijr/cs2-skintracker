// frontend/src/components/admin/SkinCardPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';

interface SkinCardPickerProps {
  onSelect: (skinId: number) => void;
  onClose: () => void;
}

interface Skin {
  id: number;
  name: string;
  marketHashName: string;
  imageUrl?: string;
  rarity?: string;
  priceLatest?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function SkinCardPicker({ onSelect, onClose }: SkinCardPickerProps) {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkins();
  }, [search]);

  const fetchSkins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('limit', '20');
      if (search) {
        params.append('search', search);
      }

      const response = await axios.get(`${API_BASE_URL}/skins?${params.toString()}`);
      setSkins(response.data.data || []);
    } catch (err) {
      console.error('Error fetching skins:', err);
      setError('Failed to load skins');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSkin = (skin: Skin) => {
    onSelect(skin.id);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Select Skin for Blog Post</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] px-6 pb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search skins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchSkins} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : skins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No skins found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skins.map((skin) => (
                <Card
                  key={skin.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${skin.name}`}
                  className="cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                  onClick={() => handleSelectSkin(skin)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectSkin(skin);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative h-12 w-12 flex-shrink-0">
                        {skin.imageUrl ? (
                          <Image
                            src={skin.imageUrl}
                            alt={skin.name}
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium text-sm truncate">{skin.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {skin.rarity && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {skin.rarity}
                            </Badge>
                          )}
                          {skin.priceLatest && (
                            <span className="text-xs text-gray-500">
                              ${skin.priceLatest.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button size="sm" variant="outline">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
