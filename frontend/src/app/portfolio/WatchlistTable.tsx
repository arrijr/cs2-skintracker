"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, DollarSign } from "lucide-react";
import { skinDetailHref } from "@/lib/skin-urls";

type WatchlistEntry =
  | {
      id: number;
      skinId: number;
      priceAlert: number | null;
      // flat
      name?: string;
      imageUrl?: string;
      marketHashName?: string;
      slug?: string | null;
      weaponSlug?: string | null;
      // nested
      skin?: {
        id: number;
        name: string;
        slug?: string | null;
        weaponSlug?: string | null;
        image_url?: string;
        imageUrl?: string;
        itemimage?: string;
        itemImage?: string;
        market_hash_name?: string;
        marketHashName?: string;
      };
    };

type Props = {
  watchlist: WatchlistEntry[];
  onRemove: (skinId: number) => void;
  onUpdateAlert?: (skinId: number, alertPrice: number) => void;
};

export default function WatchlistTable({ watchlist, onRemove, onUpdateAlert }: Props) {
  const { isPremium } = useUserRole();
  const [editingAlert, setEditingAlert] = useState<number | null>(null);
  const [alertPrice, setAlertPrice] = useState<string>("");
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto mt-8" data-testid="watchlist-table">
      <h2 className="text-xl font-bold mb-4">Watchlist</h2>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-gray-300 border-b border-gray-700">
            <th className="py-2">Image</th>
            <th>Name</th>
            <th>Alert</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {watchlist.map((entry) => {
            const s = entry.skin;
            const name = s?.name ?? entry.name ?? "Unknown item";
            const img =
              s?.itemimage ||
              s?.itemImage ||
              s?.image_url ||
              s?.imageUrl ||
              entry.imageUrl ||
              "/images/placeholder-skin.png";
            const linkId = s?.id ?? entry.skinId;
            const href = skinDetailHref({
              id: linkId,
              slug: s?.slug ?? entry.slug ?? null,
              weaponSlug: s?.weaponSlug ?? entry.weaponSlug ?? null,
            });

            return (
              <tr key={`${entry.id}-${linkId}`} className="border-b border-gray-800">
                <td className="py-2">
                  <Image src={img} width={48} height={48} alt={name} className="rounded" />
                </td>
                <td>
                  {href ? (
                    <Link href={href} className="text-fuchsia-400 hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      tabIndex={-1}
                      className="text-gray-300 cursor-default"
                    >
                      {name}
                    </span>
                  )}
                </td>
                <td className="text-center">
                  {isPremium ? (
                    <div className="flex items-center gap-2 justify-center">
                      {editingAlert === linkId ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          <Input
                            type="number"
                            value={alertPrice}
                            onChange={(e) => setAlertPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-16 h-6 text-xs bg-gray-800 border-gray-600 text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const price = parseFloat(alertPrice);
                                if (price > 0 && onUpdateAlert) {
                                  onUpdateAlert(linkId, price);
                                }
                                setEditingAlert(null);
                                setAlertPrice("");
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              const price = parseFloat(alertPrice);
                              if (price > 0 && onUpdateAlert) {
                                onUpdateAlert(linkId, price);
                              }
                              setEditingAlert(null);
                              setAlertPrice("");
                            }}
                          >
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Bell className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">
                            {entry.priceAlert ? `$${entry.priceAlert}` : "No alert"}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1 text-xs"
                            onClick={() => {
                              setEditingAlert(linkId);
                              setAlertPrice(entry.priceAlert?.toString() || "");
                            }}
                          >
                            {entry.priceAlert ? "✏️" : "+"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {entry.priceAlert ? `$${entry.priceAlert}` : "Premium"}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => onRemove(linkId)}
                    className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
