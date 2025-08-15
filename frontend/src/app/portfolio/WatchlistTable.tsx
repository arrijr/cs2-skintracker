"use client";

import Image from "next/image";
import Link from "next/link";

/* ============================
   Types
============================ */
type WatchlistEntry = {
  id: number;
  skinId: number;
  priceAlert: number | null;
  // flat
  name?: string;
  imageUrl?: string;
  marketHashName?: string;
  // nested
  skin?: {
    id: number;
    name: string;
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
};

/* ============================
   WatchlistTable Component
============================ */
export default function WatchlistTable({ watchlist, onRemove }: Props) {
  // {/* Early exit / empty state */}
  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto mt-8 text-center text-zinc-400">
        {/* Watchlist Empty State */}
        No items in your watchlist yet.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto mt-8">
      {/* Table Title */}
      <h2 className="text-xl font-bold mb-4">Watchlist</h2>

      {/* Table Wrapper */}
      <table className="w-full text-sm">
        {/* Table Head */}
        <thead>
          <tr className="text-gray-300 border-b border-gray-700">
            <th className="py-2 text-left">Image</th>
            <th className="text-left">Name</th>
            <th className="text-center">Alert ($)</th>
            <th className="text-right"></th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {watchlist.map((entry) => {
            /* Row: derive fields (supports flat or nested shapes) */
            const s = entry.skin;
            const name = s?.name ?? entry.name ?? "Unknown item";
            const img =
              s?.itemimage ||
              s?.itemImage ||
              s?.image_url ||
              s?.imageUrl ||
              entry.imageUrl ||
              "/images/placeholder-skin.png"; // <-- fallback from /public/images/placeholder-skin.png
            const linkId = s?.id ?? entry.skinId;

            return (
              <tr key={`${entry.id}-${linkId ?? "noid"}`} className="border-b border-gray-800">
                {/* Row: Image */}
                <td className="py-2">
                  <Image
                    src={img}
                    width={48}
                    height={48}
                    alt={name}
                    className="rounded object-cover"
                  />
                </td>

                {/* Row: Name Link */}
                <td>
                  <Link
                    href={linkId ? `/skins/${Number(linkId)}` : "#"}
                    className="text-blue-400 hover:underline"
                    onClick={(e) => {
                      if (!linkId || Number.isNaN(Number(linkId))) {
                        e.preventDefault();
                        console.warn("[WatchlistTable] missing/invalid linkId:", entry);
                      }
                    }}
                  >
                    {name}
                  </Link>
                </td>

                {/* Row: Alert Value */}
                <td className="text-center">{entry.priceAlert ?? "-"}</td>

                {/* Quick Action: Remove */}
                <td className="text-right">
                  <button
                    onClick={() => {
                      if (!linkId || Number.isNaN(Number(linkId))) {
                        console.warn("[WatchlistTable] cannot remove, invalid id:", entry);
                        return;
                      }
                      onRemove(Number(linkId));
                    }}
                    className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800"
                    aria-label={`Remove ${name} from watchlist`}
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
  );
}
