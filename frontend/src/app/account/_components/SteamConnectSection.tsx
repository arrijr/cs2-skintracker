"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Link2Off, RefreshCw, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { useSteamConnection } from "@/hooks/useSteamConnection";
import { ImportPreviewModal } from "./ImportPreviewModal";

export function SteamConnectSection() {
  const { status, loading, error, connect, disconnect, refresh } = useSteamConnection();
  const searchParams = useSearchParams();
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const s = searchParams.get('steam');
    if (s === 'connected') setNotice({ kind: 'success', text: 'Steam account connected.' });
    if (s === 'error') setNotice({ kind: 'error', text: searchParams.get('reason') || 'Connection failed.' });
    if (s) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 h-48 animate-pulse" />
    );
  }

  // NOT CONNECTED: elevated hero card with gradient border + benefits
  if (!status?.connected) {
    return (
      <>
        {notice && (
          <div className={`text-sm p-3 rounded-md border mb-4 ${
            notice.kind === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>{notice.text}</div>
        )}
        <div className="relative group">
          {/* Subtle gradient glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-2xl opacity-30 group-hover:opacity-50 blur transition" />
          <div className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-slate-900/90 backdrop-blur p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/[0.06] via-transparent to-pink-500/[0.06] pointer-events-none" />
            <div className="relative">
              <div className="flex items-start gap-4 mb-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-display font-bold text-white">Connect your Steam account</h3>
                    <Badge variant="outline" className="border-pink-500/40 text-pink-300 bg-pink-500/10 text-xs">New</Badge>
                  </div>
                  <p className="text-slate-300 text-sm">
                    One-click import your full CS2 inventory — no manual data entry. We auto-match every skin against our 15,000+ item catalog.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="flex items-start gap-2 text-sm">
                  <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Import 50+ skins in 30 seconds</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Read-only — we never trade or move items</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-fuchsia-300 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Auto-fill cost basis from price history</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

              <Button
                onClick={connect}
                size="lg"
                className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white gap-2 font-semibold"
              >
                <Link2 className="h-4 w-4" /> Connect Steam Account
              </Button>
              <p className="text-xs text-slate-500 mt-3">Your Steam profile must be set to public to import inventory.</p>
            </div>
          </div>
        </div>
        {showImport && <ImportPreviewModal onClose={() => setShowImport(false)} />}
      </>
    );
  }

  // CONNECTED: quieter status card
  return (
    <>
      {notice && (
        <div className={`text-sm p-3 rounded-md border mb-4 ${
          notice.kind === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>{notice.text}</div>
      )}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 border border-slate-800">
            <Link2 className="h-5 w-5 text-fuchsia-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white">Steam account</h3>
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Connected</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-400">Auto-import your CS2 inventory and refresh on demand.</p>
          </div>
        </div>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Steam ID</dt>
            <dd className="mt-1 text-sm text-slate-200">
              <code className="bg-slate-900/80 px-1.5 py-0.5 rounded text-xs">{status.steamId}</code>
            </dd>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Connected</dt>
            <dd className="mt-1 text-sm text-slate-200">{status.steamConnectedAt ? new Date(status.steamConnectedAt).toLocaleDateString() : '—'}</dd>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last import</dt>
            <dd className="mt-1 text-sm text-slate-200">{status.lastImportedAt ? new Date(status.lastImportedAt).toLocaleDateString() : '—'}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-3 justify-end pt-4 border-t border-slate-800">
          <Button
            variant="outline"
            onClick={disconnect}
            className="border-slate-700 bg-slate-900/60 text-slate-300 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/40 gap-2"
          >
            <Link2Off className="h-4 w-4" /> Disconnect
          </Button>
          <Button
            onClick={() => setShowImport(true)}
            className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Import inventory
          </Button>
        </div>
      </div>

      {showImport && <ImportPreviewModal onClose={() => setShowImport(false)} />}
    </>
  );
}
