// /frontend/src/components/landing/HeroSection.tsx — [Frontend]
// {/* Hero Section for Landing Page */}
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Star, Users, TrendingUp } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(74,158,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(76,175,80,0.1),transparent_50%)]" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-brand-blue rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-brand-green rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-40 w-1 h-1 bg-brand-purple rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Content */}
            <div className="space-y-8 animate-slide-in-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2">
                <Badge variant="outline" className="border-brand-green/30 text-brand-green bg-brand-green/10">
                  <Star className="h-3 w-3 mr-1" />
                  #1 CS2 Skin Tracker
                </Badge>
                <Badge variant="outline" className="border-slate-500/30 text-slate-300 bg-slate-500/10">
                  <Users className="h-3 w-3 mr-1" />
                  500+ Active Traders
                </Badge>
              </div>

              {/* Headlines */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Track your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-blue">
                    CS2 Skins
                  </span>{" "}
                  like a Pro
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                  Stay ahead of the market with live prices, smart alerts, and comprehensive portfolio insights. 
                  Never miss the perfect trading opportunity again.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-4 text-lg font-semibold btn-enhanced"
                  asChild
                >
                  <Link href="/sign-up">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg font-semibold btn-enhanced"
                  asChild
                >
                  <Link href="/skins">
                    Browse Skins
                    <Play className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-green" />
                  <span>Live Price Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-brand-orange" />
                  <span>4.9/5 User Rating</span>
                </div>
              </div>
            </div>

            {/* Right Column - Mockup/Visual */}
            <div className="relative animate-slide-in-right">
              <div className="relative">
                {/* Dashboard Mockup */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
                  <div className="space-y-4">
                    {/* Mock Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-green to-brand-blue rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">CS</span>
                        </div>
                        <span className="text-white font-bold">SKINTRACKR</span>
                      </div>
                      <div className="w-8 h-8 bg-slate-700 rounded-full" />
                    </div>
                    
                    {/* Mock Content */}
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-700 rounded w-3/4" />
                      <div className="h-4 bg-slate-700 rounded w-1/2" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30 flex items-center justify-center">
                          <span className="text-green-400 font-bold">+12.5%</span>
                        </div>
                        <div className="h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg border border-red-500/30 flex items-center justify-center">
                          <span className="text-red-400 font-bold">-3.2%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center animate-float">
                  <TrendingUp className="h-8 w-8 text-brand-green" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-brand-blue/20 rounded-full flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                  <Star className="h-6 w-6 text-brand-blue" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
