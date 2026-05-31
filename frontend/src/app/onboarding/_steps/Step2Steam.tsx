"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useSteamConnection } from "@/hooks/useSteamConnection";
import { analytics } from "@/lib/analytics";

interface Step2SteamProps {
  onBack: () => void;
  onContinue: () => void;
}

/**
 * Step 2 — Optional Steam connect.
 * - If already connected: success state + "Continue".
 * - Otherwise: primary "Connect Steam" CTA (kicks off OpenID redirect) +
 *   secondary skip link.
 */
export function Step2Steam({ onBack, onContinue }: Step2SteamProps) {
  const { status, loading, connect } = useSteamConnection();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = !!status?.connected;

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      analytics.track({
        name: "steam_connect_started",
        properties: { source: "onboarding" },
      });
      await connect(); // Redirects away on success — code below won't run.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start Steam connect");
      setConnecting(false);
    }
  }

  function handleContinue() {
    analytics.track({
      name: "onboarding_step_completed",
      properties: { step: 2, skipped: !connected },
    });
    onContinue();
  }

  return (
    <div className="bg-slate-900/50 rounded-3xl p-8 md:p-10 border border-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(217,70,239,0.10),transparent_70%)] pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/30">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Connect Steam to import your inventory
            </h2>
            <p className="mt-2 text-slate-400">
              We&apos;ll match your CS2 inventory against our catalog and
              pre-populate your portfolio. Free, takes 30 seconds.
            </p>
          </div>
        </div>

        {/* Benefit row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <span>30-second import</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Read-only — no trade access</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-purple-300 mt-0.5 flex-shrink-0" />
            <span>Editable cost basis</span>
          </div>
        </div>

        {/* Connected state vs. CTA */}
        {loading ? (
          <div className="h-14 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse mb-6" />
        ) : connected ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-6">
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-300 font-medium">Steam connected</p>
              <p className="text-xs text-emerald-200/70 truncate">
                {status?.steamId
                  ? `Steam ID ${status.steamId}`
                  : "Linked to your account"}
              </p>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold shadow-lg shadow-pink-500/20 gap-2 mb-6"
          >
            <Gamepad2 className="h-4 w-4" />
            {connecting ? "Redirecting…" : "Connect Steam"}
          </Button>
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
            {!connected && (
              <button
                type="button"
                onClick={handleContinue}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Skip — I&apos;ll add skins manually
              </button>
            )}
          </div>
          <Button
            variant={connected ? "default" : "outline"}
            onClick={handleContinue}
            className={
              connected
                ? "order-1 sm:order-2 w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold shadow-lg shadow-pink-500/20 gap-2"
                : "order-1 sm:order-2 w-full sm:w-auto border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white gap-2"
            }
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
