import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — skintrackr.io",
  description: "Free, Lite (€6.99/mo or €67/yr), and Pro (€9.99/mo or €96/yr) plans for CS2 portfolio tracking. Save 20% on annual. Start free, upgrade anytime, cancel whenever.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
