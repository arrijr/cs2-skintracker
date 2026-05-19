// /frontend/src/app/page.tsx — [Frontend]
// Landing Page - Main entry point
import type { Metadata } from "next";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";
import { OnboardingGate } from "./onboarding/OnboardingGate";

export const metadata: Metadata = {
  title: "skintrackr.io — The Robinhood for CS2 Skins",
  description: "Investor-grade portfolio tracking, smart alerts, and tax-ready reports for serious CS2 traders. Free forever for casual collectors.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Signed-in + un-onboarded users get pushed to /onboarding here. */}
      <OnboardingGate />
      <HeroSection />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
