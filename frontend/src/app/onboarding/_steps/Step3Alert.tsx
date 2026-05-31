"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, Check, ArrowRight, X } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { apiUrl, swrFetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

interface SkinResult {
  id: number;
  name: string;
  imageUrl?: string | null;
  priceLatest?: number | null;
  priceMedian?: number | null;
  priceAvg?: number | null;
}

interface Step3AlertProps {
  onBack: () => void;
  onFinish: () => void;
}

/**
 * Step 3 — Optional first alert.
 * Searches /api/v1/skins?q=, picks one, creates a price_threshold alert at
 * 85% of current price. Skip moves on without creating anything.
 */
export function Step3Alert({ onBack, onFinish }: Step3AlertProps) {
  const { createAlert } = useAlerts();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<SkinResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce so we don't hammer the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const searchKey = useMemo(() => {
    if (selected || debounced.length < 2) return null;
    return apiUrl(`/api/v1/skins?q=${encodeURIComponent(debounced)}&pageSize=8`);
  }, [debounced, selected]);

  const { data, isLoading } = useSWR<{ items: SkinResult[] }>(
    searchKey,
    (key: string) => swrFetcher(key) as Promise<{ items: SkinResult[] }>,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const results = data?.items ?? [];

  const currentPrice = useMemo(() => {
    if (!selected) return 0;
    return (
      selected.priceLatest ??
      selected.priceMedian ??
      selected.priceAvg ??
      0
    );
  }, [selected]);

  const threshold = useMemo(() => {
    if (!currentPrice) return 0;
    return +(currentPrice * 0.85).toFixed(2);
  }, [currentPrice]);

  async function handleCreate() {
    if (!selected || !threshold) return;
    setSubmitting(true);
    setError(null);
    try {
      await createAlert({
        type: "price_threshold",
        skinId: selected.id,
        config: { direction: "below", price: threshold },
        channels: ["email", "in_app"],
      });
      analytics.track({
        name: "alert_created",
        properties: {
          type: "price_threshold",
          channels: ["email", "in_app"],
          skinId: selected.id,
        },
      });
      analytics.track({
        name: "onboarding_step_completed",
        properties: { step: 3 },
      });
      analytics.track({ name: "onboarding_completed" });
      onFinish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkipFinish() {
    analytics.track({
      name: "onboarding_step_completed",
      properties: { step: 3, skipped: true },
    });
    analytics.track({ name: "onboarding_completed" });
    onFinish();
  }

  return (
    <div className="bg-slate-900/50 rounded-3xl p-8 md:p-10 border border-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(217,70,239,0.10),transparent_70%)] pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Get notified when prices move
            </h2>
            <p className="mt-2 text-slate-400">
              Set a price alert on any skin. We email you when the threshold is
              hit.
            </p>
          </div>
        </div>

        {/* Search / selected */}
        {!selected ? (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a skin… e.g. AK-47 Redline"
                className="bg-slate-900/60 border-slate-800 pl-10 h-12 text-base"
                autoFocus
              />
            </div>

            {/* Results */}
            {debounced.length >= 2 && (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-sm text-slate-400">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">
                    No skins match &ldquo;{debounced}&rdquo;.
                  </div>
                ) : (
                  <ul>
                    {results.map((s) => {
                      const price =
                        s.priceLatest ?? s.priceMedian ?? s.priceAvg ?? null;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(s)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/60 transition-colors text-left border-b border-slate-800/60 last:border-b-0"
                          >
                            <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {s.imageUrl ? (
                                <Image
                                  src={s.imageUrl}
                                  alt={s.name}
                                  width={40}
                                  height={40}
                                  className="object-contain"
                                  unoptimized
                                />
                              ) : (
                                <Bell className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {s.name}
                              </p>
                              {price != null && (
                                <p className="text-xs text-slate-400">
                                  €{price.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6">
            {/* Selected skin card */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 mb-4">
              <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selected.imageUrl ? (
                  <Image
                    src={selected.imageUrl}
                    alt={selected.name}
                    width={48}
                    height={48}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <Bell className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {selected.name}
                </p>
                {currentPrice > 0 && (
                  <p className="text-xs text-slate-400">
                    Current price €{currentPrice.toFixed(2)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Change skin"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Alert preview */}
            <div
              className={cn(
                "rounded-xl border p-4",
                threshold > 0
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-slate-800 bg-slate-900/40"
              )}
            >
              <div className="flex items-center gap-2 mb-1 text-[0.7rem] uppercase tracking-[0.2em] text-amber-300/80 font-semibold">
                <Bell className="h-3 w-3" />
                Alert preview
              </div>
              {threshold > 0 ? (
                <p className="text-sm text-slate-200">
                  Notify me when{" "}
                  <span className="font-semibold text-white">
                    {selected.name}
                  </span>{" "}
                  drops below{" "}
                  <span className="font-semibold text-amber-300 tabular-nums">
                    €{threshold.toFixed(2)}
                  </span>{" "}
                  <span className="text-slate-400">
                    (15% below current price)
                  </span>
                  .
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  No price data available for this skin yet — pick another one
                  or skip this step.
                </p>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-4 order-2 sm:order-1">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSkipFinish}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Skip — I&apos;ll set alerts later
            </button>
          </div>
          <Button
            onClick={selected && threshold > 0 ? handleCreate : handleSkipFinish}
            disabled={submitting}
            className="order-1 sm:order-2 w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold shadow-lg shadow-pink-500/20 gap-2"
          >
            {submitting
              ? "Creating…"
              : selected && threshold > 0
              ? (
                <>
                  <Check className="h-4 w-4" />
                  Create alert + finish
                </>
              )
              : (
                <>
                  Finish <ArrowRight className="h-4 w-4" />
                </>
              )}
          </Button>
        </div>
      </div>
    </div>
  );
}
