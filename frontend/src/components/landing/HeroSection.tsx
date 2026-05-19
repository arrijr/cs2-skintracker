import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-purple-500/30 text-purple-300 bg-purple-500/10 gap-1">
            <Sparkles className="h-3 w-3" />
            Beta — free forever for casual collectors
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            The{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Robinhood
            </span>{" "}
            for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              CS2 Skins
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mt-6 max-w-2xl mx-auto leading-relaxed">
            Investor-grade portfolio tracking, smart alerts, and tax-ready reports for serious CS2 traders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center items-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6 gap-2">
              <Link href="/sign-up">
                Start free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="text-slate-300 hover:text-white hover:bg-slate-900/50 text-lg px-6 py-6">
              <Link href="/pricing">View pricing →</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-400 mt-6">
            No credit card required • Cancel anytime
          </p>

          {/* Dashboard mockup */}
          <div className="mt-16 md:mt-20 relative">
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl opacity-50" />

            <Card className="relative bg-slate-900/80 backdrop-blur border border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/90">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-slate-500 ml-2">skintrackr.com/dashboard</span>
              </div>

              <CardContent className="p-6 md:p-8 text-left">
                {/* KPI grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Wallet className="h-3 w-3" />
                      Portfolio Value
                    </div>
                    <div className="text-2xl font-bold text-white">€12,847.32</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +4.27% today
                    </div>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <BarChart3 className="h-3 w-3" />
                      Unrealized P&L
                    </div>
                    <div className="text-2xl font-bold text-green-400">+€2,341.89</div>
                    <div className="text-slate-400 text-sm mt-1">+22.3% all-time</div>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                    <div className="text-slate-400 text-xs mb-1">Skins Tracked</div>
                    <div className="text-2xl font-bold text-white">47</div>
                    <div className="text-slate-400 text-sm mt-1">across 12 cases</div>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                    <div className="text-slate-400 text-xs mb-1">Active Alerts</div>
                    <div className="text-2xl font-bold text-purple-400">8</div>
                    <div className="text-amber-400 text-sm mt-1">2 triggered today</div>
                  </div>
                </div>

                {/* Mock chart area */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-300 font-medium">Portfolio Value (30d)</span>
                    <div className="flex gap-2">
                      <span className="text-xs text-slate-500 px-2 py-1 rounded bg-slate-700/50">7D</span>
                      <span className="text-xs text-purple-300 px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30">30D</span>
                      <span className="text-xs text-slate-500 px-2 py-1 rounded bg-slate-700/50">1Y</span>
                    </div>
                  </div>
                  {/* Stylized SVG chart */}
                  <svg viewBox="0 0 400 100" className="w-full h-24" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 70 L 30 65 L 60 68 L 90 55 L 120 50 L 150 58 L 180 45 L 210 40 L 240 48 L 270 35 L 300 30 L 330 25 L 360 20 L 400 15 L 400 100 L 0 100 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M 0 70 L 30 65 L 60 68 L 90 55 L 120 50 L 150 58 L 180 45 L 210 40 L 240 48 L 270 35 L 300 30 L 330 25 L 360 20 L 400 15"
                      fill="none"
                      stroke="rgb(168, 85, 247)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
