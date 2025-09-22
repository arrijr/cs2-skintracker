// /frontend/src/app/page.tsx — [Frontend]
// {/* Landing Page - Main entry point */}
"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If user is logged in, redirect to dashboard after a short delay
  useEffect(() => {
    if (isLoaded && user && mounted) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 2000); // 2 second delay to show landing page
      
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user, router, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </div>
  );
}