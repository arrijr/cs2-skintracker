// /frontend/src/app/skins/_components/EnhancedFilterSidebar.tsx — [Frontend]
// Hi-fi filter sidebar. One rounded-2xl card with sections separated by hairline dividers.
// All chips/toggles use design-system tokens. Wear + Rarity are multi-select (comma-separated).
"use client";
import { Search, X, Save, Share2, Star, Sparkles, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EnhancedFilterSidebarProps {
  filters: {
    q: string;
    min: string;
    max: string;
    rarity: string;
    wear: string;
    quality: string;
    stattrak: boolean;
    special: boolean;
    sort: string;
    category?: string;
    weaponType: string;
    collection: string;
    finish: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  onSavePreset?: () => void;
  onShareFilters?: () => void;
  className?: string;
}

const WEAR_OPTIONS: Array<{ id: string; name: string; full: string; hex: string }> = [
  { id: "fn", name: "FN", full: "Factory New", hex: "#34d399" },
  { id: "mw", name: "MW", full: "Minimal Wear", hex: "#c8e64c" },
  { id: "ft", name: "FT", full: "Field-Tested", hex: "#f5b948" },
  { id: "ww", name: "WW", full: "Well-Worn", hex: "#ec8c0e" },
  { id: "bs", name: "BS", full: "Battle-Scarred", hex: "#eb4b4b" },
];

const RARITY_OPTIONS: Array<{ id: string; label: string; hex: string }> = [
  { id: "consumer", label: "Consumer", hex: "#b0c3d9" },
  { id: "industrial", label: "Industrial", hex: "#5e98d9" },
  { id: "mil-spec", label: "Mil-Spec", hex: "#4b69ff" },
  { id: "restricted", label: "Restricted", hex: "#8847ff" },
  { id: "classified", label: "Classified", hex: "#d32ce6" },
  { id: "covert", label: "Covert", hex: "#eb4b4b" },
  { id: "extraordinary", label: "★ Extraordinary", hex: "#ffd700" },
];

const PRESETS = [
  { label: "Under €5", min: "", max: "5", sort: "price_asc" },
  { label: "€25–€100", min: "25", max: "100", sort: "price_asc" },
  { label: "€100–€500", min: "100", max: "500", sort: "price_desc" },
  { label: "High value €500+", min: "500", max: "", sort: "price_desc" },
] as const;

/** Helper — parse comma-separated multi-select value into Set. */
function parseMulti(v: string): Set<string> {
  if (!v) return new Set();
  return new Set(v.split(",").map((s) => s.trim()).filter(Boolean));
}
/** Helper — serialize Set back to comma-separated value. */
function serializeMulti(s: Set<string>): string {
  return Array.from(s).join(",");
}

export function EnhancedFilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  onSavePreset,
  onShareFilters,
  className = "",
}: EnhancedFilterSidebarProps) {
  const wears = parseMulti(filters.wear);
  const rarities = parseMulti(filters.rarity);

  const toggleWear = (id: string) => {
    const next = new Set(wears);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFilterChange("wear", serializeMulti(next));
  };
  const toggleRarity = (id: string) => {
    const next = new Set(rarities);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFilterChange("rarity", serializeMulti(next));
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    const isActive = filters.min === p.min && filters.max === p.max;
    if (isActive) {
      onFilterChange("min", "");
      onFilterChange("max", "");
    } else {
      onFilterChange("min", p.min);
      onFilterChange("max", p.max);
      onFilterChange("sort", p.sort);
    }
  };

  const activeFilterCount =
    (filters.q ? 1 : 0) +
    (filters.min || filters.max ? 1 : 0) +
    wears.size +
    rarities.size +
    (filters.stattrak ? 1 : 0) +
    (filters.special ? 1 : 0);

  return (
    <div
      data-testid="enhanced-filter-sidebar"
      className={cn(
        "bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl divide-y divide-slate-700/30",
        className
      )}
    >
      {/* HEADER */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-white">Filters</h2>
          {activeFilterCount > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-mono tabular-nums text-purple-300">{activeFilterCount}</span> active
            </p>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {/* SEARCH */}
      <Section eyebrow="Search">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500"
            aria-hidden="true"
          />
          <Input
            data-testid="skin-search-input"
            placeholder="Search by name…"
            value={filters.q}
            onChange={(e) => onFilterChange("q", e.target.value)}
            className="pl-9 bg-slate-900/70 border-slate-700/40 text-white placeholder:text-slate-600 focus-visible:ring-purple-400/40"
          />
          {filters.q && (
            <button
              onClick={() => onFilterChange("q", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Section>

      {/* PRICE PRESETS */}
      <Section eyebrow="Quick presets">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => {
            const active = filters.min === p.min && filters.max === p.max;
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                aria-pressed={active}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all border",
                  active
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-[0_8px_20px_-8px_rgba(168,85,247,0.55)]"
                    : "bg-slate-900/40 border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-600/60"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* PRICE RANGE */}
      <Section eyebrow="Price range (€)">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1 block">Min</label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={filters.min}
              onChange={(e) => onFilterChange("min", e.target.value)}
              className="bg-slate-900/70 border-slate-700/40 text-white font-mono tabular-nums focus-visible:ring-purple-400/40"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1 block">Max</label>
            <Input
              type="number"
              min={0}
              placeholder="5000"
              value={filters.max}
              onChange={(e) => onFilterChange("max", e.target.value)}
              className="bg-slate-900/70 border-slate-700/40 text-white font-mono tabular-nums focus-visible:ring-purple-400/40"
            />
          </div>
        </div>
      </Section>

      {/* WEAR (multi-select) */}
      <Section eyebrow="Wear">
        <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
          Wear filter currently limited to skins with wear-specific variants in our catalog.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {WEAR_OPTIONS.map((w) => {
            const active = wears.has(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggleWear(w.id)}
                aria-pressed={active}
                aria-label={w.full}
                title={w.full}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border inline-flex items-center gap-1.5",
                  active
                    ? "text-white"
                    : "bg-slate-900/40 border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-600/60"
                )}
                style={
                  active
                    ? { background: `${w.hex}1c`, borderColor: `${w.hex}70`, color: w.hex }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: w.hex }}
                  aria-hidden="true"
                />
                {w.name}
              </button>
            );
          })}
        </div>
      </Section>

      {/* RARITY (multi-select) */}
      <Section eyebrow="Rarity">
        <div className="flex flex-wrap gap-1.5">
          {RARITY_OPTIONS.map((r) => {
            const active = rarities.has(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleRarity(r.id)}
                aria-pressed={active}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border inline-flex items-center gap-1.5",
                  active
                    ? "text-white"
                    : "bg-slate-900/40 border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-600/60"
                )}
                style={
                  active
                    ? { background: `${r.hex}1c`, borderColor: `${r.hex}70`, color: r.hex }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: r.hex }}
                  aria-hidden="true"
                />
                {r.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* SPECIAL TOGGLES */}
      <Section eyebrow="Variant">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onFilterChange("stattrak", !filters.stattrak)}
            aria-pressed={filters.stattrak}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-[0.1em] transition-all border inline-flex items-center justify-center gap-1.5",
              filters.stattrak
                ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                : "bg-slate-900/40 border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600/60"
            )}
          >
            <Star className={cn("h-3 w-3", filters.stattrak && "fill-current")} aria-hidden="true" />
            StatTrak™
          </button>
          <button
            onClick={() => onFilterChange("special", !filters.special)}
            aria-pressed={filters.special}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-[0.1em] transition-all border inline-flex items-center justify-center gap-1.5",
              filters.special
                ? "bg-purple-500/15 border-purple-500/50 text-purple-300"
                : "bg-slate-900/40 border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600/60"
            )}
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Special
          </button>
        </div>
      </Section>

      {/* FOOTER ACTIONS */}
      {(onSavePreset || onShareFilters) && (
        <div className="px-5 py-3 flex gap-2">
          {onSavePreset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSavePreset}
              className="flex-1 border-slate-700/40 text-slate-300 hover:text-white gap-1.5 text-xs"
            >
              <Save className="h-3 w-3" aria-hidden="true" />
              Save
            </Button>
          )}
          {onShareFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShareFilters}
              className="flex-1 border-slate-700/40 text-slate-300 hover:text-white gap-1.5 text-xs"
            >
              <Share2 className="h-3 w-3" aria-hidden="true" />
              Share
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2.5">
        {eyebrow}
      </h3>
      {children}
    </div>
  );
}
