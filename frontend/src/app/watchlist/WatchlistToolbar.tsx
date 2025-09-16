"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
// Falls ihr die schon habt:
import SkinSearchBar from "@/app/components/SkinSearchBar"; 

type Props = {
  onAdd: (skinId: number, priceAlert?: number | null) => void;
};

export default function WatchlistToolbar({ onAdd }: Props) {
  const [newSkinId, setNewSkinId] = useState<number | null>(null);
  const [priceAlert, setPriceAlert] = useState<number | null>(null);

  // {/* Add Skin to Watchlist */}
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center mb-6">
      <SkinSearchBar onSelect={setNewSkinId} />
      
      {/* Price Alert (optional) */}
      <div className="flex items-center gap-2">
        <Label htmlFor="price-alert" className="sr-only">Price Alert</Label>
        <Input
          id="price-alert"
          type="number"
          placeholder="Price Alert (optional)"
          value={priceAlert ?? ""}
          onChange={(e) => setPriceAlert(e.target.value ? Number(e.target.value) : null)}
          min={0}
          step={0.01}
          className="w-36"
        />
      </div>

      <Button
        onClick={() => newSkinId && onAdd(newSkinId, priceAlert)}
      >
        Add
      </Button>
    </div>
  );
}
