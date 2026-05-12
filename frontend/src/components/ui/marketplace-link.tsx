"use client";
import { ExternalLink } from "lucide-react";
import { buildMarketplaceUrl } from "@/lib/affiliate";

interface MarketplaceLinkProps {
  marketplace: 'dmarket' | 'skinport';
  path: string;
  params?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
}

export function MarketplaceLink({ marketplace, path, params, children, className }: MarketplaceLinkProps) {
  const href = buildMarketplaceUrl(marketplace, path, params);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <ExternalLink className="inline h-3 w-3 ml-1 opacity-60" aria-hidden="true" />
    </a>
  );
}
