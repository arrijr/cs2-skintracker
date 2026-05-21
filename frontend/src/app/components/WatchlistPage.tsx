"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  getWatchlist,
  updatePriceAlert as apiUpdatePriceAlert,
  removeFromWatchlist as apiRemoveFromWatchlist,
  fetchJson,
  apiUrl,
} from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyTarget } from "@/components/ui/empty-illustrations";
import { Eye } from "lucide-react";
import { WatchlistCard, WatchlistEmptySlot } from "@/app/watchlist/_components/WatchlistCard";

type WatchlistItem = {
  id: number;
  skinId: number;
  priceAlert?: number | null;
  createdAt: string;
  skin: {
    id: number;
    name: string;
    slug?: string | null;
    weaponSlug?: string | null;
    itemimage?: string;
    itemImage?: string;
    image_url?: string;
    imageUrl?: string;
    market_hash_name?: string;
    marketHashName?: string;
  };
};

export default function WatchlistPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // {/* Redirect to sign-in if not authenticated */}
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // {/* Load Watchlist */}
  async function load() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      const data = await fetchJson(apiUrl("/api/v1/watchlist"), {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      setItems(Array.isArray(data) ? (data as WatchlistItem[]) : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  // {/* Update Price Alert (onBlur oder Clear) */}
  async function handleUpdateAlert(skinId: number, value: string) {
    if (!user) return;
    const priceAlert = value === "" ? null : Number(value);
    setUpdatingId(skinId);
    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      await fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), {
        method: "PATCH",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ priceAlert }),
      });
      setItems((prev) =>
        prev.map((it) => (it.skinId === skinId ? { ...it, priceAlert } : it))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to update alert");
    } finally {
      setUpdatingId(null);
    }
  }

  // {/* Remove Skin from Watchlist */}
  async function handleRemove(skinId: number) {
    if (!user) return;
    setUpdatingId(skinId);
    try {
      // Get JWT token for authentication
      const token = await getToken({ template: "backend" });
      
      await fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      setItems((prev) => prev.filter((it) => it.skinId !== skinId));
    } catch (err: any) {
      setError(err?.message || "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  }

  // {/* UI */}
  // Show loading state until Clerk auth is loaded and data is loaded
  if (!isLoaded || loading) {
    return (
      <AppShell eyebrow="Tracking" title="Watchlist" maxWidth="5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-40 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse" />)}
        </div>
      </AppShell>
    );
  }

  // If not authenticated, the redirect will happen in useEffect
  if (!user) {
    return (
      <AppShell eyebrow="Tracking" title="Watchlist" maxWidth="5xl">
        <p className="text-slate-300">Redirecting…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Tracking"
      title="Watchlist"
      description="Skins you're keeping an eye on."
      maxWidth="5xl"
      actions={<span className="text-sm text-slate-400">Max. 5 items on free plan</span>}
    >
      {/* Error Alert */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <EmptyState
          illustration={<EmptyTarget size={120} />}
          title="No skins in your watchlist yet"
          description="Add skins to track price movements and get alerts when targets are hit."
          primaryCta={{ label: 'Browse skins', href: '/skins' }}
        />
      )}

      {/* Watchlist Items Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const img =
              it.skin.itemimage ||
              it.skin.itemImage ||
              it.skin.image_url ||
              it.skin.imageUrl ||
              null;
            const rar = (it.skin as any).rarity ?? null;
            const wear = (it.skin as any).wear ?? null;
            const cur = (it.skin as any).marketPrice ?? (it.skin as any).priceLatest ?? null;
            const target = typeof it.priceAlert === "number" ? it.priceAlert : null;
            const type = target && cur ? (cur < target ? "sell" : "buy") : "watch";
            const delta = (it.skin as any).priceChange24h ?? 0;
            return (
              <WatchlistCard
                key={`${it.id}-${it.skinId}`}
                skinId={it.skinId}
                slug={it.skin.slug ?? null}
                weaponSlug={it.skin.weaponSlug ?? null}
                name={it.skin.name}
                imageUrl={img}
                rarity={rar}
                wear={wear}
                currentPrice={cur}
                delta={delta}
                targetPrice={target}
                type={type as "buy" | "sell" | "watch"}
                onSetAlert={() => {
                  const next = prompt("Set target price (€)", target?.toString() ?? "");
                  if (next !== null) handleUpdateAlert(it.skinId, next);
                }}
              />
            );
          })}
          <WatchlistEmptySlot />
        </div>
      )}
    </AppShell>
  );
}
