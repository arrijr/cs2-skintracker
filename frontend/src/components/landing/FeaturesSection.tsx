// /frontend/src/components/landing/FeaturesSection.tsx — [Frontend]
// {/* Features Section for Landing Page */}
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  BarChart3, 
  Heart, 
  TrendingUp, 
  Shield, 
  Zap,
  Target,
  PieChart
} from "lucide-react";

const features = [
  {
    icon: Bell,
    title: "Price Alerts",
    description: "Never miss the right moment to buy or sell with instant notifications.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30"
  },
  {
    icon: BarChart3,
    title: "Portfolio Tracking",
    description: "See your gains and performance at a glance with detailed analytics.",
    color: "text-brand-celadon-500",
    bgColor: "bg-brand-celadon-500/10",
    borderColor: "border-brand-celadon-500/30"
  },
  {
    icon: Heart,
    title: "Smart Watchlist",
    description: "Organize and monitor your favorite skins with intelligent categorization.",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30"
  },
  {
    icon: TrendingUp,
    title: "Market Insights",
    description: "Advanced analytics & benchmarks to make informed trading decisions.",
    color: "text-brand-slate-500",
    bgColor: "bg-brand-slate-500/10",
    borderColor: "border-brand-slate-500/30"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and never shared with third parties.",
    color: "text-brand-purple-600",
    bgColor: "bg-brand-purple-600/10",
    borderColor: "border-brand-purple-600/30"
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Live price feeds updated every minute for maximum accuracy.",
    color: "text-brand-midnight",
    bgColor: "bg-brand-midnight/10",
    borderColor: "border-brand-midnight/30"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-brand-green/30 text-brand-green bg-brand-green/10 mb-4">
              Why SkinTracker?
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-blue">
                dominate
              </span>{" "}
              the CS2 market
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Stop losing money on missed opportunities. Our comprehensive toolkit gives you 
              the edge you need to make profitable trades every time.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title}
                  className={`card-enhanced group hover:scale-105 transition-all duration-300 ${feature.borderColor} ${feature.bgColor}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 ${feature.bgColor} ${feature.borderColor} border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center gap-4 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-brand-green">
                <Target className="h-5 w-5" />
                <span className="font-semibold">Ready to get started?</span>
              </div>
              <div className="text-slate-300">
                Join 500+ traders already using SkinTracker
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
