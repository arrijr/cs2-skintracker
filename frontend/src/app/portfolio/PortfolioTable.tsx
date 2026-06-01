"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import PortfolioToolbar, { type ToolbarState } from "./_components/PortfolioToolbar";
import PortfolioGroup from "./_components/PortfolioGroup";
import {
  groupPortfolio, filterEntries, weaponGroupKey, NO_PRICE_KEY,
  type PortfolioEntry, type SortKey,
} from "@/lib/portfolio-grouping";

type Props = {
  skins: PortfolioEntry[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- WatchlistEntry shape not imported here; only `.skinId`/`.priceAlert` are read.
  watchlist: any[];
  onDataChange: () => void;
};

const SORT_KEY = "portfolio-sort";
const COLLAPSE_KEY = "portfolio-collapsed";
const HIDE_NOPRICE_KEY = "portfolio-hide-noprice";
const AUTO_COLLAPSE_THRESHOLD = 6; // > this many groups ⇒ start collapsed

export default function PortfolioTable({ skins, watchlist = [], onDataChange }: Props) {
  const [tb, setTb] = useState<ToolbarState>({
    search: "", sortBy: "value", weapon: null, rarity: null, exterior: null, hideNoPrice: false,
  });
  const [openSkinId, setOpenSkinId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Restore persisted prefs.
  useEffect(() => {
    const s = localStorage.getItem(SORT_KEY);
    const valid: SortKey[] = ["value", "performance", "name", "recent"];
    const hide = localStorage.getItem(HIDE_NOPRICE_KEY) === "1";
    let saved: Record<string, boolean> = {};
    try { saved = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "{}"); } catch { /* ignore */ }
    setTb((p) => ({ ...p, sortBy: valid.includes(s as SortKey) ? (s as SortKey) : "value", hideNoPrice: hide }));
    setCollapsed(saved);
  }, []);

  const patch = useCallback((p: Partial<ToolbarState>) => {
    setTb((prev) => {
      const next = { ...prev, ...p };
      if (p.sortBy) localStorage.setItem(SORT_KEY, p.sortBy);
      if (p.hideNoPrice !== undefined) localStorage.setItem(HIDE_NOPRICE_KEY, p.hideNoPrice ? "1" : "0");
      return next;
    });
  }, []);

  const list = useMemo(() => (Array.isArray(skins) ? skins : []), [skins]);

  // Facets for the toolbar are derived from the FULL list (so chips don't vanish as you filter).
  const weapons = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of list) if (typeof e.skin.marketPrice === "number") {
      const k = weaponGroupKey(e.skin); m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  }, [list]);
  const rarities = useMemo(() => [...new Set(list.map((e) => e.skin.rarity).filter(Boolean) as string[])].sort(), [list]);
  const exteriors = useMemo(() => [...new Set(list.map((e) => e.skin.exterior).filter(Boolean) as string[])].sort(), [list]);
  const hasNoPrice = useMemo(() => list.some((e) => typeof e.skin.marketPrice !== "number"), [list]);

  const filtered = useMemo(
    () => filterEntries(list, { search: tb.search, weapon: tb.weapon, rarity: tb.rarity, exterior: tb.exterior }),
    [list, tb.search, tb.weapon, tb.rarity, tb.exterior],
  );
  const { groups, noPriceBucket, maxPositionValue } = useMemo(() => groupPortfolio(filtered, tb.sortBy), [filtered, tb.sortBy]);

  const manyGroups = groups.length > AUTO_COLLAPSE_THRESHOLD;
  const isCollapsed = (key: string) =>
    key in collapsed ? collapsed[key] : (key === NO_PRICE_KEY ? true : manyGroups);

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !(key in prev ? prev[key] : (key === NO_PRICE_KEY ? true : manyGroups)) };
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      return next;
    });

  const alertSkinIds = useMemo(
    () => new Set((watchlist ?? []).filter((w) => w.priceAlert && w.priceAlert > 0).map((w) => w.skinId)),
    [watchlist],
  );

  // Empty: nothing imported at all.
  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <h2 className="text-2xl font-semibold mb-2 text-slate-200">No skins in your portfolio yet</h2>
        <p className="text-center max-w-xs">Connect Steam or add a skin to start tracking value and performance.</p>
      </div>
    );
  }

  const visibleGroups = groups;
  const showBucket = noPriceBucket && !tb.hideNoPrice;
  const nothingMatches = visibleGroups.length === 0 && !showBucket;

  return (
    <div className="flex flex-col" data-testid="portfolio-table">
      <PortfolioToolbar
        state={tb}
        onChange={patch}
        weapons={weapons}
        rarities={rarities}
        exteriors={exteriors}
        hasNoPrice={hasNoPrice}
      />

      {nothingMatches ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <h2 className="text-xl font-semibold mb-2 text-slate-200">No holdings for this filter</h2>
          <button
            className="mt-2 text-sm text-purple-300 hover:text-purple-200"
            onClick={() => patch({ search: "", weapon: null, rarity: null, exterior: null })}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {visibleGroups.map((g) => (
            <PortfolioGroup
              key={g.key}
              group={g}
              collapsed={isCollapsed(g.key)}
              onToggleCollapse={() => toggleCollapse(g.key)}
              maxPositionValue={maxPositionValue}
              openSkinId={openSkinId}
              onToggleSkin={(id) => setOpenSkinId((cur) => (cur === id ? null : id))}
              alertSkinIds={alertSkinIds}
              onDataChange={onDataChange}
            />
          ))}
          {showBucket && (
            <PortfolioGroup
              group={noPriceBucket!}
              collapsed={isCollapsed(NO_PRICE_KEY)}
              onToggleCollapse={() => toggleCollapse(NO_PRICE_KEY)}
              maxPositionValue={maxPositionValue}
              openSkinId={openSkinId}
              onToggleSkin={(id) => setOpenSkinId((cur) => (cur === id ? null : id))}
              alertSkinIds={alertSkinIds}
              onDataChange={onDataChange}
            />
          )}
        </>
      )}
    </div>
  );
}
