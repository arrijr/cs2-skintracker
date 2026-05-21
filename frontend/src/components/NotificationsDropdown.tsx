"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Bell, Check, AlertTriangle, TrendingUp, TrendingDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl, fetchJson } from "@/lib/api";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { useAuth, useUser } from "@clerk/nextjs";

interface Notification {
  id: string;
  kind: "alert_fired" | "price_up" | "price_down" | "system";
  title: string;
  body: string;
  href?: string;
  ts: string; // ISO
  read?: boolean;
}

const KIND_STYLES = {
  alert_fired: { icon: Bell, color: "text-purple-300", bg: "bg-purple-500/15", border: "border-purple-500/30" },
  price_up: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  price_down: { icon: TrendingDown, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  system: { icon: Package, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30" },
} as const;

function timeAgo(iso: string): string {
  const sec = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

interface NotificationsDropdownProps {
  notifications?: Notification[];
  onMarkAllRead?: () => void;
}

export function NotificationsDropdown(props: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Live fetch only when caller didn't pass explicit notifications (Storybook/tests).
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { authenticatedFetcher } = useAuthenticatedApi();
  const shouldFetch = props.notifications === undefined && isSignedIn;
  const { data, mutate } = useSWR(
    shouldFetch ? apiUrl('/api/v1/notifications') : null,
    authenticatedFetcher,
    { refreshInterval: 60_000, revalidateOnFocus: false }
  );

  const fetched: Notification[] = (data as any)?.items ?? (Array.isArray(data) ? (data as any) : []);
  const notifications: Notification[] = props.notifications ?? fetched;

  const onMarkAllRead = props.onMarkAllRead ?? (async () => {
    try {
      const token = await getToken({ template: 'backend' });
      await fetchJson(apiUrl('/api/v1/notifications/mark-all-read'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      // ignore — no-op endpoint
    }
    mutate();
  });

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-11 h-11 sm:w-9 sm:h-9 rounded-[9px] bg-slate-900/70 border border-slate-700/40 inline-flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600/60 transition-colors focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-slate-950"
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(340px,calc(100vw-1rem))] bg-slate-900/95 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={() => {
                  onMarkAllRead?.();
                  setOpen(false);
                }}
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="h-8 w-8 text-slate-700 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-300">No new notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">Alerts and price events will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-700/30">
                {notifications.map((n) => {
                  const s = KIND_STYLES[n.kind];
                  const Icon = s.icon;
                  const body = (
                    <div className={cn("flex items-start gap-3 px-4 py-3 transition-colors", !n.read && "bg-purple-500/[0.03]")}>
                      <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border", s.bg, s.border, s.color)}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-white truncate">{n.title}</div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{n.body}</p>
                        <p className="text-[10.5px] text-slate-600 mt-1 font-mono">{timeAgo(n.ts)}</p>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" aria-label="Unread" />}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link href={n.href} className="block hover:bg-slate-800/40 transition-colors" onClick={() => setOpen(false)}>
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/alerts"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-semibold text-purple-300 hover:text-purple-200 hover:bg-slate-800/40 border-t border-slate-700/40 transition-colors"
          >
            View all alerts →
          </Link>
        </div>
      )}
    </div>
  );
}

// SAMPLE fixtures removed — feed now sourced from /api/v1/notifications.
// Storybook / tests can still pass an explicit `notifications` prop to bypass the network.
