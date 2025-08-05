"use client";
import Image from "next/image";
import Link from "next/link";

type WatchlistEntry = {
  id: number;
  skinId: number;
  marketHashName: string;
  name: string;
  imageUrl: string;
  priceAlert: number | null;
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
            <th className="py-2">Bild</th>
            <th>Name</th>
            <th>Marktpreis</th>
            <th>Alarmgrenze</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {watchlist.map((entry) => (
            <tr key={entry.id} className="border-b border-gray-800">
              <td className="py-2">
                {entry.imageUrl ? (
                    <Image src={entry.imageUrl} width={48} height={48} alt={entry.name} className="rounded" />
                    ) : (
                    <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-gray-500 text-xs">
                        ?
                    </div>
                    )}
              </td>
              <td>  <Link href={`/skins/${entry.skinId}`} className="text-blue-400 hover:underline">
                      {entry.name}
                    </Link>
              </td>
              <td className="text-center">{/* Marktpreis später ergänzen */}</td>
              <td className="text-center">{entry.priceAlert ?? "-"}</td>
              <td>
                <button
                  onClick={() => onRemove(entry.skinId)}
                  className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800"
                >
                  Entfernen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
