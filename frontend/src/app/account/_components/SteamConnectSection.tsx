"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur h-48 animate-pulse" />
    );
  }

  // NOT CONNECTED: elevated hero card with gradient border + benefits
  if (!status?.connected) {
    return (
      <>
        {notice && (
          <div className={`text-sm p-3 rounded border mb-4 ${
            notice.kind === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>{notice.text}</div>
        )}
        <div className="relative group">
          {/* Gradient glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-40 group-hover:opacity-60 blur transition" />
          <Card className="relative bg-slate-900/90 backdrop-blur border border-purple-500/30 overflow-hidden">
            {/* Background gradient wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            <CardContent className="relative p-6 md:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">Connect your Steam account</h2>
                    <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">New</Badge>
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
                  <ShieldCheck className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Read-only — we never trade or move items</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-purple-300 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Auto-fill cost basis from price history</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

              <Button
                onClick={connect}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2 font-semibold"
              >
                <Link2 className="h-4 w-4" /> Connect Steam Account
              </Button>
              <p className="text-xs text-slate-500 mt-3">Your Steam profile must be set to public to import inventory.</p>
            </CardContent>
          </Card>
        </div>
        {showImport && <ImportPreviewModal onClose={() => setShowImport(false)} />}
      </>
    );
  }

  // CONNECTED: quieter status card
  return (
    <>
      {notice && (
        <div className={`text-sm p-3 rounded border mb-4 ${
          notice.kind === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>{notice.text}</div>
      )}
      <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-purple-300" />
            Steam Account
            <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 ml-1">Connected</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="text-sm text-slate-300 space-y-1.5">
            <p><span className="text-slate-500">Steam ID:</span> <code className="bg-slate-900/80 px-2 py-0.5 rounded text-xs">{status.steamId}</code></p>
            <p><span className="text-slate-500">Connected:</span> {status.steamConnectedAt && new Date(status.steamConnectedAt).toLocaleString()}</p>
            <p><span className="text-slate-500">Last import:</span> {status.lastImportedAt ? new Date(status.lastImportedAt).toLocaleString() : '—'}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={() => setShowImport(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Import Inventory
            </Button>
            <Button variant="outline" onClick={disconnect} className="border-slate-700/50 text-slate-300 hover:text-red-300 gap-2">
              <Link2Off className="h-4 w-4" /> Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {showImport && <ImportPreviewModal onClose={() => setShowImport(false)} />}
    </>
  );
}
