import type { SkinDetail } from '@/lib/skins-server';

interface Props {
  skin: SkinDetail;
  canonicalUrl: string;
}

/**
 * Renders three side-by-side JSON-LD scripts:
 *   - Product (with current Offer)
 *   - BreadcrumbList (Home > Skins > Weapon > Skin)
 *
 * All numbers come from the SSR-resolved Skin row — no client calls here.
 */
export function SkinProductSchema({ skin, canonicalUrl }: Props) {
  const baseUrl = canonicalUrl.split('/skins/')[0];
  const price = skin.priceLatest ?? skin.priceMedian ?? skin.priceAvg ?? null;

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: skin.marketHashName,
    image: skin.imageUrl ?? undefined,
    description: `${skin.marketHashName} live price tracker across Steam Market, Skinport, and CSFloat. Historical price chart, float distribution, and free price alerts.`,
    sku: `cs2-${skin.id}`,
    brand: { '@type': 'Brand', name: 'Valve' },
    category: skin.weaponType ?? 'CS2 Skin',
    url: canonicalUrl,
    offers: price != null
      ? {
          '@type': 'Offer',
          price: price.toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: canonicalUrl,
          seller: { '@type': 'Organization', name: 'Steam Community Market' },
        }
      : undefined,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Skins', item: `${baseUrl}/skins` },
      {
        '@type': 'ListItem',
        position: 3,
        name: skin.weaponSlug.replace(/-/g, ' ').toUpperCase(),
        item: `${baseUrl}/skins/${skin.weaponSlug}`,
      },
      { '@type': 'ListItem', position: 4, name: skin.marketHashName, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </>
  );
}
