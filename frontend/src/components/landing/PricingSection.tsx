"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Shield, Crown } from "lucide-react";
import Link from "next/link";

interface Plan {
  id: "free" | "lite" | "pro";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
  ctaLabel: string;
  gradient: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "0€",
    period: "für immer",
    description: "Zum Einstieg ideal",
    features: [
      "Bis zu 5 Skins in Watchlist",
      "1 Preisalarm",
      "Basis Portfolio-Tracking",
      "Live-Preisupdates",
      "Community Support",
    ],
    highlight: false,
    ctaLabel: "Kostenlos starten",
    gradient: "from-slate-600 to-slate-700",
  },
  {
    id: "lite",
    name: "Lite",
    price: "4,99€",
    period: "pro Monat",
    description: "Für Sammler & Content Creator",
    features: [
      "Unbegrenzte Watchlist",
      "5 Preisalarme",
      "90-Tage Preishistorie",
      "Erweiterte Analysen",
      "E-Mail Benachrichtigungen",
    ],
    highlight: false,
    ctaLabel: "Lite wählen",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "pro",
    name: "Pro",
    price: "19,99€",
    period: "pro Monat",
    description: "Für professionelle Trader",
    features: [
      "Alles aus Lite",
      "Unbegrenzte Preisalarme",
      "Volatilitätsanalyse (7d/30d/90d)",
      "Rarity-Scoring & Research Tools",
      "CSV-Export & Priority Support",
    ],
    highlight: true,
    ctaLabel: "Pro wählen",
    gradient: "from-purple-500 to-pink-500",
  },
];

export default function PricingSection() {
  return (
    <section className="py-20 bg-slate-900/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 mb-4">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Choose your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                trading level
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Start free and upgrade anytime. No hidden fees, cancel whenever.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative bg-slate-900/60 backdrop-blur border transition-all duration-300 ${
                  plan.highlight
                    ? "border-purple-500/50 shadow-2xl shadow-purple-500/20 lg:scale-105"
                    : "border-slate-700/50 hover:border-slate-600"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
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
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-green-400" />
                        </div>
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`w-full py-6 text-base font-semibold ${
                      plan.id === "free"
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : `bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white`
                    }`}
                  >
                    <Link href="/pricing">
                      {plan.id === "pro" && <Crown className="mr-2 h-5 w-5" />}
                      {plan.ctaLabel}
                      {plan.highlight && <Zap className="ml-2 h-5 w-5" />}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust signals */}
          <div className="text-center mt-12">
            <div className="inline-flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Sichere Zahlung via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Jederzeit kündbar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Keine versteckten Gebühren</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
