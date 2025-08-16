"use client";
import Image from "next/image";
import Link from "next/link";

type WatchlistEntry =
  | {
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

export default function WatchlistTable({ watchlist, onRemove }: Props) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Watchlist</h2>
      <table className="w-full text-sm">
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
              "/placeholder-skin.png";
            const linkId = s?.id ?? entry.skinId;

            return (
              <tr key={`${entry.id}-${linkId}`} className="border-b border-gray-800">
                <td className="py-2">
                  <Image src={img} width={48} height={48} alt={name} className="rounded" />
                </td>
                <td>
                  <Link href={`/skins/${linkId}`} className="text-blue-400 hover:underline">
                    {name}
                  </Link>
                </td>
                <td className="text-center">{entry.priceAlert ?? "-"}</td>
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
  );
}
