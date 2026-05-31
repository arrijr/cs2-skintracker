"use client";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lock, ExternalLink, RefreshCw } from "lucide-react";
import { useSteamConnection, type PreviewResult, type CostBasisMode, type CustomCostBasis } from "@/hooks/useSteamConnection";
import { BulkEditCostBasis } from "./BulkEditCostBasis";

interface Props {
  onClose: () => void;
  /** Connected Steam ID — deep-links the user straight to their own privacy settings. */
  steamId?: string | null;
}

export function ImportPreviewModal({ onClose, steamId }: Props) {
  const { preview, importNow } = useSteamConnection();
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<CostBasisMode>('empty');
  const [bulk, setBulk] = useState<CustomCostBasis[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ created: number; matched: number; skipped: number } | null>(null);

  const runPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try { setData(await preview()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Preview failed'); }
    finally { setLoading(false); }
  }, [preview]);

  useEffect(() => {
    runPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Steam splits profile privacy from inventory privacy — a public profile can
  // still have a private inventory (backend maps that 403 → "...is private").
  // Detect that specific failure so we can show a fix-it path instead of a
  // dead-end red string the user can't act on.
  const isPrivacyError = !!error && /private/i.test(error);
  const steamPrivacyUrl = steamId
    ? `https://steamcommunity.com/profiles/${steamId}/edit/settings`
    : 'https://steamcommunity.com/my/edit/settings';

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const customPayload = mode === 'custom' ? bulk.map(b => ({
        skinId: b.skinId,
        buyPrice: b.buyPrice,
        buyDate: b.buyDate ? b.buyDate.toISOString() : null,
      })) : undefined;
      const result = await importNow(mode, customPayload);
      setDone(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Import Inventory</DialogTitle>
        </DialogHeader>

        {loading && <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 rounded" />)}</div>}
        {error && (isPrivacyError ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium text-amber-200">Dein Steam-Inventar ist privat</p>
                <p className="text-sm text-amber-100/80 mt-1">
                  Steam blockiert den Zugriff auf dein Inventar. Setze in den Steam-Privatsphäre-Einstellungen{" "}
                  <strong>&bdquo;Inventar&ldquo; auf Öffentlich</strong> (und &bdquo;Spieldetails&ldquo; ebenfalls),
                  warte kurz und versuche es erneut.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={steamPrivacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:from-purple-600 hover:to-pink-600"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Steam-Privatsphäre öffnen
              </a>
              <Button
                variant="outline"
                onClick={runPreview}
                disabled={loading}
                className="border-amber-500/40 bg-transparent text-amber-200 hover:bg-amber-500/10 hover:text-amber-100 gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                {loading ? 'Prüfe…' : 'Erneut versuchen'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-red-400 text-sm">{error}</p>
        ))}

        {done && (
          <div className="space-y-3">
            <p className="text-green-300">✓ Created <strong>{done.created}</strong> Portfolio entries.</p>
            <p className="text-slate-300 text-sm">{done.matched} matched · {done.skipped} skipped</p>
            <Button onClick={onClose} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">Done</Button>
          </div>
        )}

        {!done && data && !showBulk && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge className="bg-slate-800/60 border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white">Fetched: {data.totals.fetched}</Badge>
              <Badge className="bg-green-500/10 text-green-300 border border-green-500/30">Matched: {data.totals.matched}</Badge>
              <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30">Skipped: {data.totals.skipped}</Badge>
            </div>

            <div className="space-y-2">
              <p className="font-medium">How do you want to set cost basis?</p>
              {([
                { v: 'empty', label: 'Leave empty — I will fill in later' },
                { v: 'current_market', label: 'Use current market price (reset point)' },
                { v: 'custom', label: 'Let me set it now (Bulk edit)' },
              ] as Array<{v: CostBasisMode; label: string}>).map(opt => (
                <label
                  key={opt.v}
                  className={`flex items-center gap-2.5 cursor-pointer rounded-lg border px-3 py-2 transition ${
                    mode === opt.v
                      ? 'border-pink-500/60 bg-pink-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="cb"
                    value={opt.v}
                    checked={mode === opt.v}
                    onChange={() => setMode(opt.v)}
                    className="h-4 w-4 shrink-0 accent-pink-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white">Cancel</Button>
              {mode === 'custom' ? (
                <Button onClick={() => setShowBulk(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">Continue to bulk edit</Button>
              ) : (
                <Button onClick={handleImport} disabled={importing} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  {importing ? 'Importing…' : 'Import'}
                </Button>
              )}
            </div>
          </div>
        )}

        {!done && data && showBulk && (
          <BulkEditCostBasis
            matchedSkinItems={data.matched.filter(m => m.kind === 'skin')}
            value={bulk}
            onChange={setBulk}
            onBack={() => setShowBulk(false)}
            onSubmit={handleImport}
            importing={importing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
