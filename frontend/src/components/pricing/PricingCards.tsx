import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlanId = "free" | "lite" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  ctaLabel: string;
  ctaHref?: string;
  gradient: string;
}

/** Canonical plan list — used by landing PricingSection (monthly snapshot).
 *  Annual pricing + toggle lives on /pricing only. */
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Get started in seconds",
    features: [
      "Up to 5 skins in watchlist",
      "2 price alerts",
      "Basic portfolio tracking",
      "Live price updates",
      "Community support",
    ],
    highlight: false,
    ctaLabel: "Start free",
    ctaHref: "/sign-up",
    gradient: "from-slate-600 to-slate-700",
  },
  {
    id: "lite",
    name: "Lite",
    price: "€6.99",
    period: "per month",
    description: "For collectors and content creators",
    features: [
      "Unlimited watchlist",
      "15 price alerts",
      "120-day price history",
      "Advanced analytics",
      "Email + in-app notifications",
    ],
    highlight: false,
    ctaLabel: "Upgrade to Lite",
    ctaHref: "/pricing",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "pro",
    name: "Pro",
    price: "€9.99",
    period: "per month",
    description: "For professional traders",
    features: [
      "Everything in Lite",
      "Unlimited price alerts",
      "Volatility analysis (7d/30d/90d)",
      "Rarity scoring & research tools",
      "CSV export & priority support",
    ],
    highlight: true,
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/pricing",
    gradient: "from-fuchsia-500 to-pink-500",
  },
];

interface PricingCardsProps {
  plans?: Plan[];
  className?: string;
}

export function PricingCards({ plans = PLANS, className }: PricingCardsProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto", className)}>
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative bg-slate-900/60 backdrop-blur border transition-all duration-300",
            plan.highlight
              ? "border-purple-500/50 shadow-2xl shadow-purple-500/20 lg:scale-105"
              : "border-slate-700/50 hover:border-slate-600"
          )}
        >
          {plan.highlight && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                <Star className="h-3 w-3 mr-1" />
                Most popular
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <div className="mb-2">
              <span className="text-5xl font-bold text-white">{plan.price}</span>
              <span className="text-slate-400 ml-1">/{plan.period}</span>
            </div>
            <p className="text-slate-300">{plan.description}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-green-400" />
                  </div>
                  <span className="text-slate-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className={cn(
                "w-full py-6 text-base font-semibold",
                plan.id === "free"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : `bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white`
              )}
            >
              <Link href={plan.ctaHref ?? "/pricing"}>
                {plan.id === "pro" && <Crown className="mr-2 h-5 w-5" />}
                {plan.ctaLabel}
                {plan.highlight && <Zap className="ml-2 h-5 w-5" />}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
