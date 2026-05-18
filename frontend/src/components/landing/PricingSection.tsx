import { Badge } from "@/components/ui/badge";
import { Check, Shield } from "lucide-react";
import { PricingCards } from "@/components/pricing/PricingCards";

export default function PricingSection() {
  return (
    <section className="py-20 bg-slate-900/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 mb-4">
              Simple pricing
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

          <PricingCards />

          {/* Trust signals */}
          <div className="text-center mt-12">
            <div className="inline-flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure payment via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>No hidden fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
