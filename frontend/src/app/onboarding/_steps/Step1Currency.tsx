"use client";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sparkles, Euro, DollarSign, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

type Currency = "EUR" | "USD";

interface Step1CurrencyProps {
  firstName?: string | null;
  initialCurrency?: Currency;
  onContinue: () => void;
  onSkipAll: () => void;
}

/**
 * Step 1 — Welcome hero + currency picker.
 * Saves preferredCurrency via PATCH /api/v1/users/me, then advances.
 * Skip-all stamps onboardingCompletedAt and lands on /dashboard.
 */
export function Step1Currency({
  firstName,
  initialCurrency = "EUR",
  onContinue,
  onSkipAll,
}: Step1CurrencyProps) {
  const { getToken } = useAuth();
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken({ template: "backend" });
      const res = await fetch(`${apiUrl}/api/v1/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferredCurrency: currency }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      analytics.track({
        name: "onboarding_step_completed",
        properties: { step: 1 },
      });
      onContinue();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save currency");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-slate-900/50 rounded-3xl p-8 md:p-10 border border-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(217,70,239,0.10),transparent_70%)] pointer-events-none" />

      <div className="relative">
        {/* Hero */}
        <div className="flex items-start gap-4 mb-8">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Welcome to skintrackr.io
              {firstName ? `, ${firstName}` : ""}!
            </h2>
            <p className="mt-2 text-slate-400">
              Let&apos;s set up your portfolio in 3 quick steps.
            </p>
          </div>
        </div>

        {/* Currency card */}
        <div className="mb-6">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">
            Preferred currency
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CurrencyOption
              code="EUR"
              label="Euro"
              symbol="€"
              icon={Euro}
              active={currency === "EUR"}
              onClick={() => setCurrency("EUR")}
            />
            <CurrencyOption
              code="USD"
              label="US Dollar"
              symbol="$"
              icon={DollarSign}
              active={currency === "USD"}
              onClick={() => setCurrency("USD")}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            All prices, portfolio values, and alerts will display in your chosen
            currency. Change anytime in Profile → Account.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onSkipAll}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors order-2 sm:order-1"
          >
            Skip setup
          </button>
          <Button
            onClick={handleContinue}
            disabled={saving}
            className="order-1 sm:order-2 w-full sm:w-auto bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-semibold shadow-lg shadow-pink-500/20 gap-2"
          >
            {saving ? "Saving…" : "Continue"}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CurrencyOptionProps {
  code: string;
  label: string;
  symbol: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}

function CurrencyOption({
  code,
  label,
  symbol,
  icon: Icon,
  active,
  onClick,
}: CurrencyOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all",
        active
          ? "border-fuchsia-500/60 bg-fuchsia-500/5 ring-1 ring-fuchsia-500/30"
          : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
          active
            ? "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white"
            : "bg-slate-800 text-slate-300"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{code}</span>
          <span className="text-slate-500 text-sm">({symbol})</span>
        </div>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
      {active && (
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </button>
  );
}
