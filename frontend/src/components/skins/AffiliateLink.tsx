"use client";
import { analytics } from '@/lib/analytics';

interface Props {
  href: string;
  source: string;        // 'skinport' | 'csfloat' | 'csmoney' | 'steam'
  skinSlug: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Outbound affiliate / partner link. Fires PostHog `affiliate_click`
 * before navigation and uses `rel="sponsored nofollow noopener"` per
 * Google's link-tagging guidance.
 */
export function AffiliateLink({ href, source, skinSlug, children, className }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={className}
      onClick={() => {
        analytics.track({ name: 'affiliate_click', properties: { source, skin: skinSlug } });
      }}
    >
      {children}
    </a>
  );
}
