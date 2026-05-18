"use client";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Search, ArrowRight, Bell, BarChart3, Crown, Crosshair, Package, Eye, User, Sparkles, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl, swrFetcher } from "@/lib/api";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: typeof Search;
  group: "navigate" | "actions" | "skins";
  keywords?: string[];
}

const STATIC_COMMANDS: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", description: "Portfolio overview", href: "/dashboard", icon: BarChart3, group: "navigate", keywords: ["home"] },
  { id: "nav-portfolio", label: "Portfolio", description: "Your holdings", href: "/portfolio", icon: Crosshair, group: "navigate" },
  { id: "nav-watchlist", label: "Watchlist", description: "Tracked skins", href: "/watchlist", icon: Eye, group: "navigate" },
  { id: "nav-alerts", label: "Alerts", description: "Price triggers", href: "/alerts", icon: Bell, group: "navigate", keywords: ["notify", "notification"] },
  { id: "nav-skins", label: "Skins catalog", description: "Browse weapon skins", href: "/skins", icon: Package, group: "navigate", keywords: ["browse", "weapon"] },
  { id: "nav-items", label: "Items catalog", description: "Stickers, agents, patches", href: "/items", icon: Sparkles, group: "navigate" },
  { id: "nav-cases", label: "Cases", description: "All CS2 cases", href: "/cases", icon: Package, group: "navigate" },
  { id: "nav-account", label: "Account & Steam", description: "Connect Steam, settings", href: "/account", icon: User, group: "navigate", keywords: ["steam", "settings"] },
  { id: "nav-pricing", label: "Upgrade to Pro", description: "Pricing plans", href: "/pricing", icon: Crown, group: "navigate", keywords: ["pro", "premium", "plan"] },
  { id: "act-add", label: "Add skin to portfolio", description: "Browse catalog", href: "/skins", icon: Package, group: "actions" },
  { id: "act-alert", label: "Set a new alert", description: "Create price trigger", href: "/alerts", icon: Bell, group: "actions" },
  { id: "act-import", label: "Import Steam inventory", description: "Connect Steam account", href: "/account", icon: Sparkles, group: "actions", keywords: ["steam", "import"] },
];

const GROUP_LABELS: Record<CommandItem["group"], string> = {
  navigate: "Navigation",
  actions: "Quick actions",
  skins: "Skins",
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Live skin search via API (debounced via SWR dedupingInterval). Trigger >=2 chars.
  const trimmedQ = q.trim();
  const skinsKey = trimmedQ.length >= 2
    ? apiUrl(`/api/v1/skins?q=${encodeURIComponent(trimmedQ)}&pageSize=8&page=1`)
    : null;
  const { data: skinsResp } = useSWR(skinsKey, swrFetcher, {
    dedupingInterval: 300,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const skinItems: CommandItem[] = useMemo(() => {
    const items =
      (skinsResp as any)?.items ?? (skinsResp as any)?.data ?? (Array.isArray(skinsResp) ? skinsResp : []);
    return (items as any[]).map((s: any) => {
      const price = typeof s.priceMedian === 'number' ? s.priceMedian : null;
      const desc = s.rarity
        ? `${s.rarity}${price !== null ? ` · €${price.toFixed(2)}` : ''}`
        : (price !== null ? `€${price.toFixed(2)}` : undefined);
      return {
        id: `skin-${s.id}`,
        label: s.name ?? s.marketHashName ?? `Skin ${s.id}`,
        description: desc,
        href: `/skins/${s.id}`,
        icon: ImageIcon,
        group: 'skins' as const,
      };
    });
  }, [skinsResp]);

  // Fuzzy filter
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const staticFiltered = !query
      ? STATIC_COMMANDS
      : STATIC_COMMANDS.filter((c) => {
          const haystack = (c.label + " " + (c.description ?? "") + " " + (c.keywords ?? []).join(" ")).toLowerCase();
          return query.split(/\s+/).every((tok) => haystack.includes(tok));
        });
    // Append live skin results at the bottom (rendered under "Skins" group label).
    return [...staticFiltered, ...skinItems];
  }, [q, skinItems]);

  const grouped = useMemo(() => {
    const out: Record<string, CommandItem[]> = {};
    filtered.forEach((c) => {
      out[c.group] = out[c.group] ?? [];
      out[c.group].push(c);
    });
    return out;
  }, [filtered]);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Clamp active to results length
  useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);

  const onSelect = useCallback(
    (item: CommandItem) => {
      onOpenChange(false);
      router.push(item.href);
    },
    [onOpenChange, router]
  );

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) onSelect(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  // Scroll active into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!open) return null;

  let runningIndex = -1;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/40">
          <Search className="h-4 w-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a command, page or skin name…"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-sm"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search commands"
          />
          <kbd className="text-[10.5px] text-slate-500 font-mono bg-slate-800/60 border border-slate-700/40 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No matches. Try a different query.
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2 last:mb-0">
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  {GROUP_LABELS[group as CommandItem["group"]]}
                </div>
                {items.map((c) => {
                  runningIndex++;
                  const isActive = runningIndex === active;
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      data-idx={runningIndex}
                      onClick={() => onSelect(c)}
                      onMouseEnter={() => setActive(runningIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group",
                        isActive ? "bg-purple-500/10" : "hover:bg-slate-800/40"
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
                          isActive
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                            : "bg-slate-800/60 border-slate-700/40 text-slate-400"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{c.label}</div>
                        {c.description && (
                          <div className="text-xs text-slate-500 truncate">{c.description}</div>
                        )}
                      </div>
                      {isActive && <ArrowRight className="h-3.5 w-3.5 text-purple-300" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-700/40 bg-slate-900/60 text-[10.5px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-800/60 border border-slate-700/40 px-1 py-0.5 rounded">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-800/60 border border-slate-700/40 px-1 py-0.5 rounded">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="bg-slate-800/60 border border-slate-700/40 px-1 py-0.5 rounded">⌘K</kbd>
            anywhere
          </span>
        </div>
      </div>
    </div>
  );
}

/** Global hook: opens palette on ⌘K / Ctrl+K. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
