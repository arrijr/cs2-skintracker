import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

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
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-purple-500/30 text-purple-300 bg-purple-500/10 gap-1">
            <Sparkles className="h-3 w-3" />
            Now in beta — Free forever for casual collectors
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            The{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Robinhood
            </span>{" "}
            for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              CS2 Skins
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mt-6 max-w-2xl mx-auto leading-relaxed">
            Investor-grade portfolio tracking, smart alerts, and tax-ready reports for serious CS2 traders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6 gap-2">
              <Link href="/sign-up">
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-slate-700 hover:border-slate-600 text-white bg-slate-900/50 text-lg px-8 py-6">
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-400 mt-6">
            No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
