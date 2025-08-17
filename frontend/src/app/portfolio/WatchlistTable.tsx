"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { updatePriceAlert } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";

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
  onAlertUpdate?: (skinId: number, priceAlert: number | null) => void;
};

/* ============================
   WatchlistTable Component
============================ */
export default function WatchlistTable({ watchlist, onRemove, onAlertUpdate }: Props) {
  const [editingAlert, setEditingAlert] = useState<number | null>(null);
  const [alertValue, setAlertValue] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "alert" | "default">("default");
  const [filterText, setFilterText] = useState("");

  // Filter and sort watchlist
  let filteredWatchlist = watchlist;

  // Filter by name
  if (filterText.trim() !== "") {
    filteredWatchlist = filteredWatchlist.filter((entry) => {
      const name = entry.skin?.name ?? entry.name ?? "";
      return name.toLowerCase().includes(filterText.toLowerCase());
    });
  }

  // Sort watchlist
  if (sortBy === "name") {
    filteredWatchlist = [...filteredWatchlist].sort((a, b) => {
      const nameA = (a.skin?.name ?? a.name ?? "").toLowerCase();
      const nameB = (b.skin?.name ?? b.name ?? "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } else if (sortBy === "alert") {
    filteredWatchlist = [...filteredWatchlist].sort((a, b) => {
      const alertA = a.priceAlert ?? 0;
      const alertB = b.priceAlert ?? 0;
      return alertB - alertA; // Higher alerts first
    });
  }

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

      {/* Watchlist – inline alert edit & sort */}
      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by name..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="input-main flex-1"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="input-main"
        >
          <option value="default">Sort by...</option>
          <option value="name">Name (A-Z)</option>
          <option value="alert">Price Alert</option>
        </select>
      </div>

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
          {filteredWatchlist.map((entry) => {
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

                {/* Watchlist – inline alert edit & sort */}
                {/* Row: Alert Value with inline editing */}
                <td className="text-center">
                  {editingAlert === linkId ? (
                    <div className="flex items-center gap-2 justify-center">
                      <input
                        type="number"
                        step="0.01"
                        value={alertValue}
                        onChange={(e) => setAlertValue(e.target.value)}
                        className="w-20 px-2 py-1 text-xs bg-zinc-800 border border-zinc-600 rounded text-center"
                        placeholder="Price"
                        autoFocus
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            const newAlert = parseFloat(alertValue) || null;
                            try {
                              await updatePriceAlert(Number(linkId), newAlert);
                              onAlertUpdate?.(Number(linkId), newAlert);
                              setEditingAlert(null);
                              setAlertValue("");
                            } catch (err: any) {
                              showError(err?.message || "Failed to update price alert");
                            }
                          } else if (e.key === "Escape") {
                            setEditingAlert(null);
                            setAlertValue("");
                          }
                        }}
                      />
                      <button
                        onClick={async () => {
                          const newAlert = parseFloat(alertValue) || null;
                          try {
                            await updatePriceAlert(Number(linkId), newAlert);
                            onAlertUpdate?.(Number(linkId), newAlert);
                            setEditingAlert(null);
                            setAlertValue("");
                          } catch (err: any) {
                            showError(err?.message || "Failed to update price alert");
                          }
                        }}
                        className="text-emerald-400 hover:text-emerald-300 text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingAlert(null);
                          setAlertValue("");
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingAlert(Number(linkId));
                        setAlertValue(entry.priceAlert?.toString() || "");
                      }}
                      className="hover:bg-zinc-800 px-2 py-1 rounded transition-colors"
                    >
                      {entry.priceAlert ? `${entry.priceAlert.toFixed(2)}` : "Set alert"}
                    </button>
                  )}
                </td>

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
