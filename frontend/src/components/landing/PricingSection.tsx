// /frontend/src/components/landing/PricingSection.tsx — [Frontend]
// {/* Pricing Section for Landing Page */}
"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, Zap, Shield } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Up to 5 skins in watchlist",
      "1 price alert",
      "Basic portfolio tracking",
      "Live price updates",
      "Community support"
    ],
    limitations: [
      "Limited analytics",
      "No export features"
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    popular: false,
    color: "border-brand-slate-500",
    bgColor: "bg-brand-slate-800/30"
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "per month",
    description: "For serious traders",
    features: [
      "Unlimited skins in watchlist",
      "Up to 20 price alerts",
      "Advanced portfolio analytics",
      "Market insights & benchmarks",
      "Export data (CSV, JSON)",
      "Priority support",
      "Historical data access",
      "Custom alert conditions"
    ],
    limitations: [],
    cta: "Start Premium Trial",
    href: "/sign-up?plan=premium",
    popular: true,
    color: "border-brand-celadon-500",
    bgColor: "bg-brand-celadon-500/5"
  }
];

export default function PricingSection() {
  return (
    <section className="py-20 bg-slate-900/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-brand-slate-500/30 text-brand-slate-400 bg-brand-slate-500/10 mb-4">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Choose your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-celadon-500 to-brand-slate-500">
                trading level
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Start free and upgrade anytime. No hidden fees, no long-term contracts.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name}
                className={`card-enhanced group hover:scale-105 transition-all duration-300 ${plan.color} ${plan.bgColor} ${
                  plan.popular ? 'ring-2 ring-brand-celadon-500/50 shadow-xl shadow-brand-celadon-500/10' : ''
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-brand-celadon-500 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-white">
                      {plan.price}
                      <span className="text-lg text-slate-400 font-normal">/{plan.period}</span>
                    </div>
                    <p className="text-slate-300">{plan.description}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-brand-green/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-brand-green" />
                        </div>
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations (only for Free plan) */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-700/50">
                      <p className="text-slate-400 text-sm font-medium">Limitations:</p>
                      {plan.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-slate-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <X className="h-3 w-3 text-slate-500" />
                          </div>
                          <span className="text-slate-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button 
                    className={`w-full py-3 text-lg font-semibold btn-enhanced ${
                      plan.popular 
                        ? 'bg-brand-green hover:bg-brand-green/90 text-white' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    asChild
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                      {plan.popular && <Zap className="ml-2 h-5 w-5" />}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom Note */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
              <Shield className="h-4 w-4" />
              <span>No credit card required • Cancel anytime • 30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
