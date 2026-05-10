import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — skintrackr.com",
  description: "Free, Lite (€4.99/mo), and Pro (€19.99/mo) plans for CS2 portfolio tracking. Start free, upgrade anytime, cancel whenever.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
