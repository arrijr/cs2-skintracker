"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Bell, AlertTriangle } from "lucide-react";
import PurchaseAccordion from "../components/PurchaseAccordion";
import clsx from "clsx";
import Tooltip from "../components/Tooltip";
import { safeLower, safeIncludes, safeLocaleCompare } from "@/lib/strings";
import { skinDetailHref } from "@/lib/skin-urls";
import { formatEUR } from "@/lib/num";

type Skin = {
  id: number;
  name: string;
  slug?: string | null;
  weaponSlug?: string | null;
  imageUrl?: string | null;
  itemimage?: string | null;
  marketPrice?: number | null;
  weaponType?: string;
  rarity?: string;
  wear?: string;
  lastPriceUpdate?: string;
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
  activeFilter?: { type: string; value: string; values?: string[] } | null;
};

export default function PortfolioTable({ skins, watchlist = [], onDataChange, activeFilter }: Props) {
  // EIN State für alle Accordions – merkt sich, welches Skin-Accordion offen ist:
  const [openSkinId, setOpenSkinId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"performance" | "recent" | "default" | "name" | "weight">("default");

  // Persistent sorting with localStorage
  useEffect(() => {
    const savedSort = localStorage.getItem('portfolio-sort');
    if (savedSort && ['performance', 'recent', 'name', 'weight'].includes(savedSort)) {
      setSortBy(savedSort as any);
    }
  }, []);

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    localStorage.setItem('portfolio-sort', newSort);
  };

  // Filtered & Sorted Skins - ensure skins is an array
  let filteredSkins = Array.isArray(skins) ? skins : [];

  // Apply allocation filter
  if (activeFilter && activeFilter.value !== "Others") {
    filteredSkins = filteredSkins.filter((entry) => {
      if (activeFilter.type === "weaponType") {
        return entry.skin.weaponType === activeFilter.value;
      } else if (activeFilter.type === "rarity") {
        return entry.skin.rarity === activeFilter.value;
      } else if (activeFilter.type === "wear") {
        return entry.skin.wear === activeFilter.value;
      }
      return true;
    });
  } else if (activeFilter && activeFilter.value === "Others" && activeFilter.values) {
    // Filter for "Others" segment
    filteredSkins = filteredSkins.filter((entry) => {
      let entryValue = "Unknown";
      if (activeFilter.type === "weaponType") {
        entryValue = entry.skin.weaponType || "Unknown";
      } else if (activeFilter.type === "rarity") {
        entryValue = entry.skin.rarity || "Unknown";
      } else if (activeFilter.type === "wear") {
        entryValue = entry.skin.wear || "Unknown";
      }
      return activeFilter.values!.includes(entryValue);
    });
  }

  // Name-Filter
  if (search.trim() !== "") {
    filteredSkins = filteredSkins.filter((entry) =>
      safeIncludes(entry.skin.name, search.trim())
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
  } else if (sortBy === "weight") {
    // Sort by position weight (value contribution)
    filteredSkins = [...filteredSkins].sort((a, b) => {
      const weightA = (a.avgPrice * a.amount) || 0;
      const weightB = (b.avgPrice * b.amount) || 0;
      return weightB - weightA;
    });
  } else if (sortBy === "name") {
    // Sort alphabetically by name
    filteredSkins = [...filteredSkins].sort((a, b) => 
      safeLocaleCompare(a.skin.name, b.skin.name)
    );
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
          Add your first CS2 skin to start tracking your portfolio's value and performance over time.
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

  // Filtered empty state
  if (filteredSkins.length === 0 && (activeFilter || search.trim() !== "")) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <svg width="72" height="72" fill="none" viewBox="0 0 24 24" className="mb-4 opacity-70">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <h2 className="text-2xl font-semibold mb-2">No holdings for this filter</h2>
        <p className="mb-4 text-center max-w-xs">
          {activeFilter 
            ? `No portfolio items match "${activeFilter.type}: ${activeFilter.value}"`
            : `No portfolio items match "${search}"`
          }
        </p>
        <button
          className="btn-main"
          onClick={() => {
            setSearch("");
            // Clear filter by calling onDataChange (parent will handle)
            onDataChange();
          }}
        >
          Clear Filter
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="portfolio-table">
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
          onChange={(e) => handleSortChange(e.target.value as any)}
          className="input-main"
        >
          <option value="default">Sort by...</option>
          <option value="name">Name (A-Z)</option>
          <option value="performance">Best performance</option>
          <option value="recent">Most recent buy</option>
          <option value="weight">Position weight</option>
        </select>
      </div>

      {/* Active Filter Display */}
      {activeFilter && (
        <div className="mb-4 p-3 bg-emerald-600/20 border border-emerald-600/40 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 text-sm">
              Filtered by: <strong>{activeFilter.type === "weaponType" ? "Weapon Type" : activeFilter.type === "rarity" ? "Rarity" : "Wear"}: {activeFilter.value}</strong>
            </span>
            <span className="text-emerald-400 text-xs">
              {filteredSkins.length} of {skins.length} items
            </span>
          </div>
        </div>
      )}

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
        // Bildfelder priorisieren: itemimage -> imageUrl -> placeholder
        const img =
          entry.skin.itemimage ||
          entry.skin.imageUrl ||
          "/images/placeholder-skin.png";

        return (
          <div
            key={entry.skin.id}
            className={`bg-zinc-900 rounded-xl shadow transition-all duration-300 border-2 ${isOpen ? "border-blue-500" : "border-transparent"}`}
          >
            {/* Klickbarer Header */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${entry.skin.name} details`}
              className="flex flex-wrap sm:flex-nowrap justify-between items-center cursor-pointer p-4 gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
              onClick={() => setOpenSkinId(isOpen ? null : entry.skin.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenSkinId(isOpen ? null : entry.skin.id);
                }
              }}
            >
              <div className="flex gap-4 items-center min-w-0 flex-1">
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
                    {(() => {
                      const href = skinDetailHref(entry.skin);
                      return href ? (
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()} // Verhindert Accordion-Toggle
                          className="hover:text-purple-400 transition-colors"
                        >
                          {entry.skin.name}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          tabIndex={-1}
                          className="cursor-default text-zinc-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.skin.name}
                        </span>
                      );
                    })()}
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
                  
                  {/* Stale Price Warning */}
                  {entry.skin.lastPriceUpdate && (
                    (() => {
                      try {
                        const lastUpdate = new Date(entry.skin.lastPriceUpdate);
                        const now = new Date();
                        const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
                        const isStale = diffHours > 48;
                        
                        return isStale ? (
                          <Tooltip content={`Last price update: ${lastUpdate.toLocaleString()}`}>
                            <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Stale</span>
                            </div>
                          </Tooltip>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()
                  )}
                </div>
              </div>
              {/* Stats-Block — wraps under the title on phones so nothing overflows */}
              <div className="flex flex-wrap gap-3 sm:gap-6 items-center w-full sm:w-auto justify-end">
                <div>
                  <span className="text-zinc-400 text-xs">Avg. Buy</span>
                  <div className="font-mono">
                    {typeof entry.avgPrice === "number"
                      ? formatEUR(entry.avgPrice)
                      : "-"}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">Market</span>
                  <div className="font-mono">
                    {typeof entry.skin.marketPrice === "number"
                      ? formatEUR(entry.skin.marketPrice)
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
