import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Bell, BarChart3, FileText, Smartphone, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Real-time Portfolio Value",
    description: "Live prices from multiple marketplaces. See your total value, unrealized P&L, and allocation at a glance.",
    badge: null as string | null,
  },
  {
    icon: BarChart3,
    title: "Investor Analytics",
    description: "Sharpe ratio, drawdown, beta vs market. Real metrics for real traders — not just current prices.",
    badge: null as string | null,
  },
  {
    icon: FileText,
    title: "Tax-Ready Reports",
    description: "FIFO/LIFO cost basis, CSV export, capital-gains formatting. Built for tax season.",
    badge: "Coming Month 3" as string | null,
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description: "PWA with home-screen widget. Track your portfolio anywhere — no app store needed.",
    badge: null as string | null,
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "We never see your Steam credentials. Read-only public inventory data. Your keys stay yours.",
    badge: null as string | null,
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-purple-500/30 text-purple-400 bg-purple-500/10">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                trade smarter
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Built for CS2 traders who treat skins like an asset class, not a hobby.
            </p>
          </div>

          {/* Hero feature: Smart Alerts */}
          <Card className="mb-6 relative bg-gradient-to-br from-purple-900/40 via-slate-900/80 to-pink-900/30 backdrop-blur border border-purple-500/30 hover:border-purple-500/50 transition-colors overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl" />

            <CardContent className="relative p-8 md:p-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Bell className="h-7 w-7 text-white" />
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 gap-1">
                      <Sparkles className="h-3 w-3" />
                      Killer Feature
                    </Badge>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
                      Coming Month 2
                    </Badge>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Smart Alerts no one else has
                  </h3>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    Forget "skin X = $50" notifications. Get alerted when it actually matters.
                  </p>
                </div>

                <ul className="space-y-3">
                  {[
                    { label: "Volatility spikes", detail: ">5% move in 24h" },
                    { label: "Float-tier breakouts", detail: "Rare FN listed cheap" },
                    { label: "Case EV inversions", detail: "Case price < expected drop value" },
                    { label: "Sticker arbitrage", detail: "Gap between markets" },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start gap-3 bg-slate-900/40 border border-slate-700/50 rounded-lg p-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mt-2 flex-shrink-0" />
                      <div>
                        <div className="text-white font-medium">{item.label}</div>
                        <div className="text-sm text-slate-400">{item.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-slate-400 mt-6 pt-6 border-t border-slate-700/50">
                Delivered via email or in-app notifications. Pro tier unlocks all alert types.
              </p>
            </CardContent>
          </Card>

          {/* Other features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="bg-slate-900/60 backdrop-blur border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-purple-400" />
                      </div>
                      {feature.badge && (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-xs">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
