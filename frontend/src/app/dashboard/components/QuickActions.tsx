"use client";
import Link from "next/link";
import { Plus, Bell, Link2, RefreshCw, Eye, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  steamConnected?: boolean;
  isPremium?: boolean;
  onRefresh?: () => void;
  lastSyncLabel?: string | null;
  className?: string;
}

/**
 * Primary action strip — Add skin + Connect Steam grouped in tinted container;
 * Set alert + Watchlist secondary; Upgrade gold; Refresh ghost right-aligned.
 * Adapted from dashboard-hifi.html cta-row.
 */
export function QuickActions({ steamConnected, isPremium, onRefresh, lastSyncLabel, className }: QuickActionsProps) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-2.5", className)} aria-label="Quick actions">
      {/* Primary group — tinted purple container */}
      <div
        className="inline-flex gap-2 p-1.5 rounded-[14px] border"
        style={{ background: "rgba(168,85,247,0.05)", borderColor: "rgba(168,85,247,0.18)" }}
      >
        <Button
          asChild
          className="bg-gradient-to-br from-purple-500 to-pink-500 hover:opacity-90 text-white gap-2 px-4 min-h-[40px] shadow-none"
        >
          <Link href="/skins">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add skin
          </Link>
        </Button>
        {!steamConnected && (
          <Button
            asChild
            variant="outline"
            className="border-emerald-500/35 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300 gap-2 px-4 min-h-[40px]"
          >
            <Link href="/account">
              <Link2 className="h-4 w-4" aria-hidden="true" /> Connect Steam
            </Link>
          </Button>
        )}
      </div>

      {/* Secondary actions */}
      <Button
        asChild
        variant="outline"
        className="border-slate-700/40 bg-slate-900/70 text-slate-300 hover:text-white gap-2 px-4 min-h-[40px]"
      >
        <Link href="/alerts">
          <Bell className="h-4 w-4" aria-hidden="true" /> Set alert
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className="border-slate-700/40 bg-slate-900/70 text-slate-300 hover:text-white gap-2 px-4 min-h-[40px]"
      >
        <Link href="/watchlist">
          <Eye className="h-4 w-4" aria-hidden="true" /> Watchlist
        </Link>
      </Button>

      {/* Gold upgrade */}
      {!isPremium && (
        <Button
          asChild
          variant="outline"
          className="border-amber-500/32 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 hover:text-amber-200 gap-2 px-4 min-h-[40px]"
        >
          <Link href="/pricing">
            <Crown className="h-4 w-4" aria-hidden="true" /> Upgrade
          </Link>
        </Button>
      )}

      {/* Spacer + refresh ghost */}
      <div className="flex-1" />
      {onRefresh && (
        <Button
          variant="ghost"
          onClick={onRefresh}
          className="text-slate-400 hover:text-white gap-2 px-3 min-h-[40px]"
          aria-label="Refresh portfolio data"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>Refresh</span>
          {lastSyncLabel && (
            <span className="text-slate-600 font-medium ml-1">· {lastSyncLabel}</span>
          )}
        </Button>
      )}
    </nav>
  );
}
