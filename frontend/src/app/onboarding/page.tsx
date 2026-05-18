"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Link2,
  Plus,
  Bell,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useSteamConnection } from "@/hooks/useSteamConnection";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { status, connect } = useSteamConnection();
  const [step, setStep] = useState<Step>(1);

  if (!isLoaded) {
    return (
      <AppShell eyebrow="Get started" title="Welcome" maxWidth="3xl">
        <div className="h-64 rounded-xl bg-slate-900/40 border border-slate-700/40 animate-pulse" />
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Get started"
      title={`Welcome${user?.firstName ? `, ${user.firstName}` : ""}`}
      description="Three quick steps to set up your portfolio."
      maxWidth="3xl"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                step === n
                  ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                  : step > n
                  ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : "bg-slate-800/60 text-slate-500 border border-slate-700/40"
              )}
            >
              {step > n ? <Check className="h-4 w-4" /> : n}
            </div>
            {n < 3 && (
              <div
                className={cn(
                  "w-12 h-px",
                  step > n ? "bg-green-500/40" : "bg-slate-700/50"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Steam Connect */}
      {step === 1 && (
        <Card className="bg-slate-900/70 backdrop-blur border-purple-500/30 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none" />
          <CardContent className="relative p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">Import your inventory</h2>
                  <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                    Recommended
                  </Badge>
                </div>
                <p className="text-slate-300 text-sm">
                  Connect Steam to import every CS2 skin you own. We auto-match against 15,000+ catalog items.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>30-second import</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Read-only access</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-purple-300 mt-0.5 flex-shrink-0" />
                <span>Editable cost basis</span>
              </div>
            </div>

            {status?.connected ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 mb-4">
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-green-300 text-sm">
                  Steam connected. Head to{" "}
                  <Link href="/account" className="underline">your account</Link>{" "}
                  to import.
                </span>
              </div>
            ) : (
              <Button
                onClick={connect}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2 mb-4"
              >
                <Link2 className="h-4 w-4" /> Connect Steam
              </Button>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-700/40">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                I'll do this later
              </button>
              <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-300 gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add manually or browse */}
      {step === 2 && (
        <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/40 flex items-center justify-center flex-shrink-0">
                <Plus className="h-6 w-6 text-slate-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Browse the catalog</h2>
                <p className="text-slate-300 text-sm">
                  Search 15,000+ skins, cases, stickers, and more. Add any item to your portfolio or watchlist.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Link
                href="/skins"
                className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-600 transition-colors"
              >
                <div className="text-white font-medium mb-1">Browse skins</div>
                <div className="text-xs text-slate-400">~3,500 weapon skins with live prices</div>
              </Link>
              <Link
                href="/items"
                className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-600 transition-colors"
              >
                <div className="text-white font-medium mb-1">Browse items</div>
                <div className="text-xs text-slate-400">Stickers, agents, patches, music kits</div>
              </Link>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700/40">
              <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-400">
                Back
              </Button>
              <Button variant="ghost" onClick={() => setStep(3)} className="text-slate-300 gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: First alert */}
      {step === 3 && (
        <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Set your first alert</h2>
                <p className="text-slate-300 text-sm">
                  Get notified when a skin hits a price target, breaks out of its 30-day range, or crashes.
                </p>
              </div>
            </div>

            <ul className="space-y-2 mb-6 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Price target:</strong> "Tell me when AK-47 Redline drops below €15"</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Volatility:</strong> "Notify me on 10%+ moves in 24h"</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Case EV inversion:</strong> Pro-only — spot when cases become undervalued</span>
              </li>
            </ul>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700/40">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-400">
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="border-slate-700/40 text-slate-300"
                >
                  Skip to dashboard
                </Button>
                <Button
                  onClick={() => router.push("/alerts")}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
                >
                  Create alert <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
