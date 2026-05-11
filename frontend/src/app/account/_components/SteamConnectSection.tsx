"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Link2Off, RefreshCw } from "lucide-react";
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

  if (loading) return null;

  return (
    <>
      <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Steam Account
            {status?.connected ? (
              <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">Connected</Badge>
            ) : (
              <Badge variant="outline" className="border-slate-700/50 text-slate-400">Not connected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice && (
            <div className={`text-sm p-3 rounded border ${
              notice.kind === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>{notice.text}</div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {!status?.connected && (
            <>
              <p className="text-slate-300">Connect your Steam account to one-click import your CS2 inventory.</p>
              <Button onClick={connect} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2">
                <Link2 className="h-4 w-4" /> Connect Steam Account
              </Button>
            </>
          )}

          {status?.connected && (
            <>
              <div className="text-sm text-slate-300 space-y-1">
                <p><span className="text-slate-500">Steam ID:</span> <code className="bg-slate-900/60 px-2 py-1 rounded">{status.steamId}</code></p>
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
            </>
          )}
        </CardContent>
      </Card>

      {showImport && <ImportPreviewModal onClose={() => setShowImport(false)} />}
    </>
  );
}
