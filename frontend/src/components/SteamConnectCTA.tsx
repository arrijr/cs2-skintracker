"use client";
// frontend/src/components/SteamConnectCTA.tsx — [Frontend]
// Reusable Steam onboarding card. Renders three states based on
// useSteamConnection().status:
//   1) Not connected → "Connect your Steam account"
//   2) Connected but never imported → "Import / Resync" prompt
//   3) Imported at least once → renders nothing (returns null)
//
// Mounted on /dashboard and /portfolio so users always have a clear
// next-action until they've completed onboarding.
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Link2, Download, RefreshCw, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { useSteamConnection } from "@/hooks/useSteamConnection";

interface SteamConnectCTAProps {
  className?: string;
}

export function SteamConnectCTA({ className }: SteamConnectCTAProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, loading, connect, resync } = useSteamConnection();
  const [working, setWorking] = useState(false);

  // Don't render while initial status is unknown — avoids a flash on first paint.
  if (loading || !status) return null;

  // Fully onboarded — hide CTA permanently.
  if (status.lastImportedAt) return null;

  const onConnect = async () => {
    try {
      setWorking(true);
      await connect(pathname ?? undefined);
    } catch (e: any) {
      toast.error(e?.message || "Failed to start Steam connect");
      setWorking(false);
    }
  };

  const onImport = () => {
    // Import flow lives on /account (preview → cost-basis → confirm).
    // Send the user there with a hash so the section scrolls into view.
    router.push("/account#steam");
  };

  const onResync = async () => {
    try {
      setWorking(true);
      const r = await resync();
      toast.success(`Resync complete · added ${r.added}, removed ${r.removed}`);
    } catch (e: any) {
      toast.error(e?.message || "Resync failed");
    } finally {
      setWorking(false);
    }
  };

  // State 1 — not connected.
  if (!status.steamId) {
    return (
      <div
        className={
          "rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 " +
          (className ?? "")
        }
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
          <Gamepad2 className="h-5 w-5 text-purple-300" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">
            Connect your Steam account
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Import your CS2 inventory in seconds — we&apos;ll match every skin, case, and
            sticker against live market prices.
          </p>
        </div>
        <button
          onClick={onConnect}
          disabled={working}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {working ? "Connecting…" : "Connect Steam"}
        </button>
      </div>
    );
  }

  // State 2 — connected, never imported.
  return (
    <div
      className={
        "rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 " +
        (className ?? "")
      }
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
        <Gamepad2 className="h-5 w-5 text-emerald-300" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white">
          You&apos;re connected to Steam
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Import your inventory now to populate your portfolio with live prices and P/L.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onResync}
          disabled={working}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 text-slate-200 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={"h-4 w-4 " + (working ? "animate-spin" : "")} aria-hidden="true" />
          Resync
        </button>
        <button
          onClick={onImport}
          disabled={working}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Import
        </button>
      </div>
    </div>
  );
}
