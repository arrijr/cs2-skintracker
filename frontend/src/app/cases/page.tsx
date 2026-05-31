// /frontend/src/app/cases/page.tsx — [Frontend]
// {/* Case browser — category tabs + responsive card grid. */}
"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, TrendingUp, TrendingDown, Package, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { caseToSlug } from "@/lib/strings";
import { formatEUR } from "@/lib/num";
import { AppShell } from "@/components/layout/AppShell";

interface Case {
  id: number;
  name: string;
  imageUrl?: string;
  price: number | null;
  marketCap: number | null;
  remaining: number | null;
  dropped: number | null;
  unboxed: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  isDiscontinued: boolean;
  releaseDate: string | null;
  lastUpdated: string | null;
  timeToExtinction?: number | null;
}

type Category = "cases" | "stickers" | "souvenirs" | "autographs" | "music";
type SortKey = "price-desc" | "price-asc" | "change-desc" | "change-asc" | "name-asc";

const PER_PAGE = 24;

const TAB_LABELS: Record<Category, string> = {
  cases: "Weapon Cases",
  stickers: "Stickers",
  souvenirs: "Souvenirs",
  autographs: "Autographs",
  music: "Music Kits",
};

// Buckets a case into one of 5 high-level CS2 collectible categories. Order
// matters here — "Sticker Capsule" must match BEFORE the generic "Case"
// fallback, otherwise tournament sticker capsules end up in Weapon Cases.
// Logic mirrors how Valve groups items in the Steam Market sidebar.
function classify(name: string): Category {
  if (/Souvenir/i.test(name)) return "souvenirs";
  if (/Autograph Capsule/i.test(name)) return "autographs";
  if (/Sticker|Patch Pack|Graffiti/i.test(name)) return "stickers";
  if (/Music Kit/i.test(name)) return "music";
  return "cases";
}

function PriceChangeBadge({ change }: { change: number | null }) {
  if (change == null || !Number.isFinite(change)) {
    return <span className="text-xs text-slate-500">—</span>;
  }
  const positive = change > 0;
  const cls = positive
    ? "text-emerald-400"
    : change < 0
    ? "text-red-400"
    : "text-slate-400";
  return (
    <div className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      {positive ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : null}
      <span>
        {positive ? "+" : ""}
        {change.toFixed(2)}%
      </span>
    </div>
  );
}

