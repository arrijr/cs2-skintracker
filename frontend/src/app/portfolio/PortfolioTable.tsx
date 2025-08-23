"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Bell } from "lucide-react";
import PurchaseAccordion from "../components/PurchaseAccordion";
import clsx from "clsx";
import Tooltip from "../components/Tooltip";


type Skin = {
  id: number;
  name: string;
  imageUrl?: string | null;
  itemimage?: string | null;
  marketPrice?: number | null;
};

type Purchase = {
  id: number;
  amount: number;
  buyPrice: number;
  buyDate: string;
};

type PortfolioEntry = {
  id: number;
  amount: number;
  buyPrice: number;
  avgPrice: number;
  purchases: Purchase[];
  skin: Skin;
};

type Props = {
  skins: PortfolioEntry[];
  watchlist: any[]; // WatchlistEntry is not defined here, using any
  onDataChange: () => void; // Callback to trigger data refresh
};

export default function PortfolioTable({ skins, watchlist = [], onDataChange }: Props) {
  // EIN State für alle Accordions – merkt sich, welches Skin-Accordion offen ist:
  const [openSkinId, setOpenSkinId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"performance" | "recent" | "default">("default");



  // Filtered & Sorted Skins
  let filteredSkins = skins;

  // Name-Filter
  if (search.trim() !== "") {
    filteredSkins = filteredSkins.filter((entry) =>
      entry.skin.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }

  // Sortierung
  if (sortBy === "performance") {
    filteredSkins = [...filteredSkins].sort((a, b) => {
      // Performance robust berechnen
      const perfA =
        typeof a.skin.marketPrice === "number" &&
        typeof a.avgPrice === "number" &&
        a.avgPrice > 0
          ? ((a.skin.marketPrice - a.avgPrice) / a.avgPrice) * 100
          : 0;
      const perfB =
        typeof b.skin.marketPrice === "number" &&
        typeof b.avgPrice === "number" &&
        b.avgPrice > 0
          ? ((b.skin.marketPrice - b.avgPrice) / b.avgPrice) * 100
          : 0;
      return perfB - perfA;
    });
  } else if (sortBy === "recent") {
    filteredSkins = [...filteredSkins].sort((a, b) => {
      // Most recent buy: nach neustem Kaufdatum
      const dateA = a.purchases?.[a.purchases.length - 1]?.buyDate
        ? new Date(a.purchases[a.purchases.length - 1].buyDate).getTime()
        : 0;
      const dateB = b.purchases?.[b.purchases.length - 1]?.buyDate
        ? new Date(b.purchases[b.purchases.length - 1].buyDate).getTime()
        : 0;
      return dateB - dateA;
    });
  }

  {/* Portfolio Empty State */}
if (!skins || skins.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
      {/* Optional: Small illustration */}
      <svg width="72" height="72" fill="none" viewBox="0 0 24 24" className="mb-4 opacity-70">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 14s1.5-2 4-2 4 2 4 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
      <h2 className="text-2xl font-semibold mb-2">No skins in your portfolio yet</h2>
      <p className="mb-4 text-center max-w-xs">
        Add your first CS2 skin to start tracking your portfolio’s value and performance over time.
      </p>
      {/* Optional: Add Skin Button */}
      <button
        className="btn-main"
        onClick={() => {/* Open add skin modal or redirect to add page */}}
      >
        Add Skin
      </button>
    </div>
  );
}

  return (

    <div className="flex flex-col gap-4">

      {/* Portfolio Filter & Searchbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search skins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-main flex-1 min-w-[180px]"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="input-main"
        >
          <option value="default">Sort by...</option>
          <option value="performance">Best performance</option>
          <option value="recent">Most recent buy</option>
        </select>
      </div>

      {filteredSkins.map((entry) => {
        const alertObj = watchlist.find(
          (w) => w.skinId === entry.skin.id && w.priceAlert && w.priceAlert > 0
        );
        // Performance robust berechnen (0% wenn MarketPrice fehlt)
        const performance =
          typeof entry.skin.marketPrice === "number" &&
          typeof entry.avgPrice === "number" &&
          entry.avgPrice > 0
            ? ((entry.skin.marketPrice - entry.avgPrice) / entry.avgPrice) * 100
            : 0;

        const isOpen = openSkinId === entry.skin.id;
        // Bildfelder priorisieren: itemimage -> itemImage -> image_url -> imageUrl -> placeholder
        const img =
          entry.skin.itemimage ||
          entry.skin.itemImage ||
          entry.skin.image_url ||
          entry.skin.imageUrl ||
          "/images/placeholder-skin.png";

        return (
          <div
            key={entry.skin.id}
            className={`bg-zinc-900 rounded-xl shadow transition-all duration-300 border-2 ${isOpen ? "border-blue-500" : "border-transparent"}`}
          >
            {/* Klickbarer Header */}
            <div
              className="flex justify-between items-center cursor-pointer p-4"
              onClick={() => setOpenSkinId(isOpen ? null : entry.skin.id)}
            >
              <div className="flex gap-4 items-center">
                {/* Portfolio Row Image */}
                <Image
                  src={img}
                  alt={entry.skin.name}
                  width={48}
                  height={48}
                  className="rounded w-12 h-12 object-cover"
                />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <Link 
                      href={`/skins/${entry.skin.id}`}
                      onClick={(e) => e.stopPropagation()} // Verhindert Accordion-Toggle
                      className="hover:text-blue-400 transition-colors"
                    >
                      {entry.skin.name}
                    </Link>
                    {/* Alert Badge */}
                    {alertObj && (
                      <Tooltip content={`Price alert: ${alertObj.priceAlert} $`}>
                        <span>
                          <Bell className="inline w-5 h-5 text-amber-400" />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">{entry.amount}x</div>
                </div>
              </div>
              {/* Stats-Block */}
              <div className="flex gap-6 items-center">
                <div>
                  <span className="text-zinc-400 text-xs">Avg. Buy</span>
                  <div className="font-mono">
                    {typeof entry.avgPrice === "number"
                      ? entry.avgPrice.toFixed(2) + " $"
                      : "-"}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">Market</span>
                  <div className="font-mono">
                    {typeof entry.skin.marketPrice === "number"
                      ? entry.skin.marketPrice.toFixed(2) + " $"
                      : "-"}
                  </div>
                </div>
                <div className={performance >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {performance > 0 ? "+" : ""}
                  {performance.toFixed(1)}%
                </div>
                <span>{isOpen ? <ChevronUp /> : <ChevronDown />}</span>
              </div>
            </div>
            {/* Accordion Content */}
            {isOpen && (
              <PurchaseAccordion
                purchases={entry.purchases}
                onTransactionChange={onDataChange}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
