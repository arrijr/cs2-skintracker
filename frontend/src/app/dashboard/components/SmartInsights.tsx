"use client";
import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, TrendingUp, Bell, Sparkles, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioItem {
  id: number;
  name?: string;
  totalValue?: number;
  marketPrice?: number;
  amount?: number;
}

interface SmartInsightsProps {
  portfolio: PortfolioItem[];
  totalValue: number;
  activeAlerts?: number;
  isPremium?: boolean;
  className?: string;
}

interface Insight {
  id: string;
  tone: "warning" | "info" | "success" | "upsell";
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

const toneStyles: Record<Insight["tone"], string> = {
  warning: "border-amber-500/30 bg-amber-500/5",
  info: "border-purple-500/30 bg-purple-500/5",
  success: "border-green-500/30 bg-green-500/5",
  upsell: "border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-pink-500/10",
};

const toneIcon: Record<Insight["tone"], string> = {
  warning: "text-amber-400",
  info: "text-purple-300",
  success: "text-green-400",
  upsell: "text-purple-300",
};

export function SmartInsights({
  portfolio,
  totalValue,
  activeAlerts = 0,
  isPremium = false,
  className,
}: SmartInsightsProps) {
  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];

    // Concentration risk: top 3 skins as % of portfolio
    if (portfolio.length >= 3 && totalValue > 0) {
      const sorted = [...portfolio]
        .map((p) => ({
          value: (p.marketPrice ?? 0) * (p.amount ?? 1),
          name: p.name ?? "Unknown",
        }))
        .sort((a, b) => b.value - a.value);
      const top3 = sorted.slice(0, 3).reduce((acc, s) => acc + s.value, 0);
      const pct = (top3 / totalValue) * 100;
      if (pct > 60) {
        out.push({
          id: "concentration",
          tone: "warning",
          icon: AlertTriangle,
          title: "High concentration",
          body: `${pct.toFixed(0)}% of your portfolio is in the top 3 skins. Consider diversifying.`,
          cta: { label: "View breakdown", href: "/portfolio" },
        });
      }
    }

    // Alert coverage
    if (portfolio.length > 0 && activeAlerts === 0) {
      out.push({
        id: "no-alerts",
        tone: "info",
        icon: Bell,
        title: "You have no active alerts",
        body: "Get notified when your skins hit price targets or break out of their range.",
        cta: { label: "Create alert", href: "/alerts" },
      });
    }

    // Premium upsell
    if (!isPremium && portfolio.length >= 10) {
      out.push({
        id: "upgrade",
        tone: "upsell",
        icon: Sparkles,
        title: "Unlock Pro insights",
        body: "Volatility analysis, rarity scoring, and unlimited alerts for serious traders.",
        cta: { label: "See plans", href: "/pricing" },
      });
    }

    // Small portfolio nudge
    if (portfolio.length > 0 && portfolio.length < 5) {
      out.push({
        id: "small-portfolio",
        tone: "info",
        icon: TrendingUp,
        title: "Track more skins",
        body: "Add more items to your portfolio for richer analytics and trend insights.",
        cta: { label: "Browse skins", href: "/skins" },
      });
    }

    // Catch-all success state
    if (out.length === 0 && portfolio.length > 0) {
      out.push({
        id: "looking-good",
        tone: "success",
        icon: Shield,
        title: "Portfolio looking healthy",
        body: "Diversified holdings, active alerts set up. Keep monitoring for new opportunities.",
      });
    }

    return out.slice(0, 3);
  }, [portfolio, totalValue, activeAlerts, isPremium]);

  if (insights.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {insights.map((insight) => {
        const Icon = insight.icon;
        return (
          <div
            key={insight.id}
            className={cn(
              "rounded-xl border backdrop-blur p-5 flex flex-col",
              toneStyles[insight.tone]
            )}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={cn("flex-shrink-0 mt-0.5", toneIcon[insight.tone])}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{insight.body}</p>
              </div>
            </div>
            {insight.cta && (
              <Link
                href={insight.cta.href}
                className={cn(
                  "text-xs font-semibold mt-auto self-start hover:underline",
                  toneIcon[insight.tone]
                )}
              >
                {insight.cta.label} →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
