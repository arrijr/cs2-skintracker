// /frontend/src/app/page.tsx — [Frontend]
// Landing Page - Main entry point
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <HeroSection />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
