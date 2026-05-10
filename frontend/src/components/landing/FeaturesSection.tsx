import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Bell, BarChart3, FileText, Smartphone, Shield } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Real-time Portfolio Value",
    description: "Live prices from multiple marketplaces. See your total value, unrealized P&L, and allocation at a glance.",
    badge: null as string | null,
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Volatility spikes, float-tier breakouts, case EV inversions. Get notified via email, Discord, or Telegram.",
    badge: "Coming Month 2" as string | null,
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
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
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