function CaseCard({ c, inPortfolio }: { c: Case; inPortfolio: boolean }) {
  return (
    <Link
      href={`/cases/${caseToSlug(c.name)}`}
      className="group relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      {/* Badges row top-right */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1 z-10">
        {inPortfolio && (
          <Badge className="bg-emerald-600/90 text-white text-[10px]">In Portfolio</Badge>
        )}
        {c.isDiscontinued && (
          <Badge variant="outline" className="border-amber-700/70 bg-amber-900/30 text-amber-300 text-[10px]">
            Discontinued
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-950/60">
        {c.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.imageUrl}
            alt={c.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-3 transition group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-slate-600">
            <Package className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Name + price */}
      <div className="mt-3 flex-1 min-h-[3.5rem]">
        <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-purple-400 transition-colors">
          {c.name}
        </h3>
      </div>

      <div className="mt-2 flex items-end justify-between border-t border-slate-800/60 pt-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Price</div>
          <div className="text-lg font-bold text-slate-100">
            {c.price != null && Number.isFinite(c.price) ? formatEUR(c.price) : "—"}
          </div>
        </div>
        <PriceChangeBadge change={c.priceChange24h} />
      </div>
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  // Show first, last, current, and ±1 around current.
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items: (number | "...")[] = [];
  let last = 0;
  for (const p of sorted) {
    if (last && p - last > 1) items.push("...");
    items.push(p);
    last = p;
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ←
      </Button>
      {items.map((it, idx) =>
        it === "..." ? (
          <span key={`dot-${idx}`} className="text-slate-500">
            …
          </span>
        ) : (
          <Button
            key={it}
            variant={it === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPage(it)}
            className={it === page ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {it}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        →
      </Button>
    </div>
  );
}

// Outer wrapper exists purely to give `useSearchParams` a Suspense boundary
// per Next.js 15 App Router rules — otherwise the prerender step warns about
// async search-param reads. The actual page lives in CasesPageInner below.
export default function CasesPage() {
  return (
    <Suspense fallback={
      <AppShell eyebrow="Catalog" title="CS2 Cases" description="Loading…" maxWidth="7xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    }>
      <CasesPageInner />
    </Suspense>
  );
}

function CasesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCasePortfolio, setUserCasePortfolio] = useState<number[]>([]);

  // URL-synced UI state so deep-links and the back-button work.
  const tab = (searchParams.get("tab") as Category) || "cases";
  const page = Number(searchParams.get("page") || 1);
  const sort = (searchParams.get("sort") as SortKey) || "price-desc";
  const search = searchParams.get("q") || "";

  function updateQuery(patch: Record<string, string | number | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "" || v === 1 || v === "1") next.delete(k);
      else next.set(k, String(v));
    }
    router.replace(`/cases${next.toString() ? `?${next}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        // Pull a big page — backend's pagination caps at 100 per request but
        // we want ALL 478 cases in memory so client-side category tabs and
        // pagination feel instant. The /api/v1/cases endpoint accepts a
        // higher `limit` parameter.
        const data = (await apiFetch("/api/v1/cases?limit=600")) as { cases?: Case[] };
        if (!ac.signal.aborted) setCases(data.cases || []);
      } catch (err) {
        if (!ac.signal.aborted) setError("Failed to load cases data");
        console.error("Error fetching cases:", err);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const { isSignedIn, getToken } = useAuth();
  useEffect(() => {
    if (!isSignedIn) {
      setUserCasePortfolio([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: "backend" });
        const data = (await apiFetch("/api/v1/case-portfolio", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })) as { portfolio?: { case?: { id?: number } }[] };
        if (cancelled) return;
        const caseIds = (data?.portfolio || [])
          .map((entry) => entry?.case?.id)
          .filter((id): id is number => typeof id === "number");
        setUserCasePortfolio(caseIds);
      } catch {
        /* silent — non-critical highlight */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  // Group cases per category once. Cheap pass over the in-memory list.
  const byCategory = useMemo(() => {
    const groups: Record<Category, Case[]> = {
      cases: [],
      stickers: [],
      souvenirs: [],
      autographs: [],
      music: [],
    };
    for (const c of cases) groups[classify(c.name)].push(c);
    return groups;
  }, [cases]);

  const counts: Record<Category, number> = useMemo(
    () => ({
      cases: byCategory.cases.length,
      stickers: byCategory.stickers.length,
      souvenirs: byCategory.souvenirs.length,
      autographs: byCategory.autographs.length,
      music: byCategory.music.length,
    }),
    [byCategory],
  );

  // Active-tab list — filtered by search, sorted by selected key.
  const filteredSorted = useMemo(() => {
    const list = byCategory[tab] || [];
    let out = list;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      out = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    const arr = [...out];
    arr.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case "price-desc":
          return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        case "change-asc":
          return (a.priceChange24h ?? Infinity) - (b.priceChange24h ?? Infinity);
        case "change-desc":
          return (b.priceChange24h ?? -Infinity) - (a.priceChange24h ?? -Infinity);
        case "name-asc":
          return a.name.localeCompare(b.name);
      }
    });
    return arr;
  }, [byCategory, tab, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = filteredSorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  if (loading) {
    return (
      <AppShell eyebrow="Catalog" title="CS2 Cases" description="Loading…" maxWidth="7xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell eyebrow="Catalog" title="CS2 Cases" maxWidth="7xl">
        <div className="rounded-2xl border border-red-500/50 bg-red-900/20 p-6 text-center">
          <div className="text-red-400 mb-2 font-semibold">Error loading cases</div>
          <div className="text-slate-400 text-sm">{error}</div>
        </div>
      </AppShell>
    );
  }

  const orderedTabs: Category[] = ["cases", "stickers", "souvenirs", "autographs", "music"];

  return (
    <AppShell
      eyebrow="Catalog"
      title="CS2 Cases"
      description="Live prices for every CS2 case, sticker capsule, souvenir package, and music kit — sourced from Steam Market and refreshed daily."
      maxWidth="7xl"
    >
      <div>
        {/* Tabs row — scrollable on mobile so all 5 stay reachable */}
        <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            {orderedTabs.map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => updateQuery({ tab: t === "cases" ? null : t, page: null })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30"
                      : "bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {TAB_LABELS[t]}
                  <span className={`ml-2 text-xs ${active ? "text-purple-100" : "text-slate-500"}`}>
                    {counts[t]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + sort row */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              placeholder={`Search ${TAB_LABELS[tab].toLowerCase()}…`}
              value={search}
              onChange={(e) => updateQuery({ q: e.target.value || null, page: null })}
              className="pl-10"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => updateQuery({ sort: v === "price-desc" ? null : v, page: null })}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-desc">Price: high → low</SelectItem>
              <SelectItem value="price-asc">Price: low → high</SelectItem>
              <SelectItem value="change-desc">24h change: highest</SelectItem>
              <SelectItem value="change-asc">24h change: lowest</SelectItem>
              <SelectItem value="name-asc">Name: A → Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-slate-400">
          {filteredSorted.length === 0 ? (
            "No cases match your search."
          ) : (
            <>
              Showing <span className="text-slate-200 font-medium">{(safePage - 1) * PER_PAGE + 1}</span>
              {filteredSorted.length > 1 && (
                <>
                  –<span className="text-slate-200 font-medium">{Math.min(safePage * PER_PAGE, filteredSorted.length)}</span>
                </>
              )}{" "}
              of <span className="text-slate-200 font-medium">{filteredSorted.length}</span> {TAB_LABELS[tab].toLowerCase()}
            </>
          )}
        </div>

        {/* Empty state */}
        {filteredSorted.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-medium text-slate-200 mb-1">No cases found</h3>
            <p className="text-sm text-slate-500">
              {search ? "Try a different search term." : "Nothing in this category yet."}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => updateQuery({ q: null, page: null })}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageItems.map((c) => (
                <CaseCard key={c.id} c={c} inPortfolio={userCasePortfolio.includes(c.id)} />
              ))}
            </div>

            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPage={(p) => updateQuery({ page: p === 1 ? null : p })}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
